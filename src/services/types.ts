import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { ERC20Token, SQRPaymentGateway, SQRVesting, SQRpProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  firstSqrPaymentGateway: SQRPaymentGateway;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  firstSqrVesting: SQRVesting;
  getSqrVesting: (address: string) => SQRVesting;
  firstSqrpProRata: SQRpProRata;
  getSqrpProRata: (address: string) => SQRpProRata;
}
