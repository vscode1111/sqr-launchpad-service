import { Started } from '~common';
import {
  DeployNetworkKey,
  KafkaNotifier,
  NetworkObject,
  ServiceBrokerBase,
  config,
  logInfo,
  networkObjectFactory,
  processNetworkObject,
} from '~common-service';
import { DataStorage, EventStorageProcessor } from '~db';
import { Web3BusEvent } from '~types';
import { SyncEngineConfigBase } from './MultiSyncEngine.types';
import { SyncEngine } from './SyncEngine';
import { StatsData } from './SyncEngine.types';

const INIT_HARD_RESET = false;

export class MultiSyncEngine extends ServiceBrokerBase implements Started {
  private syncEngines: NetworkObject<SyncEngine>;
  private dataStorage: DataStorage;
  private kafkaNotifier: KafkaNotifier<Web3BusEvent>;

  constructor({ broker, providers, dataStorage, kafkaNotifier }: SyncEngineConfigBase) {
    super(broker);

    this.dataStorage = dataStorage;
    this.kafkaNotifier = kafkaNotifier;

    this.syncEngines = networkObjectFactory((network) => {
      const storageProcessor = new EventStorageProcessor(
        broker,
        this.dataStorage.getDataSource(),
        network,
        this.kafkaNotifier,
      );

      const networkConfig = config.web3.provider[network];

      return new SyncEngine({
        broker,
        provider: providers[network],
        dataStorage,
        storageProcessor,
        network,
        workerName: 'SyncEngine',
        blockNumberfilterSize: networkConfig?.blockNumberfilterSize,
        blockNumberRange: networkConfig?.blockNumberRange,
        blockNumberOffset: networkConfig?.blockNumberOffset,
      });
    });
  }

  async start(): Promise<void> {
    await this.dataStorage.start();
    if (INIT_HARD_RESET) {
      await this.hardReset();
    }

    logInfo(this.broker, `MultiSyncEngine init`);
    await processNetworkObject(this.syncEngines, (network) => this.syncEngines[network].start());
    this.sync();
  }

  public async sync(network?: DeployNetworkKey) {
    network
      ? this.syncEngines[network].sync()
      : processNetworkObject(
          this.syncEngines,
          (network) => this.syncEngines[network].sync(),
          false,
        );
  }

  async hardReset(): Promise<void> {
    await this.dataStorage.hardReset();
    await this.dataStorage.initialize();
    await processNetworkObject(this.syncEngines, (network) => this.syncEngines[network].reset());
    this.sync();
  }

  async softReset(): Promise<void> {
    await this.dataStorage.softReset();
    await this.sync();
  }

  async getStats(network: DeployNetworkKey): Promise<StatsData> {
    return this.syncEngines[network].getStats();
  }
}
