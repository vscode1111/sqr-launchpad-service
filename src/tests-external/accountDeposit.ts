import { Provider, TransactionRequest } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { toNumberDecimals, waitTx, waitUntil } from '~common';
import { generateRandomWalletByPrivateKey, PendingCalculator } from '~common-back';
import { CacheMachine } from '~common-service';
import {
  approveGasEstimation,
  deployData,
  deployParams,
  depositSigGasEstimation,
  seedData,
  sqrpProRataAddress,
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
  const { owner2, depositVerifier, getErc20TokenByAccount, getSqrpProRataByAccount } = context;

  const { gasPrice } = await provider.getFeeData();

  const txOverrides: TransactionRequest = {
    gasPrice,
  };

  const user = generateRandomWalletByPrivateKey(owner2.privateKey, walletIndex, provider);

  const account = user.address;
  console.log(
    `-> Account ${account} is depositing, taskIndex: ${taskIndex}, walletIndex: ${walletIndex}, attempt: ${attempt} gasPrice: ${gasPrice} ...`,
  );

  const userSQRpProRata = getSqrpProRataByAccount(sqrpProRataAddress, user);
  const baseTokenAddress = await userSQRpProRata.baseToken();
  const owner2BaseToken = getErc20TokenByAccount(baseTokenAddress, owner2);
  const userBaseToken = getErc20TokenByAccount(baseTokenAddress, user);

  const nonce = await userSQRpProRata.getAccountDepositNonce(account);
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

    const currentAllowance = await userBaseToken.allowance(account, sqrpProRataAddress);
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
                  // await userBaseToken.approve.estimateGas(sqrpProRataAddress, totalSupply),
                  approveGasEstimation,
                  attempt,
                ),
            ),

          // nonce,
        );
      });

      await waitTx(
        userBaseToken.approve(sqrpProRataAddress, totalSupply, txOverrides),
        'approve',
        deployParams.attempts,
        deployParams.delay,
        // baseTokenFactory,
      );
      logInfo(
        `${toNumberDecimals(totalSupply, decimals)} ${tokenName} was approved to ${sqrpProRataAddress}`,
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
    userSQRpProRata.depositSig(
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
    // sqrpProRataFactory,
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
