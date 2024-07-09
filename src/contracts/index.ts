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
import { getContractData } from '~utils';

export function getSqrLaunchpadContext(network: DeployNetworkKey): SqrLaunchpadContext {
  const rawProvider = new ethers.JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );

  const { sqrLaunchpadData } = getContractData(network);
  const owner = new ethers.Wallet(config.web3.ownerPrivateKey ?? RANDOM_PRIVATE_KEY, rawProvider);

  const firstSqrPaymentGateway = SQRPaymentGateway__factory.connect(
    sqrLaunchpadData[0].address,
    owner,
  );
  const firstSqrVesting = SQRVesting__factory.connect(sqrLaunchpadData[0].address, owner);
  const firstSqrpProRata = SQRpProRata__factory.connect(sqrLaunchpadData[0].address, owner);
  const firstBABToken = BABToken__factory.connect(sqrLaunchpadData[0].address, owner);

  return {
    owner,
    rawProvider,
    getErc20Token: (address: string) => ERC20Token__factory.connect(address, owner),
    firstSqrPaymentGateway,
    getSqrPaymentGateway: (address: string) => SQRPaymentGateway__factory.connect(address, owner),
    firstSqrVesting,
    getSqrVesting: (address: string) => SQRVesting__factory.connect(address, owner),
    firstSqrpProRata,
    getSqrpProRata: (address: string) => SQRpProRata__factory.connect(address, owner),
    firstBABToken,
    getBABToken: (address: string) => BABToken__factory.connect(address, owner),
  };
}
