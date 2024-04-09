import { Context, ServiceBroker } from 'moleculer';

declare module 'msq-moleculer-core' {
  export interface Channels {
    sendToChannel: (broker: ServiceBroker, topic: string, payload: object, throwErr = false) => Promise<void>;
    sendToChannelWithContext: (ctx: Context, topic: string, payload: object) => Promise<void>;
    sendMetric: (broker: ServiceBroker, event: string, id: string, value: number) => Promise<void>;
    sendMetricWithContext: (
      ctx: Context,
      event: string,
      id: string,
      value: number,
    ) => Promise<void>;
    makeSubscriberChannel: (payload: {
      topic: string;
      group: string;
      handler: (ctx: Context, msg: any) => Promise<void>;
      opts: object;
    }) => object;
  }
}
