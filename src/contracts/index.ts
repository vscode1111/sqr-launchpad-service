import { JsonRpcProvider, Signer, Wallet } from 'ethers';
import { DeployNetworkKey } from '~common-service';
import { config } from '~common-service/config';
import { DEFAULT_JSON_RPC_PROVIDER_OPTIONS, RANDOM_PRIVATE_KEY } from '~common-service/constants';
import {
  BABToken__factory,
  ERC20Token__factory,
  WEB3PaymentGateway__factory,
  WEB3Vesting__factory,
  WEB3ProRata__factory,
} from '~typechain-types';
import { Web3IndexerContext } from '../services';

export function getWeb3IndexerContext(network: DeployNetworkKey): Web3IndexerContext {
  const rawProvider = new JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );

  const owner = new Wallet(config.web3.ownerPrivateKey ?? RANDOM_PRIVATE_KEY, rawProvider);
  const { address: ownerAddress } = owner;

  const emptyWeb3PaymentGateway = WEB3PaymentGateway__factory.connect(ownerAddress, owner);
  const emptyWeb3Vesting = WEB3Vesting__factory.connect(ownerAddress, owner);
  const emptyWeb3pProRata = WEB3ProRata__factory.connect(ownerAddress, owner);
  const emptyBABToken = BABToken__factory.connect(ownerAddress, owner);

  return {
    owner,
    rawProvider,
    getErc20Token: (address: string) => ERC20Token__factory.connect(address, owner),
    getErc20TokenByAccount: (address: string, signer: Signer) =>
      ERC20Token__factory.connect(address, signer),
    emptyWeb3PaymentGateway,
    getWeb3PaymentGateway: (address: string) => WEB3PaymentGateway__factory.connect(address, owner),
    emptyWeb3Vesting,
    getWeb3Vesting: (address: string) => WEB3Vesting__factory.connect(address, owner),
    emptyWeb3pProRata,
    getWeb3pProRata: (address: string) => WEB3ProRata__factory.connect(address, owner),
    getWeb3pProRataByAccount: (address: string, signer: Signer) =>
      WEB3ProRata__factory.connect(address, signer),
    emptyBABToken,
    getBABToken: (address: string) => BABToken__factory.connect(address, owner),
  };
}
