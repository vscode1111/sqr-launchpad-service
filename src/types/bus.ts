import { DeployNetworkKey } from '~common-service';
import { ContractType } from '~db';

export type TokenWeb3BusEventType = 'TRANSFER_TX_SUCCESS';

export interface TokenWeb3BusEvent {
  event: TokenWeb3BusEventType;
  data: TokenWeb3BusEventData;
}

export interface TokenWeb3BusEventData {
  network: DeployNetworkKey;
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
  tx: string;
}

export type Web3BusEventType = 'PAYMENT_GATEWAY' | 'VESTING' | 'PRO_RATA' | 'BABT';

export type Web3BusEvent =
  | {
      event: 'PAYMENT_GATEWAY_CONTRACT_DEPOSIT';
      data: Web3BusPaymentGatewayDepositEventData;
    }
  | {
      event: 'VESTING_CONTRACT_CLAIM';
      data: Web3BusVestingClaimEventData;
    }
  | {
      event: 'VESTING_CONTRACT_REFUND';
      data: Web3BusVestingRefundEventData;
    }
  | {
      event: 'PRO_RATA_CONTRACT_DEPOSIT';
      data: Web3BusProRataDepositEventData;
    }
  | {
      event: 'PRO_RATA_CONTRACT_REFUND';
      data: Web3BusProRataRefundEventData;
    }
  | {
      event: 'BABT_STATUS_CHANGED';
      data: Web3BusProBABTokenStatusChangedEventData;
    };

type Web3BusEventDataTx =
  | {
      tx: string;
    }
  | {
      error: string;
    };

export type Web3BusPaymentGatewayDepositEventData = {
  network: DeployNetworkKey;
  contractType: ContractType;
  contractAddress: string;
  userId: string;
  transactionId: string;
  account: string;
  amount: number;
  isSig: boolean;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusVestingClaimEventData = {
  network: DeployNetworkKey;
  contractAddress: string;
  account: string;
  amount: number;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusVestingRefundEventData = {
  network: DeployNetworkKey;
  contractAddress: string;
  account: string;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusProRataDepositEventData = {
  network: DeployNetworkKey;
  contractType: ContractType;
  contractAddress: string;
  account: string;
  isBoost: boolean;
  baseAmount: number;
  boostAmount: number;
  boostExchangeRate?: number;
  transactionId?: string;
  isSig?: boolean;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusProRataRefundEventData = {
  network: DeployNetworkKey;
  contractType: ContractType;
  contractAddress: string;
  account: string;
  isBoost: boolean;
  baseAmount: number;
  boostAmount: number;
  boostAverageExchangeRate: number;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusProBABTokenStatusChangedEventData = {
  network: DeployNetworkKey;
  contractType: ContractType;
  contractAddress: string;
  account: string;
  attested: boolean;
  timestamp?: Date;
} & Web3BusEventDataTx;
