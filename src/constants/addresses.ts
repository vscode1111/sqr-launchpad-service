import { DeployNetworkKey, Web3ConfigContract, config } from '~common-service';

export enum ContractList {
  SQRLaunchpad = 'SQRLaunchpad',
}

export const CONTRACTS: Record<ContractList, Record<DeployNetworkKey, Web3ConfigContract[]>> = {
  SQRLaunchpad: config.web3.contracts,
};

export const SQR_LAUNCHPAD = {
  // address: CONTRACTS.SQRLaunchpad.bsc[0].address,
  address: 'test',
  blockNumber: 41364055, //test-my2
  blockNumberMax: 40536829,
};
