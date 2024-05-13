export interface DepositInput {
  userId: string;
  transactionId: string;
  account: string;
  amount: bigint;
  timestampLimit: number;
  signature: string;
}

export interface ContractSettings {
  erc20Decimals: number;
}
