import { WorkerBase } from '~common-service';
import { DataStorage } from '~db';
import { DbWorkerConfig, DbWorkerStats } from './DbWorker.types';

export class DbWorker extends WorkerBase<DbWorkerStats> {
  public statsData!: DbWorkerStats;
  private dataStorage: DataStorage;

  constructor({ broker, network, workerName, tickDivider, dataStorage }: DbWorkerConfig) {
    super(broker, network, workerName, tickDivider);
    this.dataStorage = dataStorage;
    this.reset();
  }

  async start(): Promise<void> {}

  public async work() {
    this.statsData = await this.dataStorage.getTableRowCounts(this.network);
  }

  async getStats(): Promise<DbWorkerStats> {
    return { ...this.statsData };
  }

  reset() {
    this.statsData = {
      contracts: [],
      _transaction: 0,
      _events: 0,
      paymentGatewayTransactionItems: 0,
      vestingTransactionItems: 0,
    };
  }
}
