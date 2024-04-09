import { ApiError } from '~common';
import { DeployNetworkKey } from '../types';
import { deployNetworks } from './networks';

const ALL_VALUE = 'all';

export function checkIfNetwork(
  value: string | undefined,
  errorMessage = `${value} is not correct network`,
): DeployNetworkKey {
  if (!(typeof value === 'string' && deployNetworks.includes(value as DeployNetworkKey))) {
    throw new ApiError(errorMessage, 404);
  }
  return value as DeployNetworkKey;
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
