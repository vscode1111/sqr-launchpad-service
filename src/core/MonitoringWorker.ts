import { SpeedCounter, calculateDiffSecFromNow, secondsToDhms } from '~common';
import { Provider, WorkerBase } from '~common-service';
import { DbWorkerStats } from './DbWorker.types';
import { IndexerWorkerStats } from './IndexerWorker.types';
import { MonitoringWorkerConfig, MonitoringWorkerStats } from './MonitoringWorker.types';
import { SyncWorkerControllers } from './SyncEngine.types';

export class MonitoringWorker extends WorkerBase<MonitoringWorkerStats | null> {
  public statsData!: MonitoringWorkerStats;
  private provider: Provider;
  private workers: SyncWorkerControllers;

  private startDate: Date;

  private indexerStats: IndexerWorkerStats | null;
  private dbStats: DbWorkerStats | null;

  private providerRequestsCounter: SpeedCounter;
  private syncBlockNumberCounter: SpeedCounter;
  private rawBlockNumberCounter: SpeedCounter;
  private processBlockNumberCounter: SpeedCounter;
  private _transactionCounter: SpeedCounter;
  private kafkaMessageCounter: SpeedCounter;

  constructor({
    broker,
    network,
    workerName,
    tickDivider,
    provider,
    workers,
  }: MonitoringWorkerConfig) {
    super(broker, network, workerName, tickDivider);
    this.provider = provider;
    this.workers = workers;

    this.startDate = new Date();
    this.indexerStats = null;
    this.dbStats = null;

    this.providerRequestsCounter = new SpeedCounter();
    this.syncBlockNumberCounter = new SpeedCounter();
    this.rawBlockNumberCounter = new SpeedCounter();
    this.processBlockNumberCounter = new SpeedCounter();
    this._transactionCounter = new SpeedCounter();
    this.kafkaMessageCounter = new SpeedCounter();
    this.reset();
  }

  async start(): Promise<void> {}

  public async work(tickId: number) {
    this.statsData.startDate = this.startDate;
    this.statsData.uptime = secondsToDhms(calculateDiffSecFromNow(this.startDate));

    this.statsData.tickId = tickId;

    this.indexerStats = await this.workers.indexer.getStats();
    this.dbStats = await this.workers.db.getStats();

    this.statsData.indexerLag = calculateDiffSecFromNow(this.indexerStats.lastSuccessDate);

    this.providerRequestsCounter.store(this.indexerStats.providerRequests);
    this.statsData.providerRequestsPerSec = Math.round(this.providerRequestsCounter.stats().speed);

    this.syncBlockNumberCounter.store(this.indexerStats.syncBlockNumber);
    this.statsData.syncBlockNumberPerSec = Math.round(this.syncBlockNumberCounter.stats().speed);

    this.rawBlockNumberCounter.store(this.indexerStats.rawBlockNumber);
    this.statsData.rawBlockNumberPerSec = Math.round(this.rawBlockNumberCounter.stats().speed);

    this.processBlockNumberCounter.store(this.indexerStats.processBlockNumber);
    this.statsData.processBlockNumberPerSec = Math.round(
      this.processBlockNumberCounter.stats().speed,
    );

    this._transactionCounter.store(this.dbStats._transaction);
    this.statsData._transactionPerSec = Math.round(this._transactionCounter.stats().speed);

    this.kafkaMessageCounter.store(this.indexerStats.kafkaMessages);
    this.statsData.kafkaMessagesPerSec = Math.round(this.kafkaMessageCounter.stats().speed);
  }

  async getStats(): Promise<MonitoringWorkerStats | null> {
    if (!this.indexerStats || !this.dbStats) {
      return null;
    }

    const chainBlockNumber = await this.provider.getBlockNumber();

    const contractsRemains = this.dbStats.contracts.map((constract) => ({
      ...constract,
      syncBlockNumber: chainBlockNumber - constract.syncBlockNumber,
      processBlockNumber: chainBlockNumber - constract.processBlockNumber,
    }));

    return { ...this.statsData, chainBlockNumber, contractsRemains };
  }

  reset() {
    this.statsData = {
      uptime: '',
      tickId: 0,
      indexerLag: 0,
      chainBlockNumber: 0,
      contractsRemains: [],
      providerRequestsPerSec: 0,
      syncBlockNumberPerSec: 0,
      rawBlockNumberPerSec: 0,
      processBlockNumberPerSec: 0,
      _transactionPerSec: 0,
      kafkaMessagesPerSec: 0,
      startDate: this.startDate,
    };
  }
}
