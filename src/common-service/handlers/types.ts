import { ActionParams } from 'moleculer';
import { Contract } from '~db';
import { Web3ConfigContract } from '../config';
import { GetListResult, Web3Block } from '../types';

export type HandlerParams<T> = Record<keyof T, ActionParams>;

export interface GetNetworkParams {
  network: string;
}

export interface GetNetworkAddressesParams extends GetNetworkParams {}

export type GetNetworkAddressesResponse = Web3ConfigContract[];

export interface GetBlockParams extends GetNetworkParams {
  id: string;
}

export interface GetBlockResponse extends Web3Block {
  timestampDate: Date;
}

export interface GetContractListParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface GetContractParams {
  id: number;
}

export interface CreateContractParams {
  networkId?: number;
  address?: string;
  type?: string;
  name?: string;
  syncBlockNumber?: number;
  processBlockNumber?: number;
  disable?: boolean;
}

export interface UpdateContractParams extends GetContractParams, CreateContractParams {}

export interface GetProRataNetDepositsResponse {
  account: string;
  amount: number;
}

export interface GetMenageContractListResult extends GetListResult<Contract> {}
