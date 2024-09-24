import { ServiceBroker } from 'moleculer';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Started, Stopped } from '~common';
import { DataStorageBase, DeployNetworkKey, getContractData, logInfo } from '~common-service';
import { DbWorkerStats } from '~core';
import { dataSourceConfig } from './dataSource';
import { Account, PaymentGatewayTransactionItem, VestingTransactionItem } from './entities';
import { ProRataTransactionItem } from './entities/process/ProRataTransactionItem';
import { dbHardReset, dbSoftReset } from './utils';

export class DataStorage extends DataStorageBase implements Started, Stopped {
  private accountRepository!: Repository<Account>;
  private paymentGatewayTransactionItemRepository!: Repository<PaymentGatewayTransactionItem>;
  private vestingTransactionItemRepository!: Repository<VestingTransactionItem>;
  private proRataTransactionItemRepository!: Repository<ProRataTransactionItem>;

  constructor(broker: ServiceBroker) {
    super(broker, dataSourceConfig, (network) => getContractData(network));
  }

  getDataSource() {
    return this.dataSource;
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.accountRepository = this.dataSource.getRepository(Account);
    this.paymentGatewayTransactionItemRepository = this.dataSource.getRepository(
      PaymentGatewayTransactionItem,
    );
    this.vestingTransactionItemRepository = this.dataSource.getRepository(VestingTransactionItem);
    this.proRataTransactionItemRepository = this.dataSource.getRepository(ProRataTransactionItem);
    logInfo(this.broker, `Database was initialized`);
  }

  async getTableRowCounts(network?: DeployNetworkKey): Promise<DbWorkerStats> {
    const statsBase = await super.getTableRowCounts(network);

    let paymentGatewayTransactionItemFindOption: FindOptionsWhere<PaymentGatewayTransactionItem> =
      {};
    let vestingTransactionItemFindOption: FindOptionsWhere<VestingTransactionItem> = {};
    let proRataTransactionItemFindOption: FindOptionsWhere<ProRataTransactionItem> = {};

    if (network) {
      const dbNetwork = await this.getNetwork(network);
      const networkId = dbNetwork.id;

      paymentGatewayTransactionItemFindOption = {
        networkId,
      };

      vestingTransactionItemFindOption = {
        networkId,
      };

      proRataTransactionItemFindOption = {
        networkId,
      };
    }

    const paymentGatewayTransactionItems =
      await this.paymentGatewayTransactionItemRepository.countBy(
        paymentGatewayTransactionItemFindOption,
      );
    const vestingTransactionItems = await this.vestingTransactionItemRepository.countBy(
      vestingTransactionItemFindOption,
    );
    const proRataTransactionItems = await this.proRataTransactionItemRepository.countBy(
      proRataTransactionItemFindOption,
    );

    return {
      ...statsBase,
      paymentGatewayTransactionItems,
      vestingTransactionItems,
      proRataTransactionItems,
    };
  }

  public async getPaymentGatewayTransactionItemByTransactionId(
    transactionId: string,
  ): Promise<PaymentGatewayTransactionItem | null> {
    return this.paymentGatewayTransactionItemRepository.findOneBy({
      transactionId,
    });
  }

  public async getProRataTransactionItemByTransactionId(
    transactionId: string,
  ): Promise<ProRataTransactionItem | null> {
    return this.proRataTransactionItemRepository.findOneBy({
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
    return this.paymentGatewayTransactionItemRepository.findBy({
      account: {
        address,
      },
    });
  }

  public async getTransactionItems(): Promise<PaymentGatewayTransactionItem[]> {
    return this.paymentGatewayTransactionItemRepository.find();
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
