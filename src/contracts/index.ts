import { ethers } from 'ethers';
import {
  DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  DeployNetworkKey,
  RANDOM_PRIVATE_KEY,
  config,
} from '~common-service';
import { SqrLaunchpadContext } from '~services';
import {
  BABToken__factory,
  ERC20Token__factory,
  SQRPaymentGateway__factory,
  SQRVesting__factory,
  SQRpProRata__factory,
} from '~typechain-types';

export function getSqrLaunchpadContext(network: DeployNetworkKey): SqrLaunchpadContext {
  const rawProvider = new ethers.JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );

  const owner = new ethers.Wallet(config.web3.ownerPrivateKey ?? RANDOM_PRIVATE_KEY, rawProvider);
  const { address: ownerAddress } = owner;

  const emptySqrPaymentGateway = SQRPaymentGateway__factory.connect(ownerAddress, owner);
  const emptySqrVesting = SQRVesting__factory.connect(ownerAddress, owner);
  const emptySqrpProRata = SQRpProRata__factory.connect(ownerAddress, owner);
  const emptyBABToken = BABToken__factory.connect(ownerAddress, owner);

  return {
    owner,
    rawProvider,
    getErc20Token: (address: string) => ERC20Token__factory.connect(address, owner),
    emptySqrPaymentGateway,
    getSqrPaymentGateway: (address: string) => SQRPaymentGateway__factory.connect(address, owner),
    emptySqrVesting,
    getSqrVesting: (address: string) => SQRVesting__factory.connect(address, owner),
    emptySqrpProRata,
    getSqrpProRata: (address: string) => SQRpProRata__factory.connect(address, owner),
    emptyBABToken,
    getBABToken: (address: string) => BABToken__factory.connect(address, owner),
  };
}
