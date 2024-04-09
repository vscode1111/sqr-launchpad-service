import { HDNodeWallet, Wallet, ethers } from 'ethers';
import { Errors } from 'moleculer';
import { keccak256FromStr } from './cryptography';

export async function generateRandomWallet(): Promise<HDNodeWallet> {
  return Wallet.createRandom();
}

export function generateRandomWalletByPrivateKey(
  privateKey: string,
  salt: string,
  rawProvider: ethers.JsonRpcProvider,
): ethers.Wallet {
  const newPrivateKey = keccak256FromStr(`${privateKey}-${salt}`);
  const wallet = new ethers.Wallet(newPrivateKey, rawProvider);
  const isAddress = ethers.isAddress(wallet.address);
  if (!isAddress) {
    throw new Errors.MoleculerError('Not valid EVM address was generated', 500, 'INTERNAL_ERROR');
  }
  return wallet;
}

export function sanitizePrivateKey(key: string): string {
  return key.replace('0x', '');
}
