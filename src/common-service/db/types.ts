import { DataSource, QueryRunner } from 'typeorm';
import { Repository } from 'typeorm';
import { Promisable, Started } from '~common';
import { NF } from '~common';
import { Contract, Network } from '~db';
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

export type OrderType = 'ASC' | 'DESC';

export interface OrderByParams {
  sort: string;
  order?: OrderType;
}

export interface FindContractsParamsBase {
  network?: DeployNetworkKey;
  notDisable?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: OrderByParams;
}

export interface FindContractsParams extends FindContractsParamsBase {
  contractRepository: Repository<Contract>;
  networkRepository: Repository<Network>;
}

export interface FindContractParams {
  id: number;
  contractRepository: Repository<Contract>;
}

export const NFindContractsParams = NF<FindContractsParams>();
