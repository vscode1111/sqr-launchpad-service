import { ApiError } from '~common';
//Do not change "from '~db/entities'"
import { ContractType, contractTypes } from '~db/entities';
import { DeployNetworkKey } from '../types';
import { deployNetworks } from './networks';

const ALL_VALUE = 'all';

export function checkIfNetwork(
  value: string | undefined,
  errorMessage = `${value} should be one of [${deployNetworks.join(', ')}]`,
): DeployNetworkKey {
  if (!(typeof value === 'string' && deployNetworks.includes(value as DeployNetworkKey))) {
    throw new ApiError(errorMessage, 404);
  }
  return value as DeployNetworkKey;
}

export function checkIfContractType(
  value: string | undefined,
  errorMessage = `${value} should be one of [${contractTypes.join(', ')}]`,
): ContractType {
  if (!(typeof value === 'string' && contractTypes.includes(value as ContractType))) {
    throw new ApiError(errorMessage, 404);
  }
  return value as ContractType;
}

export function checkIfNetworkWithAll(
  value: string | undefined,
  errorMessage = `${value} is not correct network`,
) {
  if (value === ALL_VALUE) {
    return;
  }

  return checkIfNetwork(value, errorMessage);
}
