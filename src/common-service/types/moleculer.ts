import { ActionSchema, ServiceBroker } from 'moleculer';

export type HandlerFunc = (broker: ServiceBroker) => HandlerFuncArgs;

interface HandlerFuncArgs {
  actions: Record<string, ActionSchema>;
}
