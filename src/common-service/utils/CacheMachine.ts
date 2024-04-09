import { Promisable } from '~common';

export class CacheMachine {
  private map = new Map<string, any>();

  public async call(
    keyFn: () => Promisable<string>,
    callbackFn: () => Promisable<any>,
    timeOut?: number,
  ): Promise<any> {
    const key = await keyFn();
    if (this.map.has(key)) {
      return this.map.get(key);
    }

    const result = await callbackFn();
    this.map.set(key, result);

    if (timeOut) {
      setTimeout(() => {
        if (!this.map.has(key)) {
          return;
        }

        this.map.delete(key);
        // console.log(`${formatDate(new Date())} Deleted from cache ${key} key`);
      }, timeOut);
    }

    return result;
  }

  public getCacheSize() {
    this.map.size;
  }
}
