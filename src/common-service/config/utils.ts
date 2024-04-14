import { BaseConfig } from './types';
import { readVault } from './vault';

export async function modifyConfig(config: BaseConfig) {
  // if (config.web3.ownerPrivateKey || !config.web3.vault?.enable) {
  //   return;
  // }

  const vaultData = await readVault();

  if (!vaultData) {
    throw new Error(`Couldn't read from vault`);
  }

  const ownerPrivateKey = vaultData[config.web3.vault?.ownerPrivateKeyRecord ?? ''];

  if (!ownerPrivateKey) {
    throw new Error(`Couldn't read ownerPrivateKey`);
  }

  // config.web3.ownerPrivateKey = ownerPrivateKey;
}
