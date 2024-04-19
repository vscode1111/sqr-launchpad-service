import { JsonRpcProvider } from 'ethers';
import { ContractType } from '~db';
import { SQRLaunchpad } from '~typechain-types';

export type ContractTypeMap = Record<ContractType, string[]>;

export interface SqrLaunchpadContext {
  rawProvider: JsonRpcProvider;
  sqrLaunchpads: Record<string, SQRLaunchpad>;
  contractTypeMap: ContractTypeMap;
}
