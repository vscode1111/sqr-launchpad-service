//Do not move to 'handlers' folder. Moleculer was configured to read code from there, not types
import { ActionParams } from 'moleculer';
import { Web3Block, Web3ConfigContract } from '~common-service';

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

export interface GetTransactionItemsParams extends GetNetworkParams {
  contractAddress: string;
  transactionIds: string[];
}

export interface GetTransactionItemsResponse {
  transactionId: string;
  address?: string;
  amount?: number;
  tx?: string;
  status: StatusType;
}

export interface GetPaymentGatewayTransactionItemsParams extends GetTransactionItemsParams {}

export interface GetPaymentGatewayTransactionItemsResponse extends GetTransactionItemsResponse {}

export interface GetProRataTransactionItemsParams extends GetTransactionItemsParams {}

export interface GetProRataTransactionItemsResponse extends GetTransactionItemsResponse {}
