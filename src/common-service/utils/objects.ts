export function objectFactory<K, T>(array: K[], fn: (key: K) => T, keyFn?: (key: K) => string) {
  let result: Record<string, T> = {} as any;

  for (const item of array) {
    const key = keyFn ? keyFn(item) : (item as string);
    result[key] = fn(item);
  }

  return result;
}
