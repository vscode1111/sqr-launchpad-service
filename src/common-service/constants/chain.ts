import { DeployNetworkKey } from '~common-service';

const chainConfig: Record<DeployNetworkKey, { minBalance: number; nativeSymbol: string }> = {
  bsc: {
    minBalance: 0.01,
    nativeSymbol: 'BNB',
  },
};

export function getChainConfig(network: string) {
  return chainConfig[network as DeployNetworkKey];
}
