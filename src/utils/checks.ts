import { BaseConfig, checkVariable } from '~common-service';

export function checkBaseConfig(config: BaseConfig) {
  checkVariable(config.web3.contracts, 'config.web3.contracts', true);
  checkVariable(config.web3.provider, 'config.web3.provider', true);
}

export function getCacheContractSettingKey(networkName: string, contractAddress: string) {
  return `CONTRACT-SETTINGS-${networkName}-${contractAddress}`;
}
