import { sleep } from '~common';

interface RetryParams<T> {
  fn: (attempt: number) => Promise<T>;
  maxAttempts?: number;
  smartDelay?: boolean;
  printError?: boolean;
}

export async function retry<T>({
  fn,
  maxAttempts = 3,
  smartDelay = true,
  printError,
}: RetryParams<T>) {
  async function execute(attempt: number) {
    try {
      return await fn(attempt);
    } catch (err) {
      if (printError) {
        console.error(`Retry error`, err);
      }

      if (attempt <= maxAttempts) {
        const nextAttempt = attempt + 1;
        if (smartDelay) {
          const delayInSeconds = Math.max(
            Math.min(Math.pow(2, nextAttempt) + randomInteger(-nextAttempt, nextAttempt), 600),
            1,
          );

          if (printError) {
            console.log(`Retry delay: ${delayInSeconds} s`);
          }

          await sleep(delayInSeconds * 1000);
        }

        if (printError) {
          console.log(`Retry attempt #${nextAttempt}`);
        }
        return execute(nextAttempt);
      } else {
        throw err;
      }
    }
  }

  return execute(1);
}

export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
