import { ContractFactory, toNumber, TransactionReceipt, TransactionResponse } from 'ethers';
// import { DeployNetworkKey } from '~common-service';
import { sleep } from './misc';
import { PostReceiver, Promisable } from './types';

export const MISSING_SERVICE_PRIVATE_KEY = `Service hasn't correct private key of smart-contract`;

export const FRACTION_DIGITS = 5;

// export async function getTxOverrides(
//   services: Services,
//   network: DeployNetworkKey,
//   gasPriceFactor = 1,
//   gasLimit = 200000,
// ): Promise<Overrides | null> {
//   const context = services.getNetworkContext(network);

//   if (!context) {
//     throw MISSING_SERVICE_PRIVATE_KEY;
//   }

//   const rawProvider = context?.rawProvider;

//   if (!rawProvider) {
//     return null;
//   }

//   const feeData = await rawProvider.getFeeData();
//   const gasPrice = ((feeData.gasPrice ?? BigInt(1)) * BigInt(gasPriceFactor)) / BigInt(100);

//   return {
//     gasPrice,
//     gasLimit,
//   };
// }

export async function callWithTimer(fn: () => Promise<void>) {
  const startTime = new Date();
  await fn();
  const finishTime = new Date();
  return (finishTime.getTime() - startTime.getTime()) / 1000;
}

export async function txAttempt(
  fn: () => Promise<any>,
  attempts = 3,
  delay = 1000,
  contractFactory?: ContractFactory,
): Promise<any> {
  try {
    return await fn();
  } catch (e: any) {
    if (attempts > 0) {
      console.log(e);
      if ('data' in e) {
        const errorFragment = contractFactory?.interface.getError(e.data);
        const postfix = errorFragment?.name ? `-> ${errorFragment?.name}` : '';
        console.log(`Error data: ${e.data} ${postfix}`);
      }
      await sleep(delay);
      console.log(`${attempts - 1} attempts left`);
      return await txAttempt(fn, attempts - 1, delay);
    } else {
      throw e;
    }
  }
}

export async function waitTx(
  promise: Promise<TransactionResponse>,
  functionName?: string,
  attempts = 3,
  delay = 1000,
  contractFactory?: ContractFactory,
): Promise<TransactionReceipt> {
  return txAttempt(
    async () => {
      let receipt!: TransactionReceipt | null;
      const time = await callWithTimer(async function () {
        if (functionName) {
          console.log(`TX: ${functionName} ...`);
        }
        const tx = await promise;
        if (functionName) {
          console.log(`TX: ${functionName} hash: ${tx.hash} ...`);
        }
        receipt = await tx.wait();
      });

      if (functionName && receipt) {
        const gas = receipt.gasUsed;
        const price = toNumber(
          receipt.gasPrice ? gas * receipt.gasPrice : receipt.cumulativeGasUsed,
        );
        console.log(
          `TX: ${functionName} time: ${time.toFixed(1)} sec, gas: ${gas}, fee: ${price.toFixed(
            FRACTION_DIGITS,
          )}`,
        );
      }
      return receipt;
    },
    attempts,
    delay,
    contractFactory,
  );
}

export async function waitTxEx(
  promise: Promise<TransactionResponse>,
  options?: {
    onStarted?: (tx: TransactionResponse) => Promisable<void>;
    onSuccess?: (tx: TransactionResponse) => Promisable<void>;
    onFail?: (err: any) => Promisable<void>;
    skipWait?: boolean;
  },
): Promise<TransactionResponse | null> {
  let tx = null;
  try {
    tx = await promise;
    if (options?.onStarted) {
      await options.onStarted(tx);
    }
    if (options?.skipWait) {
      return tx;
    }
    await tx.wait();
    if (options?.onSuccess) {
      await options.onSuccess(tx);
    }
  } catch (err: any) {
    if (options?.onFail) {
      await options.onFail(err);
    }
    throw err;
  }
  return tx;
}

export async function postInformTx(
  promise: Promise<TransactionResponse>,
  receiver: PostReceiver,
  onFinish?: (tx: TransactionResponse) => Promisable<void>,
): Promise<TransactionResponse> {
  const tx = await promise;
  receiver.inform(tx);
  if (onFinish) {
    tx.wait()
      .then(() => onFinish(tx))
      .catch(() => onFinish(tx));
  }
  return tx;
}

export function txResponse(tx: TransactionResponse) {
  return {
    hash: tx.hash,
  };
}
