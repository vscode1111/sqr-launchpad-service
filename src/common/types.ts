import { TransactionResponse } from 'ethers';

export type StringNumber = string | number;

export type Promisable<T> = T | Promise<T>;

export interface PostReceiver {
  inform: (tx: TransactionResponse) => Promise<void>;
}

export interface Initilized {
  init: () => Promisable<any>;
}

export interface Started {
  start: () => Promisable<any>;
}

export interface Stopped {
  stop: () => Promisable<any>;
}

export interface EventNotifier<T> {
  send: (event: T) => Promise<void>;
}
