import { DbWorkerContractStat, WorkerBaseConfig } from '~common-service';
import { DataStorage } from '~db';

export interface DbWorkerConfig extends WorkerBaseConfig {
  dataStorage: DataStorage;
}

export interface DbWorkerStats {
  contracts: DbWorkerContractStat[];
  _transaction: number;
  _events: number;
  paymentGatewayTransactionItems: number;
}
