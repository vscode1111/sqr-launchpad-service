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

export type Web3BusEventType = 'STAKE' | 'CLAIM' | 'UNSTAKE';

export interface Web3BusEvent {
  event: Web3BusEventType;
  data: Web3BusEventData;
}

export type Web3BusEventDataBase = {
  network: DeployNetworkKey;
  contractAddress: string;
  contractDuration: number;
  account: string;
  userStakeId: number;
  amount: number;
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
