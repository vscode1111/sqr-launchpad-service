import Bluebird from 'bluebird';
import { BigNumberish, Numeric, Provider, Signer } from 'ethers';
import {
  DEFAULT_DECIMALS,
  formatDate,
  Promisable,
  toNumberDecimals,
  toNumberDecimalsFixed,
  waitTxEx,
} from '~common';
import { signEncodedMessage } from '~common-back';
import { ZERO } from '~common-service';

const LOGGING = true;

export async function runConcurrently(
  fn: (taskId: number) => Promisable<void>,
  taskCount: number,
  concurrencyCount: number,
  printStep: number,
) {
  // console.log(`Start performance test, count: ${taskCount}, concurrency: ${concurrencyCount}`);

  const tasks = Array(taskCount)
    .fill(null)
    .map((_, i) => i);

  const t0 = new Date().getTime();

  let c0 = new Date().getTime();

  await Bluebird.map(
    tasks,
    async (task) => {
      await fn(task);

      if (task % printStep === 0) {
        const diff = (new Date().getTime() - c0) / 1000;
        const rps = printStep / diff;
        console.log(`current task: ${task} in ${diff.toFixed(2)} s, rps: ${rps.toFixed(2)}`);
        c0 = new Date().getTime();
      }
    },
    { concurrency: concurrencyCount },
  );

  const diff = (new Date().getTime() - t0) / 1000;
  const rps = taskCount / diff;
  console.log(
    `Total: ${taskCount} requests (${concurrencyCount} concurrencies) in ${diff.toFixed(
      2,
    )} s, rps: ${rps.toFixed(2)}`,
  );
}

export function logInfo(...msg: any[]) {
  if (!LOGGING) {
    return;
  }

  const date = formatDate(new Date());
  console.log(`[${date}]`, ...msg);
}

export function logError(...msg: any[]) {
  if (!LOGGING) {
    return;
  }

  const date = formatDate(new Date());
  console.error(`[${date}]`, ...msg);
}

export async function getTxFee(provider: Provider, gasFn: () => Promise<bigint>) {
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? BigInt(0);
  const gas = await gasFn();
  return gas * gasPrice;
}

export async function checkTxFeeAndSendNativeToken(
  owner: Signer,
  user: Signer,
  provider: Provider,
  gasFn: () => Promise<bigint>,
  nonce?: number,
) {
  const ownerAddress = await owner.getAddress();
  const userAddress = await user.getAddress();

  const feePrice = await getTxFee(provider, gasFn);

  if (feePrice === ZERO) {
    throw new Error(`Approve fee price isn't correct`);
  }

  let serviceNativeBalance = await provider.getBalance(ownerAddress);
  const userNativeBalance = await provider.getBalance(userAddress);

  if (feePrice > userNativeBalance) {
    const diff = feePrice - userNativeBalance;

    if (diff > serviceNativeBalance) {
      throw new Error(
        `Service balance ${toNumberDecimals(
          serviceNativeBalance,
        )} isn't enough for fee ${toNumberDecimals(diff)}`,
      );
    }

    await waitTxEx(
      owner.sendTransaction({
        to: userAddress,
        value: diff,
        nonce,
      }),
      {
        onStarted: async (tx) => {
          logInfo(`Transfer onStarted event native token for ${userAddress} tx: ${tx.hash}`);
        },
        onSuccess: async (tx) => {
          logInfo(`Transfer onSuccess event native token for ${userAddress} tx: ${tx.hash}`);
        },
        onFail: async (err) => {
          logError(`Transfer onFail event native token for ${userAddress} err: ${err}`);
        },
      },
    );
  }
}

export async function signMessageForProRataDeposit(
  signer: Signer,
  account: string,
  amount: bigint,
  boost: boolean,
  boostExchangeRate: bigint,
  nonce: number,
  transactionId: string,
  timestampLimit: number,
) {
  return signEncodedMessage(
    signer,
    //  account, amount, boost, amountRatio, nonce, transactionId, timestampLimit
    ['address', 'uint256', 'bool', 'uint256', 'uint32', 'string', 'uint32'],
    [account, amount, boost, boostExchangeRate, nonce, transactionId, timestampLimit],
  );
}

export function formatToken(
  value: BigNumberish,
  decimals: Numeric = DEFAULT_DECIMALS,
  tokenName?: string,
): string {
  return `${toNumberDecimalsFixed(value, decimals)}${tokenName ? ` ${tokenName}` : ``}`;
}

export function formatContractToken(
  value: BigNumberish,
  decimals: Numeric,
  tokenName?: string,
): string {
  return `${value} (${formatToken(BigInt(value), decimals, tokenName)})`;
}

export function formatContractDate(value: BigNumberish): string {
  const internalValue = Number(value);
  return `${internalValue} (${formatDate(internalValue)})`;
}

export function calculateAttemptGas(initGas: bigint, attempt: number, factor = 0.5) {
  const result = (initGas * BigInt(Math.round((1 + factor * (attempt - 1)) * 100))) / BigInt(100);
  console.log(111, result);
  return result;
}
