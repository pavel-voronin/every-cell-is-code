import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../app/communications/eventBus';

describe('EventBus', () => {
  it('calls handler when event is emitted', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test', handler);
    bus.emit('test', 1, 2);
    expect(handler).toHaveBeenCalledWith(1, 2);
  });

  it('does not call handler after it is removed with off', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('test', handler);
    bus.off('test', handler);
    bus.emit('test', 1);
    expect(handler).not.toHaveBeenCalled();
  });

  it('sync immediately calls handler if event was already emitted', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.emit('test-sync', 42, 'foo');
    bus.sync('test-sync', handler);
    expect(handler).toHaveBeenCalledWith(42, 'foo');
  });

  it('sync calls handler with last emitted arguments', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.emit('test', 'a');
    bus.sync('test', handler);
    expect(handler).toHaveBeenCalledWith('a');
  });

  it('off does not throw if handler was never added', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    // off called before any handler was added
    expect(() => bus.off('never-added', handler)).not.toThrow();
    // emit should not call handler
    bus.emit('never-added', 123);
    expect(handler).not.toHaveBeenCalled();
  });

  it('on returns an object with an off method that removes the handler', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const subscription = bus.on('event', handler);
    bus.emit('event', 1);
    expect(handler).toHaveBeenCalledWith(1);

    handler.mockClear();
    subscription.off();
    bus.emit('event', 2);
    expect(handler).not.toHaveBeenCalled();
  });

  it('on allows multiple handlers for the same event', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('multi', handler1);
    bus.on('multi', handler2);
    bus.emit('multi', 'x');
    expect(handler1).toHaveBeenCalledWith('x');
    expect(handler2).toHaveBeenCalledWith('x');
  });

  it('on adds handler to listeners and handler is called with correct arguments', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('args', handler);
    bus.emit('args', 1, 2, 3);
    expect(handler).toHaveBeenCalledWith(1, 2, 3);
  });
});
