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
  logInfo,
} from '~common-service';
import sqrPaymentGatewayABI from '~contracts/abi/SQRPaymentGateway.json';
import { TypedContractEvent, TypedDeferredTopicFilter } from '~typechain-types/common';
import { Web3BusEvent, Web3BusEventType, Web3BusPaymentGatewayEventType } from '~types';
import { ContractSettings, DepositInput } from './EventStorageProcessor.types';
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
  PaymentGatewayTransactionItem,
  VestingTransactionItem,
} from './entities';

const CONTRACT_EVENT_ENABLE = false;

async function getTopic0(filter: TypedDeferredTopicFilter<TypedContractEvent>): Promise<string> {
  const topics = (await filter?.getTopicFilter()) as any as string[];
  if (topics.length === 0) {
    throw Error("Couldn't find filter for topic 0");
  }
  return topics[0];
}

const contractTypeToEventTypeMap: Record<ContractType, Web3BusEventType> = {
  fcfs: 'FCFS_DEPOSIT',
  'sqrp-gated': 'SQRP_GATED_DEPOSIT',
  'white-list': 'WHITE_LIST_DEPOSIT',
  vesting: 'VESTING_CLAIM',
};

const paymentGatewayTypes: ContractType[] = ['fcfs', 'sqrp-gated', 'white-list'];

function isPaymentGatewayType(contractType: ContractType) {
  return paymentGatewayTypes.includes(contractType);
}

export class EventStorageProcessor extends ServiceBrokerBase implements StorageProcessor {
  private abiInterfaces!: Interface[];
  private currentAbiInterface!: Interface;
  private paymentGatewayDepositTopic0!: string;
  private vestingClaimTopic0!: string;
  private topics0: string[];
  private idLock;
  private contractsSettings: Record<string, ContractSettings> | null;

  constructor(
    broker: ServiceBroker,
    private dataSource: DataSource,
    private network: DeployNetworkKey,
    private eventNotifier: EventNotifier<Web3BusEvent>,
  ) {
    super(broker);

    this.topics0 = [];
    this.idLock = new IdLock();
    this.contractsSettings = null;
  }

  async start() {
    this.abiInterfaces = [new Interface(sqrPaymentGatewayABI)];
    this.currentAbiInterface = this.abiInterfaces[0];

    const context = services.getNetworkContext(this.network);
    if (!context) {
      throw MISSING_SERVICE_PRIVATE_KEY;
    }

    const { firstSqrPaymentGateway, firstSqrVesting } = context;
    this.paymentGatewayDepositTopic0 = await this.setTopic0(
      firstSqrPaymentGateway.filters.Deposit(),
    );
    this.vestingClaimTopic0 = await this.setTopic0(firstSqrVesting.filters.Claim());
  }

  private saveSettings(contractAddress: string, tokenAddress: string, rawErc20Decimals: bigint) {
    const erc20Decimals = Number(rawErc20Decimals);

    if (Number.isNaN(erc20Decimals) || erc20Decimals === 0) {
      throw `Contract ${contractAddress} and token ${tokenAddress} has no correct decimals: ${rawErc20Decimals}`;
    }

    if (!this.contractsSettings) {
      this.contractsSettings = {};
    }

    this.contractsSettings[contractAddress] = {
      erc20Decimals,
    };
  }

