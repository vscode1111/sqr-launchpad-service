import { Provider, TransactionRequest } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { toNumberDecimals, waitTx, waitUntil } from '~common';
import { generateRandomWalletByPrivateKey, PendingCalculator } from '~common-back';
import { CacheMachine } from '~common-service/utils';
import {
  approveGasEstimation,
  deployData,
  deployParams,
  depositSigGasEstimation,
  seedData,
  web3ProRataAddress,
} from './constants';
import { ContextBase, GasRecord } from './types';
import {
  calculateAttemptGas,
  checkTxFeeAndSendNativeToken,
  formatContractDate,
  formatContractToken,
  logInfo,
  signMessageForProRataDeposit,
} from './utils';

const LOGGING = false;

const NEED_INIT_TOKENS = true;

const SKIP_DEPOSIT_SIG_TX = false;

const pendingCalculator = new PendingCalculator();
const cacheMachine = new CacheMachine();

export async function accountDeposit({
  attempt,
  taskIndex,
  walletIndex,
  provider,
  context,
  decimals,
  tokenName,
  gasRecords,
}: {
  attempt: number;
  taskIndex: number;
  walletIndex: number;
  provider: Provider;
  context: ContextBase;
  decimals: number;
  tokenName: string;
  gasRecords: GasRecord[];
}) {
  const { owner2, depositVerifier, getErc20TokenByAccount, getWeb3pProRataByAccount } = context;

  const { gasPrice } = await provider.getFeeData();

  const txOverrides: TransactionRequest = {
    gasPrice,
  };

  const user = generateRandomWalletByPrivateKey(owner2.privateKey, walletIndex, provider);

  const account = user.address;
  console.log(
    `-> Account ${account} is depositing, taskIndex: ${taskIndex}, walletIndex: ${walletIndex}, attempt: ${attempt} gasPrice: ${gasPrice} ...`,
  );

  const userWEB3ProRata = getWeb3pProRataByAccount(web3ProRataAddress, user);
  const baseTokenAddress = await userWEB3ProRata.baseToken();
  const owner2BaseToken = getErc20TokenByAccount(baseTokenAddress, owner2);
  const userBaseToken = getErc20TokenByAccount(baseTokenAddress, user);

  const nonce = await userWEB3ProRata.getAccountDepositNonce(account);
  const transactionId = uuidv4();

  const params = {
    account,
    amount: deployData.deposit1,
    nonce: Number(nonce),
    boost: false,
    boostExchangeRate: seedData.zero,
    transactionId,
    timestampLimit: seedData.nowPlus1h,
    signature: '',
  };

  if (NEED_INIT_TOKENS) {
    const currentBalance = await userBaseToken.balanceOf(account);
    logInfo(`${toNumberDecimals(currentBalance, decimals)} has tokens`);

    const needToTransfer = params.amount > currentBalance;
    // const needToTransfer = true;

    if (needToTransfer) {
      await pendingCalculator.call(`${taskIndex}`, async (pendingCount) => {
        const owner2InitNonce = await provider.getTransactionCount(owner2);
        const nonce = owner2InitNonce + pendingCount;
        console.log(
          `T-Owner2 ${taskIndex}, init nonce: ${owner2InitNonce}, ${pendingCount}`,
          nonce,
        );

        const amount = params.amount * BigInt(10);

        await waitTx(
          owner2BaseToken.transfer(account, amount, {
            ...txOverrides,
            // nonce: owner2InitNonce + taskIndex,
            // nonce,
          }),
          'transfer',
          deployParams.attempts,
          deployParams.delay,
          // ERC20Token__factory,
        );

        logInfo(`${toNumberDecimals(amount, decimals)} ${tokenName} was send to ${account}`);
      });
    }

    await waitUntil(() => pendingCalculator.count() === 0);

    // return;

    const currentAllowance = await userBaseToken.allowance(account, web3ProRataAddress);
    logInfo(`${toNumberDecimals(currentAllowance, decimals)} token was allowed`);

    const needToApprove = params.amount > currentAllowance;
    // const needToApprove = true;

    if (needToApprove) {
      const totalSupply = await userBaseToken.totalSupply();

      await pendingCalculator.call(`${taskIndex}`, async (pendingCount) => {
        const owner2InitNonce = await provider.getTransactionCount(owner2);
        const nonce = owner2InitNonce + pendingCount;
        console.log(
          `A-Owner2 ${taskIndex}, init nonce: ${owner2InitNonce}, ${pendingCount}`,
          nonce,
        );

        await checkTxFeeAndSendNativeToken(
          owner2,
          user,
          provider,
          async () =>
            cacheMachine.call(
              () => 'approve',
              async () =>
                calculateAttemptGas(
                  // await userBaseToken.approve.estimateGas(web3ProRataAddress, totalSupply),
                  approveGasEstimation,
                  attempt,
                ),
            ),

          // nonce,
        );
      });

      await waitTx(
        userBaseToken.approve(web3ProRataAddress, totalSupply, txOverrides),
        'approve',
        deployParams.attempts,
        deployParams.delay,
        // baseTokenFactory,
      );
      logInfo(
        `${toNumberDecimals(totalSupply, decimals)} ${tokenName} was approved to ${web3ProRataAddress}`,
      );
    }
  }

  // return;

  await checkTxFeeAndSendNativeToken(owner2, user, provider, async () => depositSigGasEstimation);

  params.signature = await signMessageForProRataDeposit(
    depositVerifier,
    params.account,
    params.amount,
    params.boost,
    params.boostExchangeRate,
    params.nonce,
    params.transactionId,
    params.timestampLimit,
  );

  const depositSigGas = depositSigGasEstimation;

  if (LOGGING) {
    console.table({
      ...params,
      amount: formatContractToken(params.amount, decimals, tokenName),
      timestampLimit: formatContractDate(params.timestampLimit),
    });
  }

  const depositTxOverrides: TransactionRequest = {
    ...txOverrides,
    gasLimit: depositSigGas,
    // nonce: initNonce + i,
  };

  console.log(depositTxOverrides);

  if (SKIP_DEPOSIT_SIG_TX) {
    return;
  }

  const tx = await waitTx(
    userWEB3ProRata.depositSig(
      {
        baseAmount: params.amount,
        boost: params.boost,
        boostExchangeRate: params.boostExchangeRate,
        transactionId: params.transactionId,
        timestampLimit: params.timestampLimit,
        signature: params.signature,
      },
      depositTxOverrides,
    ),
    'depositSig',
    deployParams.attempts,
    deployParams.delay,
    // web3ProRataFactory,
  );

  const gasRecord: GasRecord = {
    walletIndex,
    account,
    tx: tx.hash,
    gasPrice: Number(gasPrice),
    gasLimit: Number(depositSigGas),
    gasUsed: Number(tx.gasUsed),
  };

  gasRecords.push(gasRecord);

  console.log(`Account ${account} finished depositing`);
}
