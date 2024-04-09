import { ServiceBroker } from 'moleculer';
import { KafkaNotifier, NetworkObject, Provider } from '~common-service';
import { DataStorage } from '~db';
import { Web3BusEvent } from '~types';

export interface SyncEngineConfigBase {
  broker: ServiceBroker;
  providers: NetworkObject<Provider>;
  dataStorage: DataStorage;
  kafkaNotifier: KafkaNotifier<Web3BusEvent>;
}
