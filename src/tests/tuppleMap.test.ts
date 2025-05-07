import { describe, it, expect, beforeEach } from 'vitest';
import { TupleMap } from '../app/structures/tuppleMap';

describe('TupleMap', () => {
  let map: TupleMap<string>;

  beforeEach(() => {
    map = new TupleMap<string>();
  });

  it('should set and get values by tuple key', () => {
    map.set([1, 2], 'a');
    expect(map.get([1, 2])).toBe('a');
    expect(map.get([2, 1])).toBeUndefined();
  });

  it('should check existence with has()', () => {
    map.set([3, 4], 'b');
    expect(map.has([3, 4])).toBe(true);
    expect(map.has([4, 3])).toBe(false);
  });

  it('should delete values by tuple key', () => {
    map.set([5, 6], 'c');
    expect(map.delete([5, 6])).toBe(true);
    expect(map.has([5, 6])).toBe(false);
    expect(map.delete([5, 6])).toBe(false);
  });

  it('should clear all entries', () => {
    map.set([1, 1], 'x');
    map.set([2, 2], 'y');
    map.clear();
    expect(map.size).toBe(0);
    expect(map.get([1, 1])).toBeUndefined();
  });

  it('should return correct size', () => {
    expect(map.size).toBe(0);
    map.set([1, 2], 'a');
    map.set([2, 3], 'b');
    expect(map.size).toBe(2);
    map.delete([1, 2]);
    expect(map.size).toBe(1);
  });

  it('should iterate keys()', () => {
    map.set([1, 2], 'a');
    map.set([3, 4], 'b');
    const keys = Array.from(map.keys());
    expect(keys).toContainEqual([1, 2]);
    expect(keys).toContainEqual([3, 4]);
    expect(keys.length).toBe(2);
  });

  it('should iterate values()', () => {
    map.set([1, 2], 'a');
    map.set([3, 4], 'b');
    const values = Array.from(map.values());
    expect(values).toContain('a');
    expect(values).toContain('b');
    expect(values.length).toBe(2);
  });

  it('should iterate entries()', () => {
    map.set([1, 2], 'a');
    map.set([3, 4], 'b');
    const entries = Array.from(map.entries());
    expect(entries).toContainEqual([[1, 2], 'a']);
    expect(entries).toContainEqual([[3, 4], 'b']);
    expect(entries.length).toBe(2);
  });

  it('should forEach over all entries', () => {
    map.set([1, 2], 'a');
    map.set([3, 4], 'b');
    const result: Array<[[number, number], string]> = [];
    map.forEach((value, key) => {
      result.push([key, value]);
    });
    expect(result).toContainEqual([[1, 2], 'a']);
    expect(result).toContainEqual([[3, 4], 'b']);
    expect(result.length).toBe(2);
  });

  it('should support iteration with Symbol.iterator', () => {
    map.set([1, 2], 'a');
    map.set([3, 4], 'b');
    const entries = Array.from(map);
    expect(entries).toContainEqual([[1, 2], 'a']);
    expect(entries).toContainEqual([[3, 4], 'b']);
    expect(entries.length).toBe(2);
  });

  it('should allow chaining set()', () => {
    map.set([1, 2], 'a').set([3, 4], 'b');
    expect(map.size).toBe(2);
    expect(map.get([3, 4])).toBe('b');
  });

  it('should handle negative and zero tuple values', () => {
    map.set([0, 0], 'zero');
    map.set([-1, -2], 'neg');
    expect(map.get([0, 0])).toBe('zero');
    expect(map.get([-1, -2])).toBe('neg');
  });
});
