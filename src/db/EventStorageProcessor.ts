import Bluebird from 'bluebird';
import { Interface } from 'ethers';
import { services } from 'index';
import { ServiceBroker } from 'moleculer';
import { DataSource, Repository } from 'typeorm';
import {
  EventNotifier,
  IdLock,
  MISSING_SERVICE_PRIVATE_KEY,
  Promisable,
  decodeData,
  decodeInput,
  getAddressFromSlot,
  toNumberDecimals,
} from '~common';
import {
  DeployNetworkKey,
  INDEXER_CONCURRENCY_COUNT,
  ServiceBrokerBase,
  StorageProcessor,
  findContracts,
} from '~common-service';
import sqrLaunchpadABI from '~contracts/abi/SQRLaunchpad.json';
import { TypedContractEvent, TypedDeferredTopicFilter } from '~typechain-types/common';
import { Web3BusEvent, Web3BusEventType } from '~types';
import { DepositInput } from './EventStorageProcessor.types';
import { getChainConfig } from './constants';
import {
  Account,
  CBlock,
  CContract,
  CEvent,
  CTransaction,
  Contract,
  ContractType,
  Event,
  Network,
  PBlock,
  PContract,
  PEvent,
  PTransaction,
  TransactionItem,
  TransactionItemType,
} from './entities';

const CONTRACT_EVENT_ENABLE = false;

async function getTopic0(filter: TypedDeferredTopicFilter<TypedContractEvent>): Promise<string> {
  const topics = (await filter?.getTopicFilter()) as any as string[];
  if (topics.length === 0) {
    throw Error("Coundn't find filter for topic 0");
  }
  return topics[0];
}

const contractTypeToEventTypeMap: Record<ContractType, Web3BusEventType> = {
  fcfs: 'FCFS_DEPOSIT',
  'sqrp-gated': 'SQRP_GATED_DEPOSIT',
  'white-list': 'WHITE_LIST_DEPOSIT',
};

export class EventStorageProcessor extends ServiceBrokerBase implements StorageProcessor {
  private abiInterfaces!: Interface[];
  private currentAbiInterface!: Interface;
  private depositTopic0!: string;
  private topics0: string[];
  private idLock;

  constructor(
    broker: ServiceBroker,
    private dataSource: DataSource,
    private network: DeployNetworkKey,
    private eventNotifier: EventNotifier<Web3BusEvent>,
  ) {
    super(broker);

    this.topics0 = [];
    this.idLock = new IdLock();
  }

  async start() {
    this.abiInterfaces = [new Interface(sqrLaunchpadABI)];
    this.currentAbiInterface = this.abiInterfaces[0];

    const context = services.getNetworkContext(this.network);
    if (!context) {
      throw MISSING_SERVICE_PRIVATE_KEY;
    }

    const { sqrLaunchpads } = context;
    const firstKey = Object.keys(sqrLaunchpads)[0];
    const firstSqrStaking = sqrLaunchpads[firstKey];

    this.depositTopic0 = await this.setTopic0(firstSqrStaking.filters.Deposit());
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
    return await this.idLock.tryInvoke<Account>(`account_${Account}`, async () => {
      let dbAccount = await accountRepostory.findOneBy({ address });
      if (!dbAccount) {
        dbAccount = new Account();
        dbAccount.address = address;
        await accountRepostory.save(dbAccount);
      }
      return dbAccount;
    });
  }

  private tryDecode<T>(transactionInput: string) {
    let error;

    try {
      return decodeInput<T>(transactionInput, this.currentAbiInterface);
    } catch (e) {
      error = e;
    }

    for (const abiInterface of this.abiInterfaces) {
      if (abiInterface === this.currentAbiInterface) {
        continue;
      }
      try {
        const result = decodeInput<T>(transactionInput, abiInterface);
        this.currentAbiInterface = abiInterface;
        return result;
      } catch (e) {
        error = e;
      }
    }
    throw error;
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
    type: TransactionItemType;
    eventType: Web3BusEventType;
    transactionItemRepostory: Repository<TransactionItem>;
    accountRepostory: Repository<Account>;
  }): Promise<Web3BusEvent | null> {
    const decodedDepositInput = this.tryDecode<DepositInput>(event.transactionHash.input);
    const userId = decodedDepositInput.userId;
    const transactionId = decodedDepositInput.transactionId;
    const isSig = decodedDepositInput.signature !== undefined;

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
    const eventData = decodeData(event.data!, ['uint256']);
    const { sqrDecimals } = getChainConfig(dbNetwork.name);
    dbTransactionItem.userId = userId;
    dbTransactionItem.transactionId = transactionId;
    dbTransactionItem.isSig = isSig;
    const amount = toNumberDecimals(BigInt(eventData[0]), sqrDecimals);
    dbTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbTransactionItem.timestamp = timestamp;

    const contractAddress = dbTransactionItem.contract.address;

    await transactionItemRepostory.save(dbTransactionItem);
    return {
      event: eventType,
      data: {
        network: dbNetwork.name as DeployNetworkKey,
        contractAddress,
        userId,
        transactionId,
        isSig,
        account,
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

    if (event.topic0 === this.depositTopic0) {
      return await this.saveTransactionItem({
        event,
        dbNetwork,
        type: 'deposit',
        // eventType: 'FCFS_DEPOSIT',
        eventType: contractTypeToEventTypeMap[event.contract.type],
        transactionItemRepostory,
        accountRepostory,
      });
    }

    return null;
  }

  async process(
    onProcessEvent?: (event: Event) => Promisable<void>,
    onContractEvent?: (event: Web3BusEvent) => Promisable<void>,
  ) {
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
              PContract('type'),
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

            if (onProcessEvent) {
              await onProcessEvent(event);
            }

            if (contractEvent && CONTRACT_EVENT_ENABLE) {
              await this.eventNotifier.send(contractEvent);
              if (onContractEvent) {
                await onContractEvent(contractEvent);
              }
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
