import { DeployNetworkKey } from '../types';

const chainConfig: Record<
  DeployNetworkKey,
  {
    web3Decimals: number;
    minBalance: number;
    nativeSymbol: string;
  }
> = {
  mainnet: {
    web3Decimals: 8,
    minBalance: 0.001,
    nativeSymbol: 'ETH',
  },
  bsc: {
    web3Decimals: 8,
    minBalance: 0.01,
    nativeSymbol: 'BNB',
  },
};

export function getChainConfig(network: string) {
  return chainConfig[network as DeployNetworkKey];
}
