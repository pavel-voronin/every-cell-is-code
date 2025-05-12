import { describe, it, expect, beforeEach } from 'vitest';
import { TupleSet } from '../app/structures/tuppleSet';

describe('TupleSet', () => {
  let set: TupleSet;

  beforeEach(() => {
    set = new TupleSet();
  });

  it('should add and check existence of a tuple', () => {
    expect(set.has([1, 2])).toBe(false);
    set.add([1, 2]);
    expect(set.has([1, 2])).toBe(true);
  });

  it('should not add duplicate tuples', () => {
    set.add([1, 2]);
    set.add([1, 2]);
    expect(set.size).toBe(1);
  });

  it('should delete a tuple', () => {
    set.add([3, 4]);
    expect(set.has([3, 4])).toBe(true);
    expect(set.delete([3, 4])).toBe(true);
    expect(set.has([3, 4])).toBe(false);
    expect(set.delete([3, 4])).toBe(false);
  });

  it('should clear all tuples', () => {
    set.add([1, 2]).add([3, 4]);
    expect(set.size).toBe(2);
    set.clear();
    expect(set.size).toBe(0);
    expect(set.has([1, 2])).toBe(false);
  });

  it('should return correct size', () => {
    expect(set.size).toBe(0);
    set.add([1, 2]);
    expect(set.size).toBe(1);
    set.add([3, 4]);
    expect(set.size).toBe(2);
    set.delete([1, 2]);
    expect(set.size).toBe(1);
  });

  it('should iterate over all tuples', () => {
    set.add([1, 2]).add([3, 4]);
    const tuples = Array.from(set.values());
    expect(tuples).toContainEqual([1, 2]);
    expect(tuples).toContainEqual([3, 4]);
    expect(tuples.length).toBe(2);
  });

  it('should support for...of iteration', () => {
    set.add([5, 6]).add([7, 8]);
    const result: [number, number][] = [];
    for (const tuple of set) {
      result.push(tuple);
    }
    expect(result).toContainEqual([5, 6]);
    expect(result).toContainEqual([7, 8]);
    expect(result.length).toBe(2);
  });

  it('should handle negative and zero values', () => {
    set.add([0, 0]).add([-1, -2]);
    expect(set.has([0, 0])).toBe(true);
    expect(set.has([-1, -2])).toBe(true);
    expect(set.size).toBe(2);
  });

  it('should initialize from an iterable of tuples', () => {
    const tuples: [number, number][] = [
      [1, 2],
      [3, 4],
      [5, 6],
    ];
    const setFromIterable = new TupleSet(tuples);
    expect(setFromIterable.size).toBe(3);
    for (const tuple of tuples) {
      expect(setFromIterable.has(tuple)).toBe(true);
    }
    // Should not contain a tuple not in the iterable
    expect(setFromIterable.has([7, 8])).toBe(false);
  });
});
