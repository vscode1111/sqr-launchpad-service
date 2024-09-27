import { JsonRpcProvider, Signer, Wallet } from 'ethers';
import { ContractType } from '~db';
import { BABToken, ERC20Token, SQRPaymentGateway, SQRVesting, SQRpProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  getErc20TokenByAccount: (address: string, signer: Signer) => ERC20Token;
  emptySqrPaymentGateway: SQRPaymentGateway;
  getSqrPaymentGateway: (address: string) => SQRPaymentGateway;
  emptySqrVesting: SQRVesting;
  getSqrVesting: (address: string) => SQRVesting;
  emptySqrpProRata: SQRpProRata;
  getSqrpProRata: (address: string) => SQRpProRata;
  getSqrpProRataByAccount: (address: string, signer: Signer) => SQRpProRata;
  emptyBABToken: BABToken;
  getBABToken: (address: string) => BABToken;
}