  private async fillContractsSettings(contractRepository: Repository<Contract>): Promise<boolean> {
    return await this.idLock.tryInvoke(`contracts-settings`, async () => {
      if (this.contractsSettings) {
        return true;
      }

      const context = services.getNetworkContext(this.network);
      if (!context) {
        throw MISSING_SERVICE_PRIVATE_KEY;
      }

      const { getSqrPaymentGateway, getSqrVesting, getErc20Token } = context;

      const contracts = await contractRepository.find();

      await Bluebird.map(
        contracts,
        async (contract) => {
          const contractAddress = contract.address;

          if (isPaymentGatewayType(contract.type)) {
            const tokenAddress = await getSqrPaymentGateway(contractAddress).erc20Token();
            const erc20Decimals = await getErc20Token(tokenAddress).decimals();
            this.saveSettings(contractAddress, tokenAddress, erc20Decimals);
          } else if (contract.type === 'vesting') {
            const tokenAddress = await getSqrVesting(contract.address).erc20Token();
            const erc20Decimals = await getErc20Token(tokenAddress).decimals();
            this.saveSettings(contractAddress, tokenAddress, erc20Decimals);
          }
        },
        {
          concurrency: INDEXER_CONCURRENCY_COUNT,
        },
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

  async getOrSaveAccount(address: string, accountRepository: Repository<Account>) {
    return await this.idLock.tryInvoke<Account>(`account_${Account}`, async () => {
      let dbAccount = await accountRepository.findOneBy({ address });
      if (!dbAccount) {
        dbAccount = new Account();
        dbAccount.address = address;
        await accountRepository.save(dbAccount);
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

  private async savePaymentGatewayTransactionItem({
    event,
    dbNetwork,
    eventType,
    paymentGatewayTransactionItemRepository,
    accountRepository,
  }: {
    event: Event;
    dbNetwork: Network;
    eventType: Web3BusPaymentGatewayEventType;
    paymentGatewayTransactionItemRepository: Repository<PaymentGatewayTransactionItem>;
    accountRepository: Repository<Account>;
  }): Promise<Web3BusEvent | null> {
    if (!this.contractsSettings) {
      return null;
    }

    const contractAddress = event.contract.address;

    const decodedDepositInput = this.tryDecode<DepositInput>(event.transactionHash.input);
    const userId = decodedDepositInput.userId;
    const transactionId = decodedDepositInput.transactionId;
    const isSig = decodedDepositInput.signature !== undefined;

    const dbPaymentGatewayTransactionItem = new PaymentGatewayTransactionItem();

    const networkId = dbNetwork.id;
    dbPaymentGatewayTransactionItem.networkId = networkId;
    dbPaymentGatewayTransactionItem.network = dbNetwork;
    dbPaymentGatewayTransactionItem.contract = event.contract;
    dbPaymentGatewayTransactionItem.contract.networkId = networkId;
    dbPaymentGatewayTransactionItem.transaction = event.transactionHash;
    dbPaymentGatewayTransactionItem.transaction.networkId = networkId;
    const account = getAddressFromSlot(event.topic1);
    const dbAccount = await this.getOrSaveAccount(account, accountRepository);
    dbPaymentGatewayTransactionItem.account = dbAccount;
    const eventData = decodeData(event.data!, ['uint256']);
    const { erc20Decimals } = this.contractsSettings[contractAddress];
    dbPaymentGatewayTransactionItem.userId = userId;
    dbPaymentGatewayTransactionItem.transactionId = transactionId;
    dbPaymentGatewayTransactionItem.isSig = isSig;
    const amount = toNumberDecimals(BigInt(eventData[0]), erc20Decimals);
    dbPaymentGatewayTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbPaymentGatewayTransactionItem.timestamp = timestamp;

    await paymentGatewayTransactionItemRepository.save(dbPaymentGatewayTransactionItem);
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

  private async saveVestingTransactionItem({
    event,
    dbNetwork,
    vestingTransactionItemRepository,
    accountRepository,
  }: {
    event: Event;
    dbNetwork: Network;
    vestingTransactionItemRepository: Repository<VestingTransactionItem>;
    accountRepository: Repository<Account>;
  }): Promise<Web3BusEvent | null> {
    if (!this.contractsSettings) {
      return null;
    }

    const contractAddress = event.contract.address;

    const dbVestingTransactionItem = new VestingTransactionItem();
    const networkId = dbNetwork.id;
    dbVestingTransactionItem.networkId = networkId;
    dbVestingTransactionItem.network = dbNetwork;
    dbVestingTransactionItem.contract = event.contract;
    dbVestingTransactionItem.contract.networkId = networkId;
    dbVestingTransactionItem.transaction = event.transactionHash;
    dbVestingTransactionItem.transaction.networkId = networkId;
    const account = getAddressFromSlot(event.topic1);
    const dbAccount = await this.getOrSaveAccount(account, accountRepository);
    dbVestingTransactionItem.account = dbAccount;
    const eventData = decodeData(event.data!, ['uint256']);
    const { erc20Decimals } = this.contractsSettings[contractAddress];
    const amount = toNumberDecimals(BigInt(eventData[0]), erc20Decimals);
    dbVestingTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbVestingTransactionItem.timestamp = timestamp;

    await vestingTransactionItemRepository.save(dbVestingTransactionItem);
    return {
      event: 'VESTING_CLAIM',
      data: {
        network: dbNetwork.name as DeployNetworkKey,
        contractAddress,
        account,
        amount,
        timestamp,
        tx: event.transactionHash.hash,
      },
    };
  }

  private async createTransactionItem(
    event: Event,
    paymentGatewayTransactionItemRepository: Repository<PaymentGatewayTransactionItem>,
    vestingTransactionItemRepository: Repository<VestingTransactionItem>,
    accountRepository: Repository<Account>,
    networkRepository: Repository<Network>,
    contractRepository: Repository<Contract>,
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

    if (!(await this.fillContractsSettings(contractRepository))) {
      return null;
    }

    if (isPaymentGatewayType(event.contract.type)) {
      if (event.topic0 === this.paymentGatewayDepositTopic0) {
        return this.savePaymentGatewayTransactionItem({
          event,
          dbNetwork,
          eventType: contractTypeToEventTypeMap[
            event.contract.type
          ] as Web3BusPaymentGatewayEventType,
          paymentGatewayTransactionItemRepository,
          accountRepository: accountRepository,
        });
      }
    } else if (event.contract.type === 'vesting') {
      if (event.topic0 === this.vestingClaimTopic0) {
        return this.saveVestingTransactionItem({
          event,
          dbNetwork,
          vestingTransactionItemRepository,
          accountRepository: accountRepository,
        });
      }
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
      const paymentGatewayTransactionItemRepository = entityManager.getRepository(
        PaymentGatewayTransactionItem,
      );
      const vestingTransactionItemRepository = entityManager.getRepository(VestingTransactionItem);
      const accountRepository = entityManager.getRepository(Account);

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
              paymentGatewayTransactionItemRepository,
              vestingTransactionItemRepository,
              accountRepository,
              networkRepository,
              contractRepository,
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
