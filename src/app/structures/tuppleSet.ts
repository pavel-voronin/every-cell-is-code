export class TupleSet {
  private set = new Set<string>();

  private static tupleToKey(tuple: [number, number]): string {
    return `${tuple[0]},${tuple[1]}`;
  }

  add(tuple: [number, number]): this {
    this.set.add(TupleSet.tupleToKey(tuple));
    return this;
  }

  has(tuple: [number, number]): boolean {
    return this.set.has(TupleSet.tupleToKey(tuple));
  }

  delete(tuple: [number, number]): boolean {
    return this.set.delete(TupleSet.tupleToKey(tuple));
  }

  clear(): void {
    this.set.clear();
  }

  get size(): number {
    return this.set.size;
  }

  *values(): IterableIterator<[number, number]> {
    for (const key of this.set.values()) {
      const [x, y] = key.split(',').map(Number);
      yield [x, y];
    }
  }

  [Symbol.iterator]() {
    return this.values();
  }
}
