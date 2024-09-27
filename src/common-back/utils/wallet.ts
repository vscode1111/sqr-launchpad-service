import { HDNodeWallet, Provider, Wallet, isAddress } from 'ethers';
import { StringNumber } from '~common';
import { keccak256FromStr } from './cryptography';

export async function generateRandomWallet(): Promise<HDNodeWallet> {
  return Wallet.createRandom();
}

export function generateRandomWalletByPrivateKey(
  privateKey: string,
  salt: StringNumber,
  provider: Provider,
): Wallet {
  const newPrivateKey = keccak256FromStr(`${privateKey}-${salt}`);
  const wallet = new Wallet(newPrivateKey, provider);
  const _isAddress = isAddress(wallet.address);
  if (!_isAddress) {
    throw new Error('Not valid EVM address was generated');
  }
  return wallet;
}

export function sanitizePrivateKey(key: string): string {
  return key.replace('0x', '');
}
