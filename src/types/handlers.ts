//Do not move to 'handlers' folder. Moleculer was configured to read code from there, not types
import { GetNetworkParams } from '~common-service';

export type StatusType = 'missing' | 'exists';

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

export interface GetProRataNetDepositsResponse {
  account: string;
  amount: number;
}

export interface GetPaymentGatewayTransactionItemsParams extends GetTransactionItemsParams {}

export interface GetPaymentGatewayTransactionItemsResponse extends GetTransactionItemsResponse {}

export interface GetProRataTransactionItemsParams extends GetTransactionItemsParams {}

export interface GetProRataTransactionItemsResponse extends GetTransactionItemsResponse {}

export interface GetProRataNetDepositsParams extends GetNetworkParams {
  contractAddress: string;
}
