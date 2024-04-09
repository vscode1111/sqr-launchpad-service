export class History<T> {
  private list: T[];

  constructor(private size: number) {
    this.list = [];
  }

  add(value: T) {
    this.list.push(value);
    if (this.list.length > this.size) {
      this.list.shift();
    }
  }

  getList(): T[] {
    return this.list;
  }

  getLast() {
    return this.list[this.list.length - 1];
  }
}
