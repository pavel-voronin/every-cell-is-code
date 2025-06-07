// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (...args: any[]) => void;

export class EventBus {
  protected listeners: Record<string, EventHandler[]> = {};
  protected lastStates: Record<string, Parameters<EventHandler>> = {};

  on(event: string, handler: EventHandler) {
    (this.listeners[event] ||= []).push(handler);

    return {
      off: () => this.off(event, handler),
    };
  }

  sync(event: string, handler: EventHandler) {
    this.on(event, handler);

    if (event in this.lastStates) {
      handler(...this.lastStates[event]);
    }

    return {
      off: () => this.off(event, handler),
    };
  }

  off(event: string, handler: EventHandler) {
    this.listeners[event] = (this.listeners[event] || []).filter(
      (h) => h !== handler,
    );
  }

  emit(event: string, ...args: Parameters<EventHandler>) {
    this.lastStates[event] = args;
    (this.listeners[event] || []).forEach((handler) => handler(...args));
  }
}

export const eventBus = new EventBus();
