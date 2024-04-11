import { DataSource } from 'typeorm';
import { NF, Promisable, Started } from '~common';
import { Web3BusEvent } from '~types';
import { Event } from './entities';

export interface StorageProcessor extends Started {
  setDataSource: (dataSource: DataSource) => void;
  process: (
    onProcessEvent?: (event: Event) => Promisable<void>,
    onContractEvent?: (event: Web3BusEvent) => Promisable<void>,
  ) => Promisable<void>;
}

export interface TransactionItemQuery {
  account: string;
  limit: string;
  offset: string;
}

export const NRecordsQuery = NF<TransactionItemQuery>();
