import { StringNumber } from '~common';

export class PendingCalculator {
  private pendingSet: Set<StringNumber>;

  constructor() {
    this.pendingSet = new Set();
  }

  async call(taskId: StringNumber, fn: (pendingCount: number) => Promise<void>) {
    this.pendingSet.add(taskId);
    try {
      await fn(this.pendingSet.size);
      this.pendingSet.delete(taskId);
    } catch (err) {
      this.pendingSet.delete(taskId);
      throw err;
    }
  }

  count() {
    return this.pendingSet.size;
  }
}
