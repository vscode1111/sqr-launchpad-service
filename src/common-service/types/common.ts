import { Promisable, Started, StringNumber } from '~common';
import { Web3Block, Web3Transaction } from './web3';

export interface DeployNetworks {
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

export interface ContractData {
  address: string;
  blockNumber?: number;
  disable?: boolean;
}
