import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { ERC20Token, SQRPaymentGateway, SQRVesting } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  firstSqrPaymentGateway: SQRPaymentGateway;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  firstSqrVesting: SQRVesting;
  getSqrVesting: (address: string) => SQRVesting;
  getErc20Token: (address: string) => ERC20Token;
}
