import { calculateDiffSecFromNow } from '~common';
import { WorkerBase } from '~common-service';
import { DataStorage } from '~db';
import { DbWorkerConfig, DbWorkerStats } from './DbWorker.types';

const LAST_EXTERNAL_REQUEST_LIMIT = 10;

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
    const diffFromLastRequest = calculateDiffSecFromNow(this.lastExternalRequestStats);
    if (diffFromLastRequest > LAST_EXTERNAL_REQUEST_LIMIT) {
      return;
    }

    this.statsData = await this.dataStorage.getTableRowCounts(this.network);
  }

  async getStats(isExternal = false): Promise<DbWorkerStats> {
    super.getStats(isExternal);
    return this.statsData;
  }

  reset() {
    this.statsData = {
      activeContracts: [],
      _transaction: 0,
      _events: 0,
      paymentGatewayTransactionItems: 0,
      vestingTransactionItems: 0,
      proRataTransactionItems: 0,
    };
  }
}
