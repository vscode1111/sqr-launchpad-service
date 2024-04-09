import { scheduleJob } from 'node-schedule';
import { SEC_RULE, config } from '~common-service';
import { Services } from '~services';

export class App {
  constructor(private services: Services) {}

  public async start(): Promise<void> {
    if (config.web3.scheduler.enable) {
      this.initSchedule();
    }
  }

  private initSchedule(): void {
    scheduleJob(SEC_RULE, async () => {
      if (!this.services.isStarted) {
        return;
      }
      await this.services.multiSyncEngine.sync();
    });
  }
}
