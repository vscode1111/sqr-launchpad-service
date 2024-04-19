import { ethers } from 'ethers';
import {
  DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  DeployNetworkKey,
  RANDOM_PRIVATE_KEY,
  config,
  objectFactory,
} from '~common-service';
import { ContractType } from '~db';
import { ContractTypeMap, SqrLaunchpadContext } from '~services';
import { SQRLaunchpad__factory } from '~typechain-types';
import { getContractData } from '~utils';

export function getSqrLaunchpadContext(network: DeployNetworkKey): SqrLaunchpadContext {
  const rawProvider = new ethers.JsonRpcProvider(
    config.web3.provider[network].http,
    undefined,
    DEFAULT_JSON_RPC_PROVIDER_OPTIONS,
  );
  const { sqrLaunchpadData } = getContractData(network);

  const contractTypeMap: ContractTypeMap = {} as ContractTypeMap;

  const owner = new ethers.Wallet(RANDOM_PRIVATE_KEY, rawProvider);
  const sqrLaunchpads = objectFactory(
    sqrLaunchpadData,
    (contractData) => {
      const { address } = contractData;

      const type: ContractType = contractData.type as ContractType;
      if (type) {
        if (!contractTypeMap[type]) {
          contractTypeMap[type] = [];
        }
        contractTypeMap[type].push(address);
      }

      return SQRLaunchpad__factory.connect(address, owner);
    },
    (object) => object.address,
  );

  return {
    rawProvider,
    sqrLaunchpads,
    contractTypeMap,
  };
}
