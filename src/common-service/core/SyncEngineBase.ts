import { Started } from '~common';
import { StatsData } from '../types';
import { WorkerBase } from './WorkerBase';

export class SyncEngineBase implements Started {
  protected tickId: number;
  protected workers!: Record<string, WorkerBase | null>;

  constructor() {
    this.tickId = 0;
  }

  async start(): Promise<void> {
    for (const worker of Object.values(this.workers)) {
      await worker?.start();
    }
  }

  reset() {
    for (const worker of Object.values(this.workers)) {
      worker?.reset();
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
      workersStats[key] = await worker?.getStats(true);
    }

    return workersStats;
  }
}
