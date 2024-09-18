import { ServiceBroker } from 'moleculer';
import { exit } from 'process';
import { parseError, parseStack } from '~common';
import { logError } from '../utils';
import { ServiceBrokerBase } from './ServiceBrokerBase';

export class ServicesBase extends ServiceBrokerBase {
  protected lastError: string | undefined;
  protected lastErrorStack: string | undefined;
  protected lastErrorDate: Date | undefined;
  protected errorCount: number;

  constructor(broker: ServiceBroker) {
    super(broker);
    this.errorCount = 0;
  }
  reboot() {
    logError(this.broker, 'User invoked reboot');
    exit(1);
  }

  saveProcessError(error: any) {
    this.lastError = parseError(error);
    this.lastErrorStack = parseStack(error);
    this.lastErrorDate = new Date();
    this.errorCount++;
    return this.errorCount;
  }

  async getStats() {
    return {
      process: {
        lastError: this.lastError,
        lastErrorStack: this.lastErrorStack,
        lastErrorDate: this.lastErrorDate,
        errorCount: this.errorCount,
      },
    };
  }
}
