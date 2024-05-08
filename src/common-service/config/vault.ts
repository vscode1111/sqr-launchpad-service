import NodeVault from 'node-vault';
import { config } from '../config';
import { VaultAuthResponse, VaultRecordSubData } from './vault.types';

export async function readVault(): Promise<VaultRecordSubData | null> {
  if (!config.web3.vault) {
    return null;
  }

  const { url, baseRecord, role_id, secret_id } = config.web3.vault;
  let options: NodeVault.Option = {
    endpoint: url,
    requestOptions: {
      strictSSL: false,
    },
  };

  let vault = NodeVault(options);
  const result: VaultAuthResponse = await vault.write('auth/msq-services/login', {
    role_id,
    secret_id,
  });

  options = { ...options, token: result.auth.client_token };
  vault = NodeVault(options);
  const secret = await vault.read(baseRecord);
  return secret.data.data;
}
