import { ServiceBroker } from 'moleculer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Started, Stopped } from '~common';
import { DataStorageBase, DeployNetworkKey, logInfo, mapContract } from '~common-service';
import { DbWorkerStats } from '~core';
import { getContractData } from '~utils';
import { dataSourceConfig } from './dataSource';
import { Account, Event, Transaction, TransactionItem } from './entities';
import { dbHardReset, dbSoftReset } from './utils';

export class DataStorage extends DataStorageBase implements Started, Stopped {
  private accountRepostory!: Repository<Account>;
  private transactionItemRepostory!: Repository<TransactionItem>;

  constructor(broker: ServiceBroker) {
    super(broker, dataSourceConfig, (network) => getContractData(network).sqrLaunchpadData);
  }

  getDataSource() {
    return this.dataSource;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.accountRepostory = this.dataSource.getRepository(Account);
    this.transactionItemRepostory = this.dataSource.getRepository(TransactionItem);
    logInfo(this.broker, `Database was initialized`);
  }

  async getTableRowCounts(network?: DeployNetworkKey): Promise<DbWorkerStats> {
    let transactionFindOption: FindOptionsWhere<Transaction> = {};
    let eventFindOption: FindOptionsWhere<Event> = {};
    let transactionItemFindOption: FindOptionsWhere<TransactionItem> = {};
    if (network) {
      const dbNetwork = await this.getNetwork(network);

      transactionFindOption = {
        networkId: dbNetwork.id,
      };

      eventFindOption.contract = {
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
    const _transaction = await this.transactionRepostory.countBy(transactionFindOption);
    const _events = await this.eventRepository.countBy(eventFindOption);
    const transactionItems = await this.transactionItemRepostory.countBy(transactionItemFindOption);

    return {
      contracts: contracts.map(mapContract),
      _transaction,
      _events,
      transactionItems,
    };
  }

  public async getAccount(address: string): Promise<Account | null> {
    return this.accountRepostory.findOneBy({
      address,
    });
  }

  public async getAccounts(): Promise<Account[]> {
    return this.accountRepostory.find();
  }

  public async saveAccount(address: string): Promise<Account> {
    const dbAccount = new Account();
    dbAccount.address = address;
    return this.accountRepostory.save(dbAccount);
  }

  public async getTransactionItemsByAccount(address: string): Promise<TransactionItem[]> {
    return this.transactionItemRepostory.findBy({
      account: {
        address,
      },
    });
  }

  public async getTransactionItems(): Promise<TransactionItem[]> {
    return this.transactionItemRepostory.find();
  }

  public async findAccount(address: string): Promise<Account | null> {
    return this.accountRepostory.findOneBy({ address });
  }

  async hardReset(): Promise<void> {
    await dbHardReset(this.dataSource);
    await super.hardReset();
  }

  public async softReset() {
    await dbSoftReset(this.dataSource);
  }
}
