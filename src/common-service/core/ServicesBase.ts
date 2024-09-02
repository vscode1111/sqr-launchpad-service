import { ServiceBroker } from 'moleculer';
import { parseError, parseStack } from '~common';
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
