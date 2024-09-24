import { Promisable, Started, StringNumber } from '~common';
import { DbWorkerContractStat } from '../db';
import { Web3Block, Web3Transaction } from './web3';

export interface DeployNetworks {
  mainnet: string;
  bsc: string;
}

export type DeployNetworkKey = keyof DeployNetworks;

export interface PackageFile {
  name?: string;
  version?: string;
}

export type SecurityStatusType = 'waiting' | 'running' | 'error';

export interface SecurityStatusResponse {
  status: SecurityStatusType;
  sharesCount: number;
  sharesThreshold: number;
}

export interface WorkerController<T> extends Started {
  execute: (tickId: number) => Promisable<void>;
  reset: () => Promisable<void>;
  getStats: () => Promisable<T | null>;
}

export type GetBlockFn = (blockNumber: StringNumber) => Promise<Web3Block>;

export type GetTransactionByHashFn = (hash: string) => Promise<Web3Transaction>;

export interface ProviderFns {
  getBlockFn: GetBlockFn;
  getTransactionByHashFn: GetTransactionByHashFn;
}

export interface ContractData {
  address: string;
  blockNumber?: number;
  disable?: boolean;
}

export interface StatsData {
  [key: string]: Object;
}

export interface GetSecuritySharesParams {
  secret: string;
  shares: number;
  threshold: number;
}

export interface SetSecurityShareParams {
  share: string;
}

export interface DbWorkerStatsBase {
  activeContracts: DbWorkerContractStat[];
  _transaction: number;
  _events: number;
}
