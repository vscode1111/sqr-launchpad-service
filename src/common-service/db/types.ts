import { DataSource, QueryRunner } from 'typeorm';
import { Promisable, Started } from '~common';
import { Web3BusEvent } from '~types';
import { Event } from '../../db/entities';
import { Web3ConfigContract } from '../config';
import { DeployNetworkKey } from '../types';

export interface DbQuerable {
  query<T = any>(query: string, parameters?: any[], queryRunner?: QueryRunner): Promise<T>;
}

export interface StorageProcessor extends Started {
  setDataSource: (dataSource: DataSource) => void;
  process: (
    onProcessEvent?: (event: Event) => Promisable<void>,
    onContractEvent?: (event: Web3BusEvent) => Promisable<void>,
  ) => Promisable<void>;
}

export type GetContractDataFn = (network: DeployNetworkKey) => Web3ConfigContract[];

export interface DbWorkerContractStat {
  address: string;
  name?: string;
  syncBlockNumber: number;
  processBlockNumber: number;
  disable?: boolean;
  type?: string;
}
