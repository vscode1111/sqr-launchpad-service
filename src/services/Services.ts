import { ServiceBroker } from 'moleculer';
import { Initialized, Started, Stopped } from '~common';
import {
  DeployNetworkKey,
  JsonRpcProvider,
  KafkaNotifier,
  NetworkObject,
  Provider,
  SecurityBlocker,
  ServicesBase,
  config,
  networkObjectFactory,
} from '~common-service';
import { getWeb3LaunchpadContext } from '~contracts';
import { MultiSyncEngine } from '~core';
import { DataStorage } from '~db';
import { Web3BusEvent } from '~types';
import { Web3LaunchpadContext } from './types';

export class Services extends ServicesBase implements Initialized, Started, Stopped {
  private started: boolean;
  private providers: NetworkObject<Provider>;
  private web3LaunchpadContexts: NetworkObject<Web3LaunchpadContext> | null;

  public multiSyncEngine: MultiSyncEngine;
  public dataStorage!: DataStorage;
  public kafkaNotifier: KafkaNotifier<Web3BusEvent>;
  public securityBlocker!: SecurityBlocker;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.started = false;

    this.providers = networkObjectFactory(
      (network) =>
        new JsonRpcProvider(
          config.web3.provider[network].http as string,
          config.web3.provider[network].wss as string,
        ),
    );

    this.web3LaunchpadContexts = null;

    this.dataStorage = new DataStorage(broker);

    this.kafkaNotifier = new KafkaNotifier(this.broker, config.web3.kafka.outTopic);

    this.multiSyncEngine = new MultiSyncEngine({
      broker,
      providers: this.providers,
      dataStorage: this.dataStorage,
      kafkaNotifier: this.kafkaNotifier,
    });
  }

  async init() {
    this.web3LaunchpadContexts = networkObjectFactory((network) => getWeb3LaunchpadContext(network));
    await this.start();
  }

  async start() {
    await this.multiSyncEngine.start();
    this.started = true;
  }

  async stop() {
    this.started = false;
    await this.dataStorage.stop();
  }

  get isStarted() {
    return this.started;
  }

  getProvider(network: DeployNetworkKey) {
    return this.providers[network];
  }

  getNetworkContext(network: DeployNetworkKey) {
    return this.web3LaunchpadContexts?.[network];
  }
}
