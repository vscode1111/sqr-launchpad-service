import Bluebird from 'bluebird';
import { toHex } from '~common';
import {
  BlockNumberFilter,
  INDEXER_CONCURRENCY_COUNT,
  Provider,
  StorageProcessor,
  WorkerBase,
  logInfo,
} from '~common-service';
import { DataStorage } from '~db';
import { IndexerWorkerConfig, IndexerWorkerStats } from './IndexerWorker.types';

const LOG_RPC_REQUEST = true;

export class IndexerWorker extends WorkerBase<IndexerWorkerStats> {
  private provider: Provider;
  private dataStorage: DataStorage;
  private storageProcessor: StorageProcessor;
  private statsData!: IndexerWorkerStats;
  private blockNumberRange: number;
  private blockNumberOffset: number;
  private blockNumberFilter: BlockNumberFilter;

  constructor({
    broker,
    provider,
    dataStorage,
    storageProcessor,
    network,
    workerName,
    tickDivider,
    blockNumberRange,
    blockNumberOffset,
    blockNumberFilterSize,
  }: IndexerWorkerConfig) {
    super(broker, network, workerName, tickDivider);

    this.provider = provider;
    this.dataStorage = dataStorage;
    this.storageProcessor = storageProcessor;
    this.blockNumberRange = blockNumberRange ?? 2000;
    this.blockNumberOffset = blockNumberOffset ?? 10;
    this.blockNumberFilter = new BlockNumberFilter(blockNumberFilterSize);
    this.reset();
  }

  async start(): Promise<void> {
    logInfo(this.broker, `IndexerWorker ${this.network} init`);
    this.dataStorage.setRpcFns({
      getBlockFn: (blockNumber) => {
        this.statsData.providerRequests++;
        return this.provider.getBlockByNumber(blockNumber);
      },
      getTransactionByHashFn: (hash) => {
        this.statsData.providerRequests++;
        return this.provider.getTransactionByHash(hash);
      },
    });
    this.storageProcessor.setDataSource(this.dataStorage.getDataSource());
    await this.storageProcessor.start();
    const addresses = await this.dataStorage.getContracts();
    await this.provider.subscribe(addresses.map((item) => item.address));
    this.provider.onMessage(() => {
      this.execute(0);
    });
  }

  public async work() {
    await this.fillRawData();
    await this.fillProcessData();
  }

  private async fillRawData() {
    const contracts = await this.dataStorage.getContracts(this.network);
    const rawBlockNumber = await this.provider.getBlockNumber();
    if (LOG_RPC_REQUEST) {
      logInfo(this.broker, `rawBlockNumber: ${rawBlockNumber}`);
    }

    const analyzeResponse = this.blockNumberFilter.analyze(rawBlockNumber);

    this.statsData.blockNumberFilter.status = this.blockNumberFilter.getStatus();
    this.statsData.blockNumberFilter.history = this.blockNumberFilter.getHistory();
    this.statsData.blockNumberFilter.diffs = this.blockNumberFilter.getDiffs();

    if (analyzeResponse.status === 'error') {
      this.statsData.blockNumberFilter.errorCount++;
      this.statsData.blockNumberFilter.lastError = String(analyzeResponse.value);
      this.statsData.blockNumberFilter.lastErrorDate = new Date();
    }

    if (analyzeResponse.status !== 'success') {
      return;
    }

    let filteredBlockNumber = analyzeResponse.value;

    const currentBlockNumber = filteredBlockNumber - this.blockNumberOffset;

    await Bluebird.map(
      contracts,
      async (contract) => {
        const contractAddress = contract.address;

        while (true) {
          const dbContract = await this.dataStorage.getContract(contractAddress);

          if (!dbContract || dbContract.syncBlockNumber > currentBlockNumber) {
            break;
          }

          const from = dbContract.syncBlockNumber;
          let to = from + this.blockNumberRange;

          if (to > currentBlockNumber) {
            to = currentBlockNumber;
          }

          this.statsData.syncBlockNumber = to;

          this.statsData.providerRequests++;

          const events = await this.provider.getEvents(contractAddress, from, to);

          if (LOG_RPC_REQUEST) {
            logInfo(
              this.broker,
              `RPC request events for ${contract.address} contract from ${from} (${toHex(
                from,
              )}) to ${to} (${toHex(to)}) blocks  => events: ${events.length}`,
            );
          }

          for (const event of events) {
            logInfo(this.broker, `RPC-event: ${JSON.stringify(event)}`);
          }

          await this.dataStorage.saveEvents({
            events,
            network: this.network,
            contractAddress,
            blockNumber: to,
            onProcessEvent: (event) => {
              this.statsData.rawBlockNumber = event.blockNumber;
            },
          });
        }
      },
      { concurrency: INDEXER_CONCURRENCY_COUNT },
    );
  }

  private async fillProcessData() {
    await this.storageProcessor.process(
      (event) => {
        this.statsData.processBlockNumber = event.transactionHash.blockNumber;
      },
      () => {
        this.statsData.kafkaMessages++;
      },
    );
  }

  async getStats(): Promise<IndexerWorkerStats> {
    const statsDataBase = await super.getStats();
    return { ...this.statsData, ...statsDataBase };
  }

  reset() {
    this.statsData = {
      executing: false,
      successCount: 0,
      errorCount: 0,
      executionTime: 0,
      providerRequests: 0,
      syncBlockNumber: 0,
      rawBlockNumber: 0,
      processBlockNumber: 0,
      kafkaMessages: 0,
      lastSuccessDate: new Date(),
      blockNumberFilter: {
        status: 'preparing',
        history: [],
        diffs: [],
        errorCount: 0,
      },
    };

    this.storageProcessor.setDataSource(this.dataStorage.getDataSource());
  }
}
