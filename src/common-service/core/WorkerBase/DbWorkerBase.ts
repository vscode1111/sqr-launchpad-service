import { calculateDiffSecFromNow } from '~common';
import { LAST_EXTERNAL_REQUEST_STATS_LIMIT } from '../../constants';
import { DataStorageBase } from '../../db';
import { DbWorkerStatsBase } from '../../types';
import { DbWorkerConfig } from './DbWorkerBase.types';
import { WorkerBase } from './WorkerBase';

export class DbWorkerBase<T extends DbWorkerStatsBase> extends WorkerBase<T> {
  public statsData!: T;
  protected dataStorage: DataStorageBase;

  constructor({ broker, network, workerName, tickDivider, dataStorage }: DbWorkerConfig) {
    super(broker, network, workerName, tickDivider);
    this.dataStorage = dataStorage;
    this.reset();
  }

  async start(): Promise<void> {}

  public async work() {
    const diffFromLastRequest = calculateDiffSecFromNow(this.lastExternalRequestStats);
    if (diffFromLastRequest > LAST_EXTERNAL_REQUEST_STATS_LIMIT) {
      return;
    }

    this.statsData = (await this.dataStorage.getTableRowCounts(this.network)) as T;
  }

  async getStats(isExternal = false): Promise<T> {
    super.getStats(isExternal);
    return this.statsData;
  }

  reset() {
    this.statsData = {
      activeContracts: [],
      _transaction: 0,
      _events: 0,
    } as any;
  }
}
