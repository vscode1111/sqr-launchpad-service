export async function sleep(ms: number): Promise<number> {
  return new Promise((resolve) => setTimeout(resolve as any, ms));
}

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

export async function attempt(fn: () => Promise<any>, attempts = 3, delayMs = 1000): Promise<any> {
  try {
    return await fn();
  } catch (e) {
    if (attempts > 0) {
      console.log(e);
      await sleep(delayMs);
      // console.log(`${attempts - 1} attempts left`);
      return await attempt(fn, attempts - 1, delayMs);
    } else {
      throw e;
    }
  }
}
