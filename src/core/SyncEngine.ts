import { Started, Stopped } from '~common';
import { isBuildRun, WorkerBase } from '~common-service';
import { DbWorker } from './DbWorker';
import { IndexerWorker } from './IndexerWorker';
import { MonitoringWorker } from './MonitoringWorker';
import { StatsData, SyncEngineConfig, SyncWorkerControllers } from './SyncEngine.types';

export class SyncEngine implements Started, Stopped {
  private tickId: number;

  private workers: SyncWorkerControllers;

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
    this.tickId = 0;

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
      db: new DbWorker({ broker, network, workerName: 'TaskWorker', tickDivider: 1, dataStorage }),
    };

    const monitoring = new MonitoringWorker({
      broker,
      network,
      workerName: 'MonitoringWorker',
      tickDivider: 1,
      provider,
      workers: this.workers,
    });

    this.workers.monitoring = monitoring;
  }

  async start(): Promise<void> {
    for (const worker of Object.values(this.workers)) {
      await worker.start();
    }
  }

  async stop(): Promise<void> {
    for (const worker of Object.values(this.workers)) {
      await worker?.stop();
    }
  }

  reset() {
    for (const worker of Object.values(this.workers)) {
      worker.reset();
    }
  }

  public async sync() {
    for (const worker of Object.values(this.workers)) {
      worker?.execute(this.tickId);
    }
    this.tickId++;
  }

  async getStats(): Promise<StatsData> {
    const workersStats = {} as any;

    for (const [key, value] of Object.entries(this.workers)) {
      const worker = value as WorkerBase;
      workersStats[key] = await worker.getStats(true);
    }

    return workersStats;
  }
}
