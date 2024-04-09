import { Promisable } from '~common';

const triggers: Set<string> = new Set<string>();

export async function trigger(
  key: string,
  checker: () => Promisable<boolean>,
  executor: () => Promisable<any>,
) {
  const result = await checker();
  if (result) {
    if (!triggers.has(key)) {
      await executor();
      triggers.add(key);
    }
  } else {
    if (triggers.has(key)) {
      triggers.delete(key);
    }
  }
}
