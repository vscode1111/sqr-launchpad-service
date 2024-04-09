import { WorkerBaseConfig, WorkerBaseStats } from '~common-service';
import { DataStorage } from '~db';

export interface TaskRequestWorkerConfig extends WorkerBaseConfig {
  dataStorage: DataStorage;
}

export interface TaskRequestWorkerStats extends WorkerBaseStats {
  providerRequests: number;
  runningTasks: number[];
}
