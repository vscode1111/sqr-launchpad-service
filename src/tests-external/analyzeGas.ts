import { Wallet } from 'ethers';
import { retry } from '~common';
import { DeployNetworkKey } from '~common-service/types';
import { getWeb3IndexerContext } from '~contracts';
import { accountDeposit } from './accountDeposit';
import { depositVerifierPrivateKey, owner2PrivateKey } from './constants';
import { ContextBase, GasRecord } from './types';

const NETWORK: DeployNetworkKey = 'bsc';

const TX_COUNT = 10;
// const HEADER = ['Account', 'Tx', 'Gas price', 'Gas limit', 'Gas used', 'Wallet index'];
const NEW_WALLET_OFFSET_SALT = 330;

const decimals = 18;
const tokenName = 'Test USDT2';

describe.only('analyze-gas', () => {
  beforeEach(async function () {
    // if (!services?.isStarted) {
    //   await services?.start();
    // }
    // await waitUntil(() => {
    //   console.log(111, services?.isStarted);
    //   return services?.isStarted;
    // });
  });

  afterEach(async function () {
    // await services?.stop();
  });

  it.only('get-signature', async () => {
    // const web3IndexerContext = services.getNetworkContext(NETWORK);
    const web3IndexerContext = getWeb3IndexerContext(NETWORK);
    if (!web3IndexerContext) {
      return;
    }

    const {
      rawProvider: provider,
      getErc20TokenByAccount,
      getWeb3pProRataByAccount,
    } = web3IndexerContext;

    // const tx2 = await owner2BaseToken.approve(user.address, BigInt(1));

    const context: ContextBase = {
      owner2: new Wallet(owner2PrivateKey, provider),
      depositVerifier: new Wallet(depositVerifierPrivateKey, provider),
      getErc20TokenByAccount,
      getWeb3pProRataByAccount,
    };

    const gasRecords: GasRecord[] = [];

    let errorCount = 0;

    for (let i = 0; i < TX_COUNT; i++) {
      try {
        await retry({
          fn: async (attempt) => {
            return await accountDeposit({
              attempt,
              taskIndex: i,
              walletIndex: i + NEW_WALLET_OFFSET_SALT,
              provider,
              context,
              decimals,
              tokenName,
              gasRecords,
            });
          },
          printError: true,
        });
      } catch (err) {
        errorCount++;
        console.error(`Task #${i}`, err);
      }
    }
  });
});
