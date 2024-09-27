import Bluebird from 'bluebird';
import { Promisable } from './types';

export async function runConcurrently(
  fn: (taskIndex: number) => Promisable<void>,
  taskCount: number,
  concurrencyCount = 10,
  printStep = 10,
) {
  const tasks = Array(taskCount)
    .fill(null)
    .map((_, i) => i);

  const t0 = new Date().getTime();

  let c0 = new Date().getTime();

  let errCount = 0;

  await Bluebird.map(
    tasks,
    async (taskIndex) => {
      try {
        await fn(taskIndex);
      } catch (err) {
        errCount++;
        // console.error(`Error in task #${taskIndex}`, err);
        // throw err;
      }

      if (taskIndex % printStep === 0) {
        const diff = (new Date().getTime() - c0) / 1000;
        const rps = printStep / diff;
        console.log(
          `current task: ${taskIndex} in ${diff.toFixed(2)} s, rps: ${rps.toFixed(2)}, errors: ${errCount}`,
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
    )} s, rps: ${rps.toFixed(2)}, errors: ${errCount}`,
  );
}
