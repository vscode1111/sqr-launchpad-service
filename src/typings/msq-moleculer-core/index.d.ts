import moleculer from 'moleculer';
import { Broker } from './broker';
import { BaseConfig } from './config';
import { Logger } from './logger';

declare module 'msq-moleculer-core' {
  export function buildBroker(config: BaseConfig): moleculer.ServiceBroker;
  export const mixins: Mixins;
  export const channels: Channels;
  export const MoleculerErrors: moleculer.Errors;
}
