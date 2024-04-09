import { WorkerBaseConfig } from '~common-service';
import { DataStorage } from '~db';

export interface DbWorkerConfig extends WorkerBaseConfig {
  dataStorage: DataStorage;
}

export interface DbWorkerContractStat {
  address: string;
  name?: string;
  syncBlockNumber: number;
  processBlockNumber: number;
}

export interface DbWorkerStats {
  contracts: DbWorkerContractStat[];
  _transaction: number;
  _events: number;
  transactionItems: number;
}
