import { DeployNetworkKey } from '~common-service';

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

export type Web3BusPaymentGatewayEventType =
  | 'FCFS_DEPOSIT'
  | `SQRP_GATED_DEPOSIT`
  | 'WHITE_LIST_DEPOSIT';

export type Web3BusEventType = Web3BusPaymentGatewayEventType | 'VESTING_CLAIM';

// export interface Web3BusEvent {
//   event: Web3BusEventType;
//   data: Web3BusEventData;
// }

export type Web3BusEvent =
  | {
      event: Web3BusPaymentGatewayEventType;
      data: Web3BusPaymentGatewayEventData;
    }
  | {
      event: 'VESTING_CLAIM';
      data: Web3BusVestingEventData;
    };

type Web3BusEventDataTx =
  | {
      tx: string;
    }
  | {
      error: string;
    };

export type Web3BusPaymentGatewayEventData = {
  network: DeployNetworkKey;
  contractAddress: string;
  userId: string;
  transactionId: string;
  account: string;
  amount: number;
  isSig: boolean;
  timestamp?: Date;
} & Web3BusEventDataTx;

export type Web3BusVestingEventData = {
  network: DeployNetworkKey;
  contractAddress: string;
  account: string;
  amount: number;
  timestamp?: Date;
} & Web3BusEventDataTx;
