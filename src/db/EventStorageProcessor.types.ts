export interface PaymentGatewayDepositInput {
  userId: string;
  transactionId: string;
  account: string;
  amount: bigint;
  timestampLimit: number;
  signature: string;
}

export interface ProRataDepositInput {
  account: string;
  amount: bigint;
  transactionId: string;
  timestampLimit: number;
  signature: string;
}
