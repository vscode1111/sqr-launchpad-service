import { JsonRpcProvider, Signer, Wallet } from 'ethers';
import { ContractType } from '~db';
import { BABToken, ERC20Token, WEB3PaymentGateway, WEB3Vesting, WEB3ProRata } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface Web3LaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  getErc20Token: (address: string) => ERC20Token;
  getErc20TokenByAccount: (address: string, signer: Signer) => ERC20Token;
  emptyWeb3PaymentGateway: WEB3PaymentGateway;
  getWeb3PaymentGateway: (address: string) => WEB3PaymentGateway;
  emptyWeb3Vesting: WEB3Vesting;
  getWeb3Vesting: (address: string) => WEB3Vesting;
  emptyWeb3pProRata: WEB3ProRata;
  getWeb3pProRata: (address: string) => WEB3ProRata;
  getWeb3pProRataByAccount: (address: string, signer: Signer) => WEB3ProRata;
  emptyBABToken: BABToken;
  getBABToken: (address: string) => BABToken;
}
