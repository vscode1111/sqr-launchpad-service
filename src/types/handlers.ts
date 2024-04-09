//Do not move to 'handlers' folder. Moleculer was configured to read code from there, not types

import { ActionParams } from 'moleculer';
import { Web3ConfigContract } from 'msq-moleculer-core';
import { Web3Block } from '~common-service';

export type StatusType = 'missing' | 'exists';

export type HandlerParams<T> = Record<keyof T, ActionParams>;

export interface CreateAccountParams {
  userId: string;
}
export interface CreateAccountResponse {
  address: string;
}

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

export interface GetSecuritySharesParams {
  secret: string;
  shares: number;
  threshold: number;
}

export interface SetWithdrawalRequestParams extends GetNetworkParams {
  userId: string;
  to: string;
  amount: number;
}

export interface SetSecurityShareParams {
  share: string;
}

export interface GetSignatureWithdrawParams extends GetNetworkParams {
  userId: string;
  transactionId: string;
  to: string;
  amount: number;
}

export interface GetSignatureWithdrawResponse {
  signature: string;
  amountInWei: string;
  timestampNow: number;
  timestampLimit: number;
}

export interface GetTransactionItemsParams extends GetNetworkParams {
  transactionIds: string[];
}

export interface GetTransactionItemsResponse {
  transactionId: string;
  status: StatusType;
  tx?: string;
  error?: string;
}

export interface GetFundItemsParams extends GetNetworkParams {
  userIds: string[];
}

export interface GetFundItemsResponse {
  userId: string;
  status: StatusType;
  error?: string;
}
