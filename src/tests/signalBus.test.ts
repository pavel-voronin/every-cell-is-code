import { describe, it, beforeEach, vi, expect } from 'vitest';
import { SignalBus } from '../app/communications/signalBus';
import { eventBus } from '../app/communications/eventBus';

describe('SignalBus', () => {
  let bus: SignalBus;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    bus = new SignalBus();
    emitSpy = vi.spyOn(eventBus, 'emit');
    emitSpy.mockClear();
  });

  it('emits signal to subscriber after subscribe', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, {});
    bus.send([0, 0], {}, 'payload');
    expect(emitSpy).toHaveBeenCalledWith('block:1,2:signal', [0, 0], 'payload');
  });

  it('does not emit signal after unsubscribe', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, {});
    bus.unsubscribe(subscriber);
    bus.send([0, 0], {}, 'payload');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits only if topic matches', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { topic: 'foo' });
    bus.send([0, 0], { topic: 'foo' }, 'payload');
    expect(emitSpy).toHaveBeenCalledWith('block:1,2:signal', [0, 0], 'payload');
    emitSpy.mockClear();
    bus.send([0, 0], { topic: 'bar' }, 'payload');
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('supports multiple topic subscriptions for one subscriber', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { topic: 'foo' });
    bus.subscribe(subscriber, { topic: 'bar' });
    bus.send([0, 0], { topic: 'foo' }, 'payload');
    bus.send([0, 0], { topic: 'bar' }, 'payload2');
    expect(emitSpy).toHaveBeenCalledWith('block:1,2:signal', [0, 0], 'payload');
    expect(emitSpy).toHaveBeenCalledWith(
      'block:1,2:signal',
      [0, 0],
      'payload2',
    );
  });

  it('emits only if within radius (sum of radii >= distance)', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { to: [5, 5], radius: 2 });
    bus.send([0, 0], { to: [6, 6], radius: 2 }, 'payload'); // dist=2, sum=4
    expect(emitSpy).toHaveBeenCalledWith('block:1,2:signal', [0, 0], 'payload');
    emitSpy.mockClear();
    bus.send([0, 0], { to: [10, 10], radius: 1 }, 'payload'); // dist=10, sum=3
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit if sum of radii < distance', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { to: [0, 0], radius: 1 });
    bus.send([0, 0], { to: [3, 0], radius: 1 }, 'payload'); // dist=3, sum=2
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('defaults radius to 0 if not provided', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { to: [5, 5] });
    bus.send([0, 0], { to: [5, 5] }, 'payload'); // dist=0, sum=0
    expect(emitSpy).toHaveBeenCalledWith('block:1,2:signal', [0, 0], 'payload');
    emitSpy.mockClear();
    bus.send([0, 0], { to: [7, 5] }, 'payload'); // dist=2, sum=0
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits if sum of radii equals distance', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { to: [0, 0], radius: 2 });
    bus.send([0, 0], { to: [4, 0], radius: 2 }, 'payload'); // dist=4, sum=4
    expect(emitSpy).toHaveBeenCalledWith('block:1,2:signal', [0, 0], 'payload');
  });

  it('does not emit if both radii are zero and distance > 0', () => {
    const subscriber: [number, number] = [1, 2];
    bus.subscribe(subscriber, { to: [0, 0] });
    bus.send([0, 0], { to: [1, 0] }, 'payload'); // dist=1, sum=0
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
