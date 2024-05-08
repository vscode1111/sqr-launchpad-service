import { ServiceBroker } from 'moleculer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Started, Stopped } from '~common';
import { DataStorageBase, DeployNetworkKey, logInfo, mapContract } from '~common-service';
import { DbWorkerStats } from '~core';
import { getContractData } from '~utils';
import { dataSourceConfig } from './dataSource';
import { Account, Event, PaymentGatewayTransactionItem, Transaction } from './entities';
import { dbHardReset, dbSoftReset } from './utils';

export class DataStorage extends DataStorageBase implements Started, Stopped {
  private accountRepository!: Repository<Account>;
  private transactionItemRepository!: Repository<PaymentGatewayTransactionItem>;

  constructor(broker: ServiceBroker) {
    super(broker, dataSourceConfig, (network) => getContractData(network).sqrLaunchpadData);
  }

  getDataSource() {
    return this.dataSource;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.accountRepository = this.dataSource.getRepository(Account);
    this.transactionItemRepository = this.dataSource.getRepository(PaymentGatewayTransactionItem);
    logInfo(this.broker, `Database was initialized`);
  }

  async getTableRowCounts(network?: DeployNetworkKey): Promise<DbWorkerStats> {
    let transactionFindOption: FindOptionsWhere<Transaction> = {};
    let eventFindOption: FindOptionsWhere<Event> = {};
    let transactionItemFindOption: FindOptionsWhere<PaymentGatewayTransactionItem> = {};
    if (network) {
      const dbNetwork = await this.getNetwork(network);

      transactionFindOption = {
        networkId: dbNetwork.id,
      };

      eventFindOption = {
        networkId: dbNetwork.id,
      };

      transactionItemFindOption = {
        networkId: dbNetwork.id,
      };
    }
    const contracts = await this.contractRepository.find({
      order: {
        id: 'ASC',
      },
    });
    const _transaction = await this.transactionRepository.countBy(transactionFindOption);
    const _events = await this.eventRepository.countBy(eventFindOption);
    const paymentGatewayTransactionItems =
      await this.transactionItemRepository.countBy(transactionItemFindOption);

    return {
      contracts: contracts.map(mapContract),
      _transaction,
      _events,
      paymentGatewayTransactionItems,
    };
  }

  public async getTransactionItemByTransactionId(
    transactionId: string,
  ): Promise<PaymentGatewayTransactionItem | null> {
    return this.transactionItemRepository.findOneBy({
      transactionId,
    });
  }

  public async getAccount(address: string): Promise<Account | null> {
    return this.accountRepository.findOneBy({
      address,
    });
  }

  public async getAccounts(): Promise<Account[]> {
    return this.accountRepository.find();
  }

  public async saveAccount(address: string): Promise<Account> {
    const dbAccount = new Account();
    dbAccount.address = address;
    return this.accountRepository.save(dbAccount);
  }

  public async getTransactionItemsByAccount(
    address: string,
  ): Promise<PaymentGatewayTransactionItem[]> {
    return this.transactionItemRepository.findBy({
      account: {
        address,
      },
    });
  }

  public async getTransactionItems(): Promise<PaymentGatewayTransactionItem[]> {
    return this.transactionItemRepository.find();
  }

  public async findAccount(address: string): Promise<Account | null> {
    return this.accountRepository.findOneBy({ address });
  }

  async hardReset(): Promise<void> {
    await dbHardReset(this.dataSource);
    await super.hardReset();
  }

  public async softReset() {
    await dbSoftReset(this.dataSource);
  }
}
