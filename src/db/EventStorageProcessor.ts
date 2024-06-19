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
  CacheMachine,
  DB_CONCURRENCY_COUNT,
  DeployNetworkKey,
  ServiceBrokerBase,
  StorageProcessor,
  findContracts,
} from '~common-service';
import sqrPaymentGatewayABI from '~contracts/abi/SQRPaymentGateway.json';
import sqrpProRataABI from '~contracts/abi/SQRpProRata.json';
import { SqrLaunchpadContext } from '~services';
import { TypedContractEvent, TypedDeferredTopicFilter } from '~typechain-types/common';
import { Web3BusEvent, Web3BusEventType } from '~types';
import { getCacheContractSettingKey } from '~utils';
import { PaymentGatewayDepositInput, ProRataDepositInput } from './EventStorageProcessor.types';
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
  ProRataTransactionItemType,
  VestingTransactionItem,
} from './entities';
import { ProRataTransactionItem } from './entities/process/ProRataTransactionItem';

const CONTRACT_EVENT_ENABLE = true;

async function getTopic0(filter: TypedDeferredTopicFilter<TypedContractEvent>): Promise<string> {
  const topics = (await filter?.getTopicFilter()) as any as string[];
  if (topics.length === 0) {
    throw Error("Couldn't find filter for topic 0");
  }
  return topics[0];
}

const contractTypeToEventTypeMap: Record<ContractType, Web3BusEventType> = {
  fcfs: 'PAYMENT_GATEWAY',
  'sqrp-gated': 'PAYMENT_GATEWAY',
  'white-list': 'PAYMENT_GATEWAY',
  vesting: 'VESTING',
  'pro-rata': 'PRO_RATA',
  'pro-rata-sqrp-gated': 'PRO_RATA',
};

function isWeb3BusEventType(contractType: ContractType, eventType: Web3BusEventType) {
  return contractTypeToEventTypeMap[contractType] === eventType;
}

export class EventStorageProcessor extends ServiceBrokerBase implements StorageProcessor {
  private sqrPaymentGatewayAbiInterfaces!: Interface[];
  private sqrPaymentGatewayCurrentAbiInterface!: Interface;
  private sqrpProRataAbiInterfaces!: Interface[];
  private sqrpProRataCurrentAbiInterface!: Interface;
  private paymentGatewayDepositTopic0!: string;
  private vestingClaimTopic0!: string;
  private proRataDepositTopic0!: string;
  private proRataRefundTopic0!: string;
  private topics0: string[];
  private idLock;
  private cacheMachine: CacheMachine;
  private context!: SqrLaunchpadContext;

  constructor(
    broker: ServiceBroker,
    private dataSource: DataSource,
    private network: DeployNetworkKey,
    private eventNotifier: EventNotifier<Web3BusEvent>,
  ) {
    super(broker);

    this.topics0 = [];
    this.idLock = new IdLock();
    this.cacheMachine = new CacheMachine();
  }

