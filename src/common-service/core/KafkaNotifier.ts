import Moleculer from 'moleculer';
import { channels } from 'msq-moleculer-core';
import { EventNotifier } from '~common';
import { logInfo } from '../utils';

const { sendToChannel } = channels;

const LOG_ENABLE = false;

export class KafkaNotifier<T> implements EventNotifier<T> {
  constructor(
    private broker: Moleculer.ServiceBroker,
    private topic: string,
    private enable = true,
  ) {}

  async send(event: T): Promise<void> {
    if (!this.enable) {
      return;
    }

    await sendToChannel(this.broker, this.topic, event as any, true);

    if (LOG_ENABLE) {
      logInfo(this.broker, `KafkaNotifier topic: ${this.topic}, payload: ${JSON.stringify(event)}`);
    }
  }
}
