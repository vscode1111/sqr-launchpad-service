export function parseError(error: any) {
  if (!error) {
    return;
  }

  if (typeof error === 'string') {
    return error;
  }

  if ('reason' in error) {
    return error.reason;
  }

  if ('message' in error) {
    return error.message;
  }

  return error;
}

export function parseStack(error: any) {
  if (!error) {
    return;
  }

  if (typeof error === 'object' && 'stack' in error) {
    return error.stack;
  }
}

// https://github.com/astra-net/astra-scan.backend/blob/8f9618d8d4df0976b5544b75ed5636b2ef949acd/src/indexer/rpc/transport/ws/WebSocketRPC.ts
export function timeoutPromise(callTimeout: number) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout error in ${callTimeout}ms`)), callTimeout),
  );
}

export function incrementChangeHexChar(char: string): string {
  return (Number(`0x${char}`) + 1).toString(16).slice(-1);
}

export function toUnixTime(value: string | Date = new Date()): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export function toUnixTimeUtc(value: string | Date = new Date()): number {
  const date = new Date(value);
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 1000);
}

export function numberToByteArray(value: number, bytesNumber = 4): number[] {
  const byteArray = new Array(bytesNumber).fill(0);

  for (let index = byteArray.length - 1; index >= 0; index--) {
    const byte = value & 0xff;
    byteArray[index] = byte;
    value = (value - byte) / 256;
  }

  return byteArray;
}

export function byteArrayToNumber(byteArray: number[]): number {
  let value = 0;
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }

  return value;
}

export function printJson(value: any) {
  return JSON.stringify(value, null, 2);
}

export async function sleep(ms: number): Promise<number> {
  return new Promise((resolve) => setTimeout(resolve as any, ms));
}

export async function attempt(fn: () => Promise<any>, attempts = 3, delayMs = 1000): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    if (attempts > 0) {
      console.log(err);
      await sleep(delayMs);
      // console.log(`${attempts - 1} attempts left`);
      return await attempt(fn, attempts - 1, delayMs);
    } else {
      throw err;
    }
  }
}
