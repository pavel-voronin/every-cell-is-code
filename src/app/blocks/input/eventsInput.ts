import { eventBus } from '../../communications/eventBus';
import { EVENT_RETENTION_TIMEOUT } from '../../constants';
import { EventsInputComponent } from '../../types/blockComponents';
import { WorkerBackend } from '../backend/workerBackend';
import { Block } from '../block';

export class EventsInput implements EventsInputComponent {
  protected unloadHandlers: (() => void)[] = [];

  protected counter: number = 0;
  protected rememberedEvents = new Map<
    number,
    { type: string; event: Event; timestamp: number }
  >();

  constructor(readonly block: Block) {
    this.initializeCanvasEventListener();
    this.cleanupOldEvents();
  }

  // Periodically clean up old remembered events
  protected cleanupOldEvents() {
    const cleanupOldEventsInterval = setInterval(() => {
      const now = Date.now();
      for (const [eventId, { timestamp }] of this.rememberedEvents.entries()) {
        if (now - timestamp > EVENT_RETENTION_TIMEOUT) {
          this.rememberedEvents.delete(eventId);
        }
      }
    }, EVENT_RETENTION_TIMEOUT);

    this.onUnload(() => {
      clearInterval(cleanupOldEventsInterval);
    });
  }

  nextEventId() {
    return this.counter++;
  }

  protected rememberEvent(type: string, eventId: number, e: Event) {
    this.rememberedEvents.set(eventId, {
      type,
      event: e,
      timestamp: Date.now(),
    });
  }

  reEmitEvent(eventId: number) {
    const rememberedEvent = this.rememberedEvents.get(eventId)?.event;

    if (rememberedEvent) {
      eventBus.emit(rememberedEvent.type, rememberedEvent);
      this.rememberedEvents.delete(eventId);
    }
  }

  protected initializeCanvasEventListener() {
    // pointerenter

    const pointerEnter = () => {
      this.block.container.container.focus();
    };
    this.block.container.container.addEventListener(
      'pointerenter',
      pointerEnter,
    );
    this.onUnload(() => {
      this.block.container.container.removeEventListener(
        'pointerenter',
        pointerEnter,
      );
    });

    // pointerdown

    let pointerDown: (e: PointerEvent) => void;

    if (this.block.config.input.events.pointerdown) {
      pointerDown = (e: PointerEvent) => {
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerdown', eventId, e);
        (this.block.backend as WorkerBackend).worker.postMessage({
          type: 'pointerdown',
          payload: { x, y, pointerId, eventId },
        });
      };
    } else {
      pointerDown = (e: PointerEvent) => {
        eventBus.emit('pointerdown', new PointerEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener('pointerdown', pointerDown);
    this.onUnload(() => {
      this.block.container.container.removeEventListener(
        'pointerdown',
        pointerDown,
      );
    });

    // wheel

    let wheel: (e: WheelEvent) => void;
    if (this.block.config.input.events.wheel) {
      wheel = (e: WheelEvent) => {
        e.preventDefault();
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const deltaX = e.deltaX;
        const deltaY = e.deltaY;
        const eventId = this.nextEventId();
        this.rememberEvent('wheel', eventId, e);
        (this.block.backend as WorkerBackend).worker.postMessage({
          type: 'wheel',
          payload: { x, y, deltaX, deltaY, eventId },
        });
      };
    } else {
      wheel = (e: WheelEvent) => {
        eventBus.emit('wheel', new WheelEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener('wheel', wheel);
    this.onUnload(() => {
      this.block.container.container.removeEventListener('wheel', wheel);
    });

    // pointerup

    let pointerUp: (e: PointerEvent) => void;
    if (this.block.config.input.events.pointerup) {
      pointerUp = (e: PointerEvent) => {
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerup', eventId, e);
        (this.block.backend as WorkerBackend).worker.postMessage({
          type: 'pointerup',
          payload: { x, y, pointerId, eventId },
        });
      };
    } else {
      pointerUp = (e: PointerEvent) => {
        eventBus.emit('pointerup', new PointerEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener('pointerup', pointerUp);
    this.onUnload(() => {
      this.block.container.container.removeEventListener(
        'pointerup',
        pointerUp,
      );
    });

    // pointermove

    let pointerMove: (e: PointerEvent) => void;
    if (this.block.config.input.events.pointermove) {
      pointerMove = (e: PointerEvent) => {
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointermove', eventId, e);
        (this.block.backend as WorkerBackend).worker.postMessage({
          type: 'pointermove',
          payload: { x, y, pointerId, eventId },
        });
      };
    } else {
      pointerMove = (e: PointerEvent) => {
        eventBus.emit('pointermove', new PointerEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener('pointermove', pointerMove);
    this.onUnload(() => {
      this.block.container.container.removeEventListener(
        'pointermove',
        pointerMove,
      );
    });

    // keydown

    if (this.block.config.input.events.keydown) {
      const keyDown = (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keydown', eventId, e);
        (this.block.backend as WorkerBackend).worker.postMessage({
          type: 'keydown',
          payload: { code, eventId },
        });
      };
      this.block.container.container.addEventListener('keydown', keyDown);
      this.onUnload(() => {
        this.block.container.container.removeEventListener('keydown', keyDown);
      });
    }

    // keyup

    if (this.block.config.input.events.keyup) {
      const keyUp = (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keyup', eventId, e);
        (this.block.backend as WorkerBackend).worker.postMessage({
          type: 'keyup',
          payload: { code, eventId },
        });
      };
      this.block.container.container.addEventListener('keyup', keyUp);
      this.onUnload(() => {
        this.block.container.container.removeEventListener('keyup', keyUp);
      });
    }
  }

  protected onUnload(handler: () => void) {
    this.unloadHandlers.push(handler);
  }

  unload() {
    this.unloadHandlers.forEach((handler) => handler());

    this.rememberedEvents.clear();
  }
}
