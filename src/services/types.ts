import { JsonRpcProvider, Wallet } from 'ethers';
import { ContractType } from '~db';
import { SQRLaunchpad } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  owner: Wallet;
  rawProvider: JsonRpcProvider;
  firstSqrLaunchpad: SQRLaunchpad;
  getSqrLaunchpad: (address: string) => SQRLaunchpad;
}
