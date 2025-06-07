import { describe, it, beforeEach, vi, expect } from 'vitest';

// Mock eventBus.emit BEFORE importing the module that uses it
vi.mock('../app/communications/eventBus', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}));

import { SignalBus } from '../app/communications/signalBus';
import { eventBus } from '../app/communications/eventBus';
import { XY } from '../app/types/base';

const mockEmit = eventBus.emit as unknown as ReturnType<typeof vi.fn>;

describe('SignalBus.send', () => {
  let bus: SignalBus;
  const A: XY = [0, 0];
  const B: XY = [1, 1];
  const C: XY = [5, 5];

  beforeEach(() => {
    bus = new SignalBus();
    mockEmit.mockClear();
  });

  it('should emit to subscriber if topic matches', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.send(B, { topic: 'foo' }, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, B, 'payload');
  });

  it('should not emit if topic does not match', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.send(B, { topic: 'bar' }, 'payload');
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should emit if both topic are undefined', () => {
    bus.subscribe(A, {});
    bus.send(B, {}, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, B, 'payload');
  });

  it('should emit if within radius', () => {
    bus.subscribe(A, { to: [0, 0], radius: 2 });
    bus.send(B, { to: [1, 1] }, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, B, 'payload');
  });

  it('should not emit if outside radius', () => {
    bus.subscribe(A, { to: [0, 0], radius: 1 });
    bus.send(B, { to: [3, 3] }, 'payload');
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should use both radii for distance check', () => {
    bus.subscribe(A, { to: [0, 0], radius: 1 });
    bus.send(B, { to: [2, 0], radius: 1 }, 'payload'); // dist = 2, sum radius = 2
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, B, 'payload');
  });

  it('should not emit if sum of radii is less than distance', () => {
    bus.subscribe(A, { to: [0, 0], radius: 1 });
    bus.send(B, { to: [3, 0], radius: 1 }, 'payload'); // dist = 3, sum radius = 2
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should emit for multiple subscribers if they match', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.subscribe(B, { topic: 'foo' });
    bus.send(C, { topic: 'foo' }, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, C, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', B, C, 'payload');
    expect(mockEmit).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple subscriptions per subscriber', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.subscribe(A, { topic: 'bar' });
    bus.send(B, { topic: 'bar' }, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, B, 'payload');
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  it('should remove subscriber after unsubscribe', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.unsubscribe(A);
    bus.send(B, { topic: 'foo' }, 'payload');
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should not throw if unsubscribing a non-existent subscriber', () => {
    expect(() => bus.unsubscribe(A)).not.toThrow();
  });

  it('should only remove the specified subscriber', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.subscribe(B, { topic: 'foo' });
    bus.unsubscribe(A);
    bus.send(C, { topic: 'foo' }, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', B, C, 'payload');
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  it('should allow resubscription after unsubscribe', () => {
    bus.subscribe(A, { topic: 'foo' });
    bus.unsubscribe(A);
    bus.subscribe(A, { topic: 'foo' });
    bus.send(B, { topic: 'foo' }, 'payload');
    expect(mockEmit).toHaveBeenCalledWith('block:signal', A, B, 'payload');
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });
});
