import { ServiceBroker } from 'moleculer';
import { Initilized, Started, Stopped, parseError, parseStack } from '~common';
import {
  DeployNetworkKey,
  JsonRpcProvider,
  KafkaNotifier,
  NetworkObject,
  Provider,
  ServiceBrokerBase,
  ServicesBase,
  config,
  networkObjectFactory,
} from '~common-service';
import { getSqrLaunchpadContext } from '~contracts';
import { MultiSyncEngine } from '~core';
import { DataStorage } from '~db';
import { Web3BusEvent } from '~types';
import { SqrLaunchpadContext } from './types';

export class Services
  extends ServiceBrokerBase
  implements Initilized, Started, Stopped, ServicesBase
{
  private started: boolean;
  private providers: NetworkObject<Provider>;
  private sqrLaunchpadContexts: NetworkObject<SqrLaunchpadContext> | null;

  private lastError: string | undefined;
  private lastErrorStack: string | undefined;
  private lastErrorDate: Date | undefined;
  private errorCount: number;

  public multiSyncEngine: MultiSyncEngine;
  public dataStorage!: DataStorage;
  public kafkaNotifier: KafkaNotifier<Web3BusEvent>;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.started = false;
    this.lastErrorDate = undefined;
    this.errorCount = 0;

    this.providers = networkObjectFactory(
      (network) =>
        new JsonRpcProvider(
          config.web3.provider[network].http as string,
          config.web3.provider[network].wss as string,
        ),
    );

    this.sqrLaunchpadContexts = null;

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
    this.sqrLaunchpadContexts = networkObjectFactory((network) => getSqrLaunchpadContext(network));
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
    return this.sqrLaunchpadContexts?.[network];
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
