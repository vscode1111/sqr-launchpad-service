import { ServiceBroker } from 'moleculer';
import { DeployNetworkKey } from '~common-service';

export interface WorkerBaseConfig {
  broker: ServiceBroker;
  network: DeployNetworkKey;
  workerName: string;
  tickDivider?: number;
}

export type WorkerBaseStats = {
  executing: boolean;
  successCount: number;
  errorCount: number;
  executionTime: number;
  lastSuccessDate: Date;
  lastError?: string;
  lastErrorDate?: Date;
};
