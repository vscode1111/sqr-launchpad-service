import Bluebird from 'bluebird';
import { Overrides } from 'ethers';
import { Promisable } from '../common';

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

  let errors = 0;

  await Bluebird.map(
    tasks,
    async (task) => {
      try {
        await fn(task);
      } catch (err) {
        errors++;
        console.error(err);
      }

      if (task % printStep === 0) {
        const diff = (new Date().getTime() - c0) / 1000;
        const rps = printStep / diff;
        console.log(
          `current task: ${task} in ${diff.toFixed(2)} s, errors: ${errors}, rps: ${rps.toFixed(2)}`,
        );
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
    )} s, errors: ${errors} rps: ${rps.toFixed(2)}`,
  );
}

export const txOverrides: Overrides = {
  // gasPrice: 1_500_000_000n,
  gasPrice: 1_000_000_000n,
  gasLimit: 200_000,
};
