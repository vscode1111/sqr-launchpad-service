import { Promisable } from '~common';
import {
  DeployNetworkKey,
  GetBlockFn,
  GetTransactionByHashFn,
  Web3Event,
  Web3Receipt,
} from '../types';

export type OnMessageFn = (message: any) => Promisable<void>;

export interface Provider {
  subscribe: (addresses: string[]) => Promise<any>;
  unsubscribe: () => Promisable<void>;
  onMessage: (fn: OnMessageFn) => void;
  getBlockNumber: () => Promise<number>;
  getBlockByNumber: GetBlockFn;
  getEvents: (address: string, fromBlock: number, toBlock: number) => Promise<Web3Event[]>;
  getTransactionByHash: GetTransactionByHashFn;
  getTransactionReceipt: (hash: string) => Promise<Web3Receipt>;
}

export type NetworkObject<T> = Record<DeployNetworkKey, T>;
