import moleculer from 'moleculer';
import { BaseConfig } from '../../config';

declare module 'msq-moleculer-core' {
  export function buildBroker(config: BaseConfig): moleculer.ServiceBroker;
  export const mixins: Mixins;
  export const channels: Channels;
  export const MoleculerErrors: moleculer.Errors;
}
