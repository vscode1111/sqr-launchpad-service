import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { SQRPaymentGateway, SQRVesting } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  firstSqrPaymentGateway: SQRPaymentGateway;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  firstSqrVesting: SQRVesting;
}
