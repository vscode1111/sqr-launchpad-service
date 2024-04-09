import { arrayify } from '@ethersproject/bytes';
import { createCipheriv, createDecipheriv } from 'crypto';
import {
  AbiCoder,
  Interface,
  Signer,
  keccak256,
  solidityPackedKeccak256,
  toUtf8Bytes,
} from 'ethers';
import { sanitizePrivateKey } from './wallet';

export function keccak256FromStr(data: string) {
  return keccak256(toUtf8Bytes(data));
}

export async function signMessage(
  signer: Signer,
  types: readonly string[],
  values: readonly any[],
) {
  const hash = solidityPackedKeccak256(types, values);
  const messageHashBin = arrayify(hash);
  return signer.signMessage(messageHashBin);
}

export function decodeInput<T>(input: string, abiInterface: Interface): T {
  return abiInterface.decodeFunctionData(input.slice(0, 10), input) as T;
}

export function decodeData(data: string, types: readonly string[]) {
  return AbiCoder.defaultAbiCoder().decode(types, data);
}

export function symmetricEncryptByPrivateKey(message: string, privateKey: string) {
  const sanitizedPrivateKey = sanitizePrivateKey(privateKey);
  const key = Buffer.from(sanitizedPrivateKey, 'hex');
  const iv = Buffer.from(sanitizedPrivateKey.substring(0, 32), 'hex');
  const cipher = createCipheriv('aes256', key, iv);
  return cipher.update(message, 'utf8', 'hex') + cipher.final('hex');
}

export function symmetricDecryptByPrivateKey(encryptedMessage: string, privateKey: string) {
  const sanitizedPrivateKey = sanitizePrivateKey(privateKey);
  const key = Buffer.from(sanitizedPrivateKey, 'hex');
  const iv = Buffer.from(sanitizedPrivateKey.substring(0, 32), 'hex');
  const decipher = createDecipheriv('aes256', key, iv);
  return decipher.update(encryptedMessage, 'hex', 'utf-8') + decipher.final('utf8');
}
