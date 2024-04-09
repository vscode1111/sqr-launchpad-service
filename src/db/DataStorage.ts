import { ServiceBroker } from 'moleculer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Started, Stopped } from '~common';
import { DataStorageBase, DeployNetworkKey, deployNetworks, logInfo } from '~common-service';
import { DbWorkerStats } from '~core';
import { getContractData } from '~utils';
import { dataSourceConfig } from './dataSource';
import { Account, Contract, Event, Network, Transaction, TransactionItem } from './entities';
import { dbHardReset, dbSoftReset, mapContract } from './utils';

export class DataStorage extends DataStorageBase implements Started, Stopped {
  private accountRepostory!: Repository<Account>;
  private transactionItemRepostory!: Repository<TransactionItem>;

  constructor(broker: ServiceBroker) {
    super(broker, dataSourceConfig);
  }

  getDataSource() {
    return this.dataSource;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.accountRepostory = this.dataSource.getRepository(Account);
    this.transactionItemRepostory = this.dataSource.getRepository(TransactionItem);
    logInfo(this.broker, `Database was initialized`);

    await this.dataSource.transaction(async (entityManager) => {
      const networkRepository = entityManager.getRepository(Network);
      const contractRepository = entityManager.getRepository(Contract);
      const count = await contractRepository.count();
      if (count === 0) {
        for (const network of deployNetworks) {
          const dbNetwork = new Network();
          dbNetwork.name = network;
          await networkRepository.save(dbNetwork);

          const { sqrLaunchpadData } = getContractData(network);

          for (const sqrLaunchpadItem of sqrLaunchpadData) {
            if (sqrLaunchpadItem.disable) {
              continue;
            }

            const dbContract = new Contract();
            dbContract.address = sqrLaunchpadItem.address;
            dbContract.syncBlockNumber = sqrLaunchpadItem.blockNumber ?? 0;
            dbContract.processBlockNumber = sqrLaunchpadItem.blockNumber ?? 0;
            dbContract.network = dbNetwork;
            await contractRepository.save(dbContract);
          }
        }

        logInfo(this.broker, `Database was seeded`);
      }
    });
  }

  async getTableRowCounts(network?: DeployNetworkKey): Promise<DbWorkerStats> {
    let transactionFindOption: FindOptionsWhere<Transaction> = {};
    const eventFindOption: FindOptionsWhere<Event> = {};
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
    const contracts = await this.contractRepository.find();
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
