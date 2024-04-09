import { History } from './History';

export type AnalyzeResponseStatus = 'preparing' | 'success' | 'error';

export interface BlockNumberFilterResponse {
  status: AnalyzeResponseStatus;
  value: number;
}

export class BlockNumberFilter {
  private history: History<number>;
  private status: AnalyzeResponseStatus;
  private diffs: number[];

  constructor(
    private filterSize = 5,
    private valueMaxDiff = 1000,
  ) {
    this.history = new History<number>(this.filterSize);
    this.status = 'preparing';
    this.diffs = [];
  }

  analyze(value: number): BlockNumberFilterResponse {
    if (this.filterSize <= 1) {
      this.status = 'success';

      return {
        status: this.status,
        value,
      };
    }

    const last = this.history.getLast();

    if (
      isNaN(value) ||
      (this.status === 'success' && !(last < value && value < last + this.valueMaxDiff))
    ) {
      this.status = 'error';

      return {
        status: this.status,
        value,
      };
    }

    this.history.add(value);

    this.diffs = [];

    this.status = 'success';

    const list = this.history.getList();

    for (let i = 1; i < list.length; i++) {
      const diff = list[i] - list[i - 1];
      this.diffs.push(diff);
      if (diff < 0 || diff > this.valueMaxDiff) {
        this.status = 'preparing';
      }
    }

    if (this.diffs.length < this.filterSize - 1) {
      this.status = 'preparing';
    }

    return {
      status: this.status,
      value,
    };
  }

  getStatus() {
    return this.status;
  }

  getHistory() {
    return this.history.getList();
  }

  getDiffs() {
    return this.diffs;
  }
}
