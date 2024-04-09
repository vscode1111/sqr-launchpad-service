import Bluebird from 'bluebird';
import { services } from 'index';
import { ServiceBroker } from 'moleculer';
import { DataSource, Repository } from 'typeorm';
import {
  EventNotifier,
  IdLock,
  MISSING_SERVICE_PRIVATE_KEY,
  Promisable,
  decodeData,
  getAddressFromSlot,
  toNumberDecimals,
} from '~common';
import {
  DeployNetworkKey,
  INDEXER_CONCURRENCY_COUNT,
  ServiceBrokerBase,
  findContracts,
  logInfo,
  processNetworkObject,
} from '~common-service';
import { TypedContractEvent, TypedDeferredTopicFilter } from '~typechain-types/common';
import { Web3BusEvent, Web3BusEventType } from '~types';
import { ContractSettings } from './EventStorageProcessor.types';
import { getChainConfig } from './constants';
import {
  Account,
  CBlock,
  CContract,
  CEvent,
  CTransaction,
  Contract,
  Event,
  Network,
  PBlock,
  PContract,
  PEvent,
  PTransaction,
  TransactionItem,
  TransactionItemTypes,
} from './entities';
import { StorageProcessor } from './types';

async function getTopic0(filter: TypedDeferredTopicFilter<TypedContractEvent>): Promise<string> {
  const topics = (await filter?.getTopicFilter()) as any as string[];
  if (topics.length === 0) {
    throw Error("Coundn't find filter for topic 0");
  }
  return topics[0];
}

const idLock = new IdLock();

export class EventStorageProcessor extends ServiceBrokerBase implements StorageProcessor {
  private stakeTopic0!: string;
  private claimTopic0!: string;
  private unstakeTopic0!: string;
  private topics0: string[];
  private contractsSettings: Record<string, ContractSettings> | null;

  constructor(
    broker: ServiceBroker,
    private dataSource: DataSource,
    private network: DeployNetworkKey,
    private eventNotifier: EventNotifier<Web3BusEvent>,
  ) {
    super(broker);

    this.topics0 = [];
    this.contractsSettings = null;
  }

  async start() {
    const context = services.getNetworkContext(this.network);
    if (!context) {
      throw MISSING_SERVICE_PRIVATE_KEY;
    }

    const { sqrLaunchpads } = context;
    const firstKey = Object.keys(sqrLaunchpads)[0];
    const firstSqrStaking = sqrLaunchpads[firstKey];

    this.stakeTopic0 = await this.setTopic0(firstSqrStaking.filters.Stake());
    this.claimTopic0 = await this.setTopic0(firstSqrStaking.filters.Claim());
    this.unstakeTopic0 = await this.setTopic0(firstSqrStaking.filters.Unstake());
  }

  private async fillContractsSettings(): Promise<boolean> {
    return await idLock.tryInvoke(`contracts-settings`, async () => {
      if (this.contractsSettings) {
        return true;
      }

      const context = services.getNetworkContext(this.network);
      if (!context) {
        throw MISSING_SERVICE_PRIVATE_KEY;
      }

      const { sqrLaunchpads } = context;

      await processNetworkObject(
        sqrLaunchpads,
        async (key) => {
          const sqrLaunchpad = sqrLaunchpads[key];

          const contractAddress = await sqrLaunchpad.getAddress();

          const rawDuration = await sqrLaunchpad.duration();
          const contractDuration = Number(rawDuration);

          if (Number.isNaN(contractDuration) || contractDuration === 0) {
            throw `Contract ${contractAddress} has no correct duration: ${rawDuration}`;
          }

          if (!this.contractsSettings) {
            this.contractsSettings = {};
          }

          this.contractsSettings[contractAddress] = {
            duration: contractDuration,
          };
        },
        true,
      );

      logInfo(this.broker, `Contracts settings: ${JSON.stringify(this.contractsSettings)}`);
      return true;
    });
  }

  async setTopic0(filter: TypedDeferredTopicFilter<TypedContractEvent>) {
    const topic0 = await getTopic0(filter);
    this.topics0.push(topic0);
    return topic0;
  }

