import { isBuildRun, SyncEngineBase } from '~common-service';
import { DbWorker } from './DbWorker';
import { IndexerWorker } from './IndexerWorker';
import { MonitoringWorker } from './MonitoringWorker';
import { SyncEngineConfig } from './SyncEngine.types';

export class SyncEngine extends SyncEngineBase {
  constructor({
    broker,
    provider,
    dataStorage,
    storageProcessor,
    network,
    blockNumberRange,
    blockNumberOffset,
    blockNumberFilterSize,
  }: SyncEngineConfig) {
    super();

    this.workers = {
      monitoring: null,
      indexer: new IndexerWorker({
        broker,
        network,
        workerName: 'IndexerWorker',
        provider,
        dataStorage,
        storageProcessor,
        blockNumberRange,
        blockNumberOffset,
        blockNumberFilterSize,
        tickDivider: isBuildRun ? 30 : 5,
      }),
      db: new DbWorker({ broker, network, workerName: 'DbWorker', tickDivider: 1, dataStorage }),
    };

    const monitoring = new MonitoringWorker({
      broker,
      network,
      workerName: 'MonitoringWorker',
      tickDivider: 1,
      provider,
      workers: this.workers as any,
    });

    this.workers.monitoring = monitoring;
  }
}
