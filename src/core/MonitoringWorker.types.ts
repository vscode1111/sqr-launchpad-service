import { DbWorkerContractStat, Provider, WorkerBaseConfig } from '~common-service';
import { SyncWorkerControllers } from './SyncEngine.types';

export interface MonitoringWorkerConfig extends WorkerBaseConfig {
  provider: Provider;
  workers: SyncWorkerControllers;
}

export interface MonitoringWorkerStats {
  uptime: string;
  tickId: number;
  indexerLag: number;
  chainBlockNumber: number;
  activeContractsRemains: DbWorkerContractStat[];
  providerRequestsPerSec: number;
  syncBlockNumberPerSec: number;
  rawBlockNumberPerSec: number;
  processBlockNumberPerSec: number;
  _transactionPerSec: number;
  kafkaMessagesPerSec: number;
  startDate: Date;
}
