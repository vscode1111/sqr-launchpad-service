import { Web3ConfigContract } from '~common-service';
import { ContractType } from '~db';
import { GetNetworkParams } from './handlers';

export interface ContractDataCollection {
  sqrLaunchpadData: Web3ConfigContract[];
}

export interface GetLaunchpadDepositSignatureParams extends GetNetworkParams {
  contractType: ContractType;
  contractAddress: string;
  userId: string;
  transactionId: string;
  account: string;
  amount: number;
}

export interface GetSignatureDepositResponse {
  signature: string;
  // contractAddress?: string;
  amountInWei: string;
  nonce: number;
  timestampNow: number;
  timestampLimit: number;
  dateLimit: Date;
}
