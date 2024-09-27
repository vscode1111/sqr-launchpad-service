import { Signer, Wallet } from 'ethers';
import { ERC20Token, SQRpProRata } from '~typechain-types';

export interface GasRecord {
  account: string;
  tx: string;
  gasPrice: number;
  gasLimit: number;
  gasUsed: number;
  walletIndex: number;
}

export interface ContextBase {
  owner2: Wallet;
  depositVerifier: Wallet;
  getErc20TokenByAccount: (address: string, signer: Signer) => ERC20Token;
  getSqrpProRataByAccount: (address: string, signer: Signer) => SQRpProRata;
}
