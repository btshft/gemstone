type Rented<T> = {
  $value: T;
  $lease: number;
};

export class RoundRobinPool<T> {
  constructor(private readonly data: T[]) {
    this.cursor = 0;
  }

  private get max(): number {
    return this.data.length - 1;
  }

  private cursor: number;
  private get next(): number {
    for (let i = this.cursor; i <= this.max; i++) {
      if (this.data[i]) {
        this.cursor = i === this.max ? 0 : this.cursor + 1;
        return i;
      }
    }

    for (let i = 0; i < this.cursor; i++) {
      if (this.data[i]) {
        this.cursor = i === this.max ? 0 : this.cursor + 1;
        return i;
      }
    }

    throw new Error('Nothing to rent');
  }

  rent(): Rented<T> {
    const index = this.next;
    const item = this.data[index];

    this.data[index] = undefined;

    return {
      $value: item,
      $lease: index,
    };
  }

  return(item: Rented<T>) {
    if (item && item.$value) {
      this.data[item.$lease] = item.$value;
    }
  }
}
