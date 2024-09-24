import { toWei } from '~common';
import { DeployNetworkKey } from '../types';

export const ZERO = toWei(0);

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const UINT32_MAX = 4294967295;

export const GENESIS_BLOCK_NUMBER = 1;

export const DB_CONTRACT_CONCURRENCY_COUNT = 5;
export const DB_EVENT_CONCURRENCY_COUNT = 20;
export const DB_POOL_SPARE = 2;

export const DB_POOL_SIZE =
  DB_CONTRACT_CONCURRENCY_COUNT * DB_EVENT_CONCURRENCY_COUNT + DB_POOL_SPARE;

export const HANDLER_CONCURRENCY_COUNT = 50;

export const LAST_EXTERNAL_REQUEST_STATS_LIMIT = 10;

export const LOG_RPC_REQUEST = true;

export const SEC_RULE = '* * * * * *';

export const DEFAULT_NETWORK: DeployNetworkKey = 'bsc';

export const RANDOM_PRIVATE_KEY =
  'b39c6a8cc61e7b54c932aff29692d353d87355578fdcb966d88f4dda2b92bd02';

export const web3Constants = {
  latest: 'latest',
};
