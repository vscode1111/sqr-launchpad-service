import { ServiceBroker } from 'moleculer';
import { Promisable, Started, Stopped, parseError, parseStack } from '~common';
import { DeployNetworkKey, WorkerController } from '../../types';
import { logError } from '../../utils';
import { ServiceBrokerBase } from '../ServiceBrokerBase';
import { WorkerBaseStats } from './WorkerBase.types';

export class WorkerBase<T = any>
  extends ServiceBrokerBase
  implements WorkerController<T>, Started, Stopped
{
  protected network: DeployNetworkKey;
  protected workerName: string;
  protected statsDataBase!: WorkerBaseStats;
  protected tickDivider: number;
  protected started: boolean;
  // protected timeOut: number;
  protected lastExternalRequestStats: Date;

  constructor(
    broker: ServiceBroker,
    network: DeployNetworkKey,
    workerName: string,
    tickDivider = 30,
    // timeOut = HOURS * MS_IN_SEC,
  ) {
    super(broker);
    this.network = network;
    this.workerName = workerName;
    this.tickDivider = tickDivider;
    this.started = false;
    // this.timeOut = timeOut;
    this.lastExternalRequestStats = new Date();
    this.statsDataBase = {
      executing: false,
      successCount: 0,
      errorCount: 0,
      executionTime: 0,
      lastSuccessDate: new Date(),
    };
  }

  async start(): Promise<void> {}

  async stop(): Promise<void> {}

  reset(): void {}

  public getNetwork() {
    return this.network;
  }

  public async execute(tickId: number) {
    if (this.statsDataBase.executing || tickId % this.tickDivider !== 0) {
      return;
    }

    this.statsDataBase.executing = true;

    const t0 = new Date().getTime();

    try {
      await this.work(tickId);
      // const bPromise = new BPromise((resolve) => this.work(tickId).then(() => resolve())); //ToDo: fix to catch error
      // await bPromise.timeout(this.timeOut);

      this.statsDataBase.successCount++;
      this.statsDataBase.lastSuccessDate = new Date();
      // this.statsDataBase.lastError = undefined;
    } catch (err) {
      this.statsDataBase.errorCount++;
      this.statsDataBase.lastError = parseError(err);
      this.statsDataBase.lastErrorDate = new Date();
      this.statsDataBase.lastErrorStack = parseStack(err);
      logError(
        this.broker,
        `${this.workerName} error #${this.statsDataBase.errorCount}: ${this.statsDataBase.lastError} in ${this.statsDataBase.lastErrorStack}`,
      );
    }

    const diff = new Date().getTime() - t0;

    this.statsDataBase.executionTime = diff;

    this.statsDataBase.executing = false;

    if (!this.started) {
      this.started = true;
    }
  }

  public async work(_tickId: number) {}

  getStats(isExternal = false): Promisable<T> {
    if (isExternal) {
      this.lastExternalRequestStats = new Date();
    }
    return this.statsDataBase as any;
  }
}
