import { DeployNetworkKey } from '~common-service';

const chainConfig: Record<
  DeployNetworkKey,
  { erc20Decimals: number; minBalance: number; nativeSymbol: string }
> = {
  bsc: {
    erc20Decimals: 8,
    minBalance: 0.01,
    nativeSymbol: 'BNB',
  },
};

export function getChainConfig(network: string) {
  return chainConfig[network as DeployNetworkKey];
}
