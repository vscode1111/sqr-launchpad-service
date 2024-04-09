export interface Web3Block {
  number: number;
  hash: string;
  timestamp: number;
}

export interface Web3Transaction {
  hash: string;
  transactionIndex: number;
  blockNumber: number;
  from: string;
  to: string | null;
  gas: number;
  gasPrice: number;
  input: string;
  nonce: number;
  value: number;
}

export interface Web3Event {
  address: string;
  topics: string[];
  data?: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  removed: boolean;
}

export interface Web3Receipt {
  blockHash: string;
  blockNumber: string;
  contractAddress: string | null;
  cumulativeGasUsed: number;
  effectiveGasPrice: number;
  from: string;
  gasUsed: number;
  status: 'success' | 'failure';
  to: string;
  transactionHash: string;
  transactionIndex: number;
  type: number;
}
