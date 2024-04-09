import { ethers } from 'ethers';
import {
  DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  DeployNetworkKey,
  RANDOM_PRIVATE_KEY,
  config,
  objectFactory,
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
  const addresses = sqrLaunchpadData.map((i) => i.address);
  const owner = new ethers.Wallet(RANDOM_PRIVATE_KEY, rawProvider);
  const sqrLaunchpads = objectFactory(addresses, (address) =>
    SQRLaunchpad__factory.connect(address, owner),
  );

  return {
    rawProvider,
    sqrLaunchpads,
  };
}
