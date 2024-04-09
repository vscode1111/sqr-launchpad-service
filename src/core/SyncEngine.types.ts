import { DbWorker } from './DbWorker';
import { IndexerWorker } from './IndexerWorker';
import { IndexerWorkerConfig } from './IndexerWorker.types';
import { MonitoringWorker } from './MonitoringWorker';

export interface SyncEngineConfig extends IndexerWorkerConfig {}

export interface StatsData {
  [key: string]: Object;
}

export interface SyncWorkerControllers {
  monitoring: MonitoringWorker | null;
  indexer: IndexerWorker;
  db: DbWorker;
}
