import dayjs from 'dayjs';
import { BigNumberish } from 'ethers';
import { toUnixTime, toWei } from '~common';
import { ZERO } from '~common-service/constants';

export const deployParams = {
  attempts: 1,
  delay: 0,
};

export const now = dayjs();

export const seedData = {
  zero: ZERO,
  nowPlus1h: toUnixTime(now.add(1, 'hour').toDate()),
};

export const BASE_DECIMALS = 18;

export function toBaseTokenWei(value: BigNumberish): bigint {
  return toWei(value, BASE_DECIMALS);
}

const isTiny = true;

export const deployData = {
  now: toUnixTime(),
  nullAddress: '0x0000000000000000000000000000000000000000',
  userMintAmount: 100000,
  deposit1: toBaseTokenWei(isTiny ? 0.001 : 7_000),
  deposit2: toBaseTokenWei(isTiny ? 0.002 : 4_000),
};

export const sqrpProRataAddress = '0xCC71EC2A528b6F9f0f8556129eDdB20098EF6b24';

export const owner2PrivateKey = 'aba327ef99e306d56512f1c15c61d82302e8edd4aa776692e99c394643da1f46';
export const depositVerifierPrivateKey =
  'e6f8fde90650d548c818fb3676987105e19b345e740429727a381b1237b31340';

export const approveGasEstimation = BigInt(46355);
export const depositSigGasEstimation = BigInt(211093);