  async start() {
    this.sqrPaymentGatewayAbiInterfaces = [new Interface(sqrPaymentGatewayABI)];
    this.sqrPaymentGatewayCurrentAbiInterface = this.sqrPaymentGatewayAbiInterfaces[0];

    this.sqrPaymentGatewayAbiInterfaces = [new Interface(sqrpProRataABI)];
    this.sqrpProRataCurrentAbiInterface = this.sqrPaymentGatewayAbiInterfaces[0];

    const context = services.getNetworkContext(this.network);
    if (!context) {
      throw MISSING_SERVICE_PRIVATE_KEY;
    }
    this.context = context;

    const { firstSqrPaymentGateway, firstSqrVesting, firstSqrpProRata } = context;
    this.paymentGatewayDepositTopic0 = await this.setTopic0(
      firstSqrPaymentGateway.filters.Deposit(),
    );

    this.vestingClaimTopic0 = await this.setTopic0(firstSqrVesting.filters.Claim());

    this.proRataDepositTopic0 = await this.setTopic0(firstSqrpProRata.filters.Deposit());
    this.proRataRefundTopic0 = await this.setTopic0(firstSqrpProRata.filters.Refund());
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

  private tryDecode<T>(
    transactionInput: string,
    abiInterfaces: Interface[],
    currentAbiInterface: Interface,
  ) {
    let error;

    try {
      return decodeInput<T>(transactionInput, currentAbiInterface);
    } catch (e) {
      error = e;
    }

    for (const abiInterface of abiInterfaces) {
      if (abiInterface === currentAbiInterface) {
        continue;
      }
      try {
        const result = decodeInput<T>(transactionInput, abiInterface);
        currentAbiInterface = abiInterface;
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
    contractType,
    paymentGatewayTransactionItemRepository,
    accountRepository,
  }: {
    event: Event;
    dbNetwork: Network;
    contractType: ContractType;
    paymentGatewayTransactionItemRepository: Repository<PaymentGatewayTransactionItem>;
    accountRepository: Repository<Account>;
  }): Promise<Web3BusEvent | null> {
    const contractAddress = event.contract.address;
    const network = dbNetwork.name as DeployNetworkKey;

    const decodedDepositInput = this.tryDecode<PaymentGatewayDepositInput>(
      event.transactionHash.input,
      this.sqrPaymentGatewayAbiInterfaces,
      this.sqrPaymentGatewayCurrentAbiInterface,
    );
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

    const { getSqrPaymentGateway, getErc20Token } = this.context;
    const decimals = await this.cacheMachine.call(
      () => getCacheContractSettingKey(network, contractAddress),
      async () => {
        const tokenAddress = await getSqrPaymentGateway(contractAddress).erc20Token();
        return getErc20Token(tokenAddress).decimals();
      },
    );

    dbPaymentGatewayTransactionItem.userId = userId;
    dbPaymentGatewayTransactionItem.transactionId = transactionId;
    dbPaymentGatewayTransactionItem.isSig = isSig;
    const amount = toNumberDecimals(BigInt(eventData[0]), decimals);
    dbPaymentGatewayTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbPaymentGatewayTransactionItem.timestamp = timestamp;

    await paymentGatewayTransactionItemRepository.save(dbPaymentGatewayTransactionItem);
    return {
      event: 'PAYMENT_GATEWAY_CONTRACT_DEPOSIT',
      data: {
        network,
        contractType,
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
    const contractAddress = event.contract.address;
    const network = dbNetwork.name as DeployNetworkKey;

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

    const { getSqrVesting, getErc20Token } = this.context;
    const decimals = await this.cacheMachine.call(
      () => getCacheContractSettingKey(network, contractAddress),
      async () => {
        const tokenAddress = await getSqrVesting(contractAddress).erc20Token();
        return getErc20Token(tokenAddress).decimals();
      },
    );

    const amount = toNumberDecimals(BigInt(eventData[0]), decimals);
    dbVestingTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbVestingTransactionItem.timestamp = timestamp;

    await vestingTransactionItemRepository.save(dbVestingTransactionItem);
    return {
      event: 'VESTING_CONTRACT_CLAIM',
      data: {
        network,
        contractAddress,
        account,
        amount,
        timestamp,
        tx: event.transactionHash.hash,
      },
    };
  }

  private async saveProRataTransactionItem({
    event,
    dbNetwork,
    contractType,
    proRataTransactionItemType,
    proRataTransactionItemRepository,
    accountRepository,
  }: {
    event: Event;
    dbNetwork: Network;
    contractType: ContractType;
    proRataTransactionItemType: ProRataTransactionItemType;
    proRataTransactionItemRepository: Repository<ProRataTransactionItem>;
    accountRepository: Repository<Account>;
  }): Promise<Web3BusEvent | null> {
    const contractAddress = event.contract.address;
    const network = dbNetwork.name as DeployNetworkKey;

    const isDeposit = proRataTransactionItemType === 'deposit';

    let transactionId;
    let isSig;

    const dbProRataTransactionItem = new ProRataTransactionItem();

    if (isDeposit) {
      const decodedDepositInput = this.tryDecode<ProRataDepositInput>(
        event.transactionHash.input,
        this.sqrpProRataAbiInterfaces,
        this.sqrpProRataCurrentAbiInterface,
      );
      transactionId = decodedDepositInput.transactionId;
      isSig = decodedDepositInput.signature !== undefined;

      dbProRataTransactionItem.transactionId = transactionId;
      dbProRataTransactionItem.isSig = isSig;
    }

    const networkId = dbNetwork.id;
    dbProRataTransactionItem.networkId = networkId;
    dbProRataTransactionItem.network = dbNetwork;
    dbProRataTransactionItem.type = proRataTransactionItemType;
    dbProRataTransactionItem.contract = event.contract;
    dbProRataTransactionItem.contract.networkId = networkId;
    dbProRataTransactionItem.transaction = event.transactionHash;
    dbProRataTransactionItem.transaction.networkId = networkId;
    const account = getAddressFromSlot(event.topic1);
    const dbAccount = await this.getOrSaveAccount(account, accountRepository);
    dbProRataTransactionItem.account = dbAccount;
    const eventData = decodeData(event.data!, ['uint256']);

    const { getSqrpProRata, getErc20Token } = this.context;
    const decimals = await this.cacheMachine.call(
      () => getCacheContractSettingKey(network, contractAddress),
      async () => {
        const tokenAddress = await getSqrpProRata(contractAddress).baseToken();
        return getErc20Token(tokenAddress).decimals();
      },
    );

    const amount = toNumberDecimals(BigInt(eventData[0]), decimals);
    dbProRataTransactionItem.amount = amount;
    const timestamp = event.transactionHash.block.timestamp;
    dbProRataTransactionItem.timestamp = timestamp;

    await proRataTransactionItemRepository.save(dbProRataTransactionItem);

    const tx = event.transactionHash.hash;

    if (proRataTransactionItemType === 'deposit') {
      return {
        event: 'PRO_RATA_CONTRACT_DEPOSIT',
        data: {
          network,
          contractType,
          contractAddress,
          account,
          amount,
          transactionId,
          isSig,
          timestamp,
          tx,
        },
      };
    } else {
      return {
        event: 'PRO_RATA_CONTRACT_REFUND',
        data: {
          network,
          contractType,
          contractAddress,
          account,
          amount,
          timestamp,
          tx,
        },
      };
    }
  }

  private async createTransactionItem(
    event: Event,
    paymentGatewayTransactionItemRepository: Repository<PaymentGatewayTransactionItem>,
    vestingTransactionItemRepository: Repository<VestingTransactionItem>,
    proRataTransactionItemRepository: Repository<ProRataTransactionItem>,
    accountRepository: Repository<Account>,
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

    const contractType = event.contract.type;

    if (isWeb3BusEventType(event.contract.type, 'PAYMENT_GATEWAY')) {
      if (event.topic0 === this.paymentGatewayDepositTopic0) {
        return this.savePaymentGatewayTransactionItem({
          event,
          dbNetwork,
          contractType,
          paymentGatewayTransactionItemRepository,
          accountRepository,
        });
      }
    } else if (isWeb3BusEventType(event.contract.type, 'VESTING')) {
      if (event.topic0 === this.vestingClaimTopic0) {
        return this.saveVestingTransactionItem({
          event,
          dbNetwork,
          vestingTransactionItemRepository,
          accountRepository,
        });
      }
    } else if (isWeb3BusEventType(event.contract.type, 'PRO_RATA')) {
      if (event.topic0 === this.proRataDepositTopic0) {
        return this.saveProRataTransactionItem({
          event,
          dbNetwork,
          contractType,
          proRataTransactionItemType: 'deposit',
          proRataTransactionItemRepository,
          accountRepository,
        });
      } else if (event.topic0 === this.proRataRefundTopic0) {
        return this.saveProRataTransactionItem({
          event,
          dbNetwork,
          contractType,
          proRataTransactionItemType: 'refund',
          proRataTransactionItemRepository,
          accountRepository,
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
      const proRataTransactionItemRepository = entityManager.getRepository(ProRataTransactionItem);
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
              proRataTransactionItemRepository,
              accountRepository,
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
        { concurrency: DB_CONCURRENCY_COUNT },
      );
    });
  }
}
