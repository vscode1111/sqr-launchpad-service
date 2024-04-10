export interface DepositInput {
  userId: string;
  transactionId: string;
  account: string;
  amount: bigint;
  timestampLimit: number;
  signature: string;
}
