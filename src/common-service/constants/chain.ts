import { DeployNetworkKey } from '~common-service';

const chainConfig: Record<
  DeployNetworkKey,
  { sqrDecimals: number; minBalance: number; nativeSymbol: string }
> = {
  bsc: {
    sqrDecimals: 8,
    minBalance: 0.01,
    nativeSymbol: 'BNB',
  },
};

export function getChainConfig(network: string) {
  return chainConfig[network as DeployNetworkKey];
}
