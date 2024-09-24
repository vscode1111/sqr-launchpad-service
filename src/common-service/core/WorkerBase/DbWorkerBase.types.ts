import { DbWorkerStatsBase, WorkerBaseConfig } from '~common-service';
import { DataStorage } from '~db';

export interface DbWorkerConfig extends WorkerBaseConfig {
  dataStorage: DataStorage;
}

export interface DbWorkerStats extends DbWorkerStatsBase {
  transactionItems: number;
}
