import { PaymentGatewayTransactionItem } from '~db';

export interface TransactionItemJoinNetwork {
  TransactionItem_createdAt: Date;
  TransactionItem_updatedAt: Date;
  Network_name: string;
}

export type TransactionItemMap =
  | PaymentGatewayTransactionItem
  | {
      network: string;
    };
