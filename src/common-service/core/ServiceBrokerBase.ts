import { ServiceBroker } from 'moleculer';

export class ServiceBrokerBase {
  constructor(protected broker: ServiceBroker) {}
}
