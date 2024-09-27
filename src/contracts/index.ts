import { JsonRpcProvider, Signer, Wallet } from 'ethers';
import { DeployNetworkKey } from '~common-service';
import { config } from '~common-service/config';
import { DEFAULT_JSON_RPC_PROVIDER_OPTIONS, RANDOM_PRIVATE_KEY } from '~common-service/constants';
import {
  BABToken__factory,
  ERC20Token__factory,
  SQRPaymentGateway__factory,
  SQRVesting__factory,
  SQRpProRata__factory,
} from '~typechain-types';
import { SqrLaunchpadContext } from '../services';

export function getSqrLaunchpadContext(network: DeployNetworkKey): SqrLaunchpadContext {
  const rawProvider = new JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );

  const owner = new Wallet(config.web3.ownerPrivateKey ?? RANDOM_PRIVATE_KEY, rawProvider);
  const { address: ownerAddress } = owner;

  const emptySqrPaymentGateway = SQRPaymentGateway__factory.connect(ownerAddress, owner);
  const emptySqrVesting = SQRVesting__factory.connect(ownerAddress, owner);
  const emptySqrpProRata = SQRpProRata__factory.connect(ownerAddress, owner);
  const emptyBABToken = BABToken__factory.connect(ownerAddress, owner);

  return {
    owner,
    rawProvider,
    getErc20Token: (address: string) => ERC20Token__factory.connect(address, owner),
    getErc20TokenByAccount: (address: string, signer: Signer) =>
      ERC20Token__factory.connect(address, signer),
    emptySqrPaymentGateway,
    getSqrPaymentGateway: (address: string) => SQRPaymentGateway__factory.connect(address, owner),
    emptySqrVesting,
    getSqrVesting: (address: string) => SQRVesting__factory.connect(address, owner),
    emptySqrpProRata,
    getSqrpProRata: (address: string) => SQRpProRata__factory.connect(address, owner),
    getSqrpProRataByAccount: (address: string, signer: Signer) =>
      SQRpProRata__factory.connect(address, signer),
    emptyBABToken,
    getBABToken: (address: string) => BABToken__factory.connect(address, owner),
  };
}
