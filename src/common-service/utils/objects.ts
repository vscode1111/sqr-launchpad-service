export function objectFactory<K extends string, T>(array: K[], fn: (key: K) => T) {
  let result: Record<K, T> = {} as any;

  for (const item of array) {
    result[item] = fn(item as K);
  }

  return result;
}
