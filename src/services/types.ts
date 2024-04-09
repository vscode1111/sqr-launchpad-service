import { JsonRpcProvider } from 'ethers';
import { SQRLaunchpad } from '~typechain-types';

export interface SqrLaunchpadContext {
  rawProvider: JsonRpcProvider;
  sqrLaunchpads: Record<string, SQRLaunchpad>;
}
