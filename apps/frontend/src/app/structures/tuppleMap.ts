export class TupleMap<V> {
  private map = new Map<string, V>();

  private static tupleToKey(tuple: [number, number]): string {
    return `${tuple[0]},${tuple[1]}`;
  }

  set(tuple: [number, number], value: V): this {
    this.map.set(TupleMap.tupleToKey(tuple), value);
    return this;
  }

  get(tuple: [number, number]): V | undefined {
    return this.map.get(TupleMap.tupleToKey(tuple));
  }

  has(tuple: [number, number]): boolean {
    return this.map.has(TupleMap.tupleToKey(tuple));
  }

  delete(tuple: [number, number]): boolean {
    return this.map.delete(TupleMap.tupleToKey(tuple));
  }

  clear(): void {
    this.map.clear();
  }

  get size(): number {
    return this.map.size;
  }

  *keys(): IterableIterator<[number, number]> {
    for (const key of this.map.keys()) {
      const [x, y] = key.split(',').map(Number);
      yield [x, y];
    }
  }

  *values(): IterableIterator<V> {
    yield* this.map.values();
  }

  *entries(): IterableIterator<[[number, number], V]> {
    for (const [key, value] of this.map.entries()) {
      const [x, y] = key.split(',').map(Number);
      yield [[x, y], value];
    }
  }

  forEach(
    callback: (value: V, key: [number, number], map: this) => void,
    thisArg?: unknown,
  ): void {
    for (const [key, value] of this.map.entries()) {
      const [x, y] = key.split(',').map(Number);
      callback.call(thisArg, value, [x, y], this);
    }
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}
