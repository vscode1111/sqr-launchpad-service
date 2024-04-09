import { DeployNetworkKey } from '~common-service';
import { CONTRACTS } from '~constants';
import { ContractDataCollection } from '~types';

export function getContractData(network: DeployNetworkKey): ContractDataCollection {
  const sqrLaunchpadData = CONTRACTS.SQRLaunchpad[network];
  return {
    sqrLaunchpadData,
  };
}
