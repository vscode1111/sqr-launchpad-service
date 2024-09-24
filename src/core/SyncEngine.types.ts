import { IndexerWorkerBaseConfig } from '~common-service';
import { DbWorker } from './DbWorker';
import { IndexerWorker } from './IndexerWorker';
import { MonitoringWorker } from './MonitoringWorker';

export interface SyncEngineConfig extends IndexerWorkerBaseConfig {}

export interface SyncWorkerControllers {
  monitoring: MonitoringWorker | null;
  indexer: IndexerWorker;
  db: DbWorker;
}