  async setDataSource(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async getOrSaveAccount(address: string, accountRepostory: Repository<Account>) {
    return await idLock.tryInvoke<Account>(`account_${Account}`, async () => {
      let dbAccount = await accountRepostory.findOneBy({ address });
      if (!dbAccount) {
        dbAccount = new Account();
        dbAccount.address = address;
        await accountRepostory.save(dbAccount);
      }
      return dbAccount;
    });
  }

  private async saveTransactionItem({
    event,
    dbNetwork,
    type,
    eventType,
    transactionItemRepostory,
    accountRepostory,
  }: {
    event: Event;
    dbNetwork: Network;
    type: TransactionItemTypes;
    eventType: Web3BusEventType;
    transactionItemRepostory: Repository<TransactionItem>;
    accountRepostory: Repository<Account>;
  }): Promise<Web3BusEvent | null> {
    const dbTransactionItem = new TransactionItem();
    const networkId = dbNetwork.id;
    dbTransactionItem.networkId = networkId;
    dbTransactionItem.network = dbNetwork;
    dbTransactionItem.type = type;
    dbTransactionItem.contract = event.contract;
    dbTransactionItem.contract.networkId = networkId;
    dbTransactionItem.transaction = event.transactionHash;
    dbTransactionItem.transaction.networkId = networkId;
    const account = getAddressFromSlot(event.topic1);
    const dbAccount = await this.getOrSaveAccount(account, accountRepostory);
    dbTransactionItem.account = dbAccount;
    const eventData = decodeData(event.data!, ['uint32', 'uint256']);
    const { sqrDecimals } = getChainConfig(dbNetwork.name);
    const userStakeId = Number(eventData[0]);
    dbTransactionItem.userStakeId = userStakeId;
    const amount = toNumberDecimals(BigInt(eventData[1]), sqrDecimals);
    dbTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbTransactionItem.timestamp = timestamp;

    if (!this.contractsSettings) {
      return null;
    }

    const contractAddress = dbTransactionItem.contract.address;
    const contractSettings = this.contractsSettings[contractAddress];
    if (!contractSettings) {
      return null;
    }

    const contractDuration = contractSettings.duration;

    await transactionItemRepostory.save(dbTransactionItem);
    return {
      event: eventType,
      data: {
        network: dbNetwork.name as DeployNetworkKey,
        contractAddress,
        contractDuration,
        account,
        userStakeId,
        amount,
        timestamp,
        tx: event.transactionHash.hash,
      },
    };
  }

  private async createTransactionItem(
    event: Event,
    transactionItemRepostory: Repository<TransactionItem>,
    accountRepostory: Repository<Account>,
    networkRepository: Repository<Network>,
  ): Promise<Web3BusEvent | null> {
    if (!this.topics0.includes(event.topic0) || !event?.transactionHash?.input) {
      return null;
    }

    const dbNetwork = await networkRepository.findOneBy({ name: this.network });
    if (!dbNetwork) {
      return null;
    }

    if (!event.data) {
      return null;
    }

    if (!(await this.fillContractsSettings())) {
      return null;
    }

    if (event.topic0 === this.stakeTopic0) {
      return await this.saveTransactionItem({
        event,
        dbNetwork,
        type: 'stake',
        eventType: 'STAKE',
        transactionItemRepostory,
        accountRepostory,
      });
    } else if (event.topic0 === this.claimTopic0) {
      return await this.saveTransactionItem({
        event,
        dbNetwork,
        type: 'claim',
        eventType: 'CLAIM',
        transactionItemRepostory,
        accountRepostory,
      });
    } else if (event.topic0 === this.unstakeTopic0) {
      return await this.saveTransactionItem({
        event,
        dbNetwork,
        type: 'unstake',
        eventType: 'UNSTAKE',
        transactionItemRepostory,
        accountRepostory,
      });
    }
    return null;
  }

  async process(onProcessEvent?: (event: Event) => Promisable<void>) {
    await this.dataSource.transaction(async (entityManager) => {
      const networkRepository = entityManager.getRepository(Network);
      const contractRepository = entityManager.getRepository(Contract);
      const eventRepository = entityManager.getRepository(Event);
      const transactionItemRepostory = entityManager.getRepository(TransactionItem);
      const accountRepostory = entityManager.getRepository(Account);

      const contracts = await findContracts(contractRepository, networkRepository, this.network);

      await Bluebird.map(
        contracts,
        async (contract) => {
          const { address, processBlockNumber, syncBlockNumber } = contract;

          const from = processBlockNumber;
          const to = syncBlockNumber - 1;

          if (from > to) {
            return;
          }

          const events = await eventRepository
            .createQueryBuilder(CEvent)
            .leftJoin(PEvent('contract'), CContract)
            .leftJoin(PEvent('transactionHash'), CTransaction)
            .leftJoin(PTransaction('block'), CBlock)
            .select([
              PEvent('topic0'),
              PEvent('topic1'),
              PEvent('topic2'),
              PEvent('data'),
              PContract('address'),
              PTransaction('hash'),
              PTransaction('input'),
              PBlock('number'),
              PBlock('timestamp'),
            ])
            .where(`${PContract('address')} = :address`, { address })
            .andWhere(`${PBlock('number')} between ${from} and ${to}`)
            .addOrderBy(PBlock('number'), 'ASC')
            .getMany();

          for (const event of events) {
            const contractEvent = await this.createTransactionItem(
              event,
              transactionItemRepostory,
              accountRepostory,
              networkRepository,
            );
            if (contractEvent) {
              await this.eventNotifier.send(contractEvent);
            }
            if (onProcessEvent) {
              await onProcessEvent(event);
            }
          }

          contract.processBlockNumber = to + 1;
          await contractRepository.save(contract);
        },
        { concurrency: INDEXER_CONCURRENCY_COUNT },
      );
    });
  }
}
