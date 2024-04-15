import { NF } from '~common';

export interface TransactionItemQuery {
  account: string;
  limit: string;
  offset: string;
}

export const NRecordsQuery = NF<TransactionItemQuery>();
