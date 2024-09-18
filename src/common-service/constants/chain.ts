import { DeployNetworkKey } from '../types';

const chainConfig: Record<
  DeployNetworkKey,
  {
    sqrDecimals: number;
    minBalance: number;
    nativeSymbol: string;
  }
> = {
  mainnet: {
    sqrDecimals: 8,
    minBalance: 0.001,
    nativeSymbol: 'ETH',
  },
  bsc: {
    sqrDecimals: 8,
    minBalance: 0.01,
    nativeSymbol: 'BNB',
  },
};

export function getChainConfig(network: string) {
  return chainConfig[network as DeployNetworkKey];
}
