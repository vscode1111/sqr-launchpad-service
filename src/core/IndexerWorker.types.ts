import {
  AnalyzeResponseStatus,
  Provider,
  StorageProcessor,
  WorkerBaseConfig,
  WorkerBaseStats,
} from '~common-service';
import { DataStorage } from '~db';

export interface IndexerWorkerConfig extends WorkerBaseConfig {
  provider: Provider;
  dataStorage: DataStorage;
  storageProcessor: StorageProcessor;
  blockNumberFilterSize?: number;
  blockNumberRange?: number;
  blockNumberOffset?: number;
}

export interface IndexerWorkerStats extends WorkerBaseStats {
  providerRequests: number;
  syncBlockNumber: number;
  rawBlockNumber: number;
  processBlockNumber: number;
  kafkaMessages: number;
  blockNumberFilter: {
    status: AnalyzeResponseStatus;
    history: number[];
    diffs: number[];
    errorCount: number;
    lastError?: string;
    lastErrorDate?: Date;
  };
}
