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

export type Web3BusEventType = 'PAYMENT_GATEWAY' | 'VESTING' | 'PRO_RATA';

export type Web3BusEvent =
  | {
      event: 'PAYMENT_GATEWAY_CONTACT_DEPOSIT';
      data: Web3BusPaymentGatewayDepositEventData;
    }
  | {
      event: 'VESTING_CONTACT_CLAIM';
      data: Web3BusVestingClaimEventData;
    }
  | {
      event: 'PRO_RATA_CONTACT_DEPOSIT';
      data: Web3BusProRataDepositEventData;
    }
  | {
      event: 'PRO_RATA_CONTACT_REFUND';
      data: Web3BusProRataRefundEventData;
    };

//SQR_P_PRO_RATA_CONTRACT_DEPOSIT

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

export type Web3BusProRataDepositEventData = {
  network: DeployNetworkKey;
  contractType: ContractType;
  contractAddress: string;
  account: string;
  amount: number;
  transactionId?: string;
  isSig?: boolean;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusProRataRefundEventData = {
  network: DeployNetworkKey;
  contractType: ContractType;
  contractAddress: string;
  account: string;
  amount: number;
  timestamp?: Date;
} & Web3BusEventDataTx;
