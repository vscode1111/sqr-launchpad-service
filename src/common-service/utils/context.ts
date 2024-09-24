import { config, Web3ConfigContract } from '../config';
import { DeployNetworkKey } from '../types';

export function getContractData(network: DeployNetworkKey): Web3ConfigContract[] {
  return config.web3.contracts[network];
}
