import { PaymentGatewayTransactionItem } from '~db';
import { TransactionItemJoinNetwork, TransactionItemMap } from '~types';

export function mapDbTransactionItem(
  item: PaymentGatewayTransactionItem & TransactionItemJoinNetwork,
): TransactionItemMap {
  const { TransactionItem_createdAt, TransactionItem_updatedAt, Network_name, ...rest } = item;
  return {
    ...rest,
    network: Network_name,
    createdAt: TransactionItem_createdAt,
    updatedAt: TransactionItem_updatedAt,
  };
}
