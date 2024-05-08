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

export type Web3BusEventType =
  | 'FCFS_DEPOSIT'
  | `SQRP_GATED_DEPOSIT`
  | 'WHITE_LIST_DEPOSIT'
  | 'VESTING_CLAIM';

export interface Web3BusEvent {
  event: Web3BusEventType;
  data: Web3BusEventData;
}

export type Web3BusEventDataBase = {
  network: DeployNetworkKey;
  contractAddress: string;
  userId: string;
  transactionId: string;
  account: string;
  amount: number;
  isSig: boolean;
  timestamp?: Date;
};

export type Web3BusEventData = Web3BusEventDataBase &
  (
    | {
        tx: string;
      }
    | {
        error: string;
      }
  );
