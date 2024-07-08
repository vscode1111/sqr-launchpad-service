export interface PaymentGatewayDepositInput {
  userId: string;
  transactionId: string;
  account: string;
  amount: bigint;
  timestampLimit: number;
  signature: string;
}

export type ProRataDepositInput = [
  [
    baseAmount: string, //0
    boost: boolean, //1
    boostExchangeRate: string, //2
    transactionId: string, //3
    timestampLimit: string, //4
    signature: string, //5
  ],
];
