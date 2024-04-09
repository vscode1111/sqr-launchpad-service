import { BaseConfig } from 'msq-moleculer-core';
import { checkVariable } from '~common';

export function checkBaseConfig(config: BaseConfig) {
  checkVariable(config.web3.contracts, 'config.web3.contracts', true);
  checkVariable(config.web3.provider, 'config.web3.provider', true);
}
