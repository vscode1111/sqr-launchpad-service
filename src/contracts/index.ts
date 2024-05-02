import { ethers } from 'ethers';
import {
  DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  DeployNetworkKey,
  RANDOM_PRIVATE_KEY,
  config,
} from '~common-service';
import { SqrLaunchpadContext } from '~services';
import { SQRLaunchpad__factory } from '~typechain-types';
import { getContractData } from '~utils';

export function getSqrLaunchpadContext(network: DeployNetworkKey): SqrLaunchpadContext {
  const rawProvider = new ethers.JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );

  const { sqrLaunchpadData } = getContractData(network);
  const owner = new ethers.Wallet(config.web3.ownerPrivateKey ?? RANDOM_PRIVATE_KEY, rawProvider);
  const firstSqrLaunchpad = SQRLaunchpad__factory.connect(sqrLaunchpadData[0].address, owner);

  return {
    owner,
    rawProvider,
    firstSqrLaunchpad,
    getSqrLaunchpad: (address: string) => SQRLaunchpad__factory.connect(address, owner),
  };
}
