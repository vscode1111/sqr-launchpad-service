import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { BABToken, ERC20Token, SQRPaymentGateway, SQRVesting, SQRpProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  emptySqrPaymentGateway: SQRPaymentGateway;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  emptySqrVesting: SQRVesting;
  getSqrVesting: (address: string) => SQRVesting;
  emptySqrpProRata: SQRpProRata;
  getSqrpProRata: (address: string) => SQRpProRata;
  emptyBABToken: BABToken;
  getBABToken: (address: string) => BABToken;
}
