import { eventBus } from '../../communications/eventBus';
import { EVENT_RETENTION_TIMEOUT } from '../../constants';
import { IEventsInputComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class EventsInput
  extends BaseComponent
  implements IEventsInputComponent
{
  protected eventIdCounter: number = 0;
  protected rememberedEvents = new Map<
    number,
    { type: string; event: Event; timestamp: number }
  >();

  constructor(readonly block: Block) {
    super(block);

    const { off: offReEmit } = eventBus.on(
      `block:${this.block.xy.join(',')}:re-emit`,
      (eventId: number) => {
        this.reEmitEvent(eventId);
      },
    );
    this.onUnload(offReEmit);

    const { off: offWorkerError } = eventBus.on(
      `block:${this.block.xy.join(',')}:worker-error`,
      () => {
        this.block.setStatus('runtime', 'terminated');
      },
    );
    this.onUnload(offWorkerError);

    const { off: offWorkerMessageError } = eventBus.on(
      `block:${this.block.xy.join(',')}:worker-messageerror`,
      () => {
        this.block.setStatus('runtime', 'terminated');
      },
    );
    this.onUnload(offWorkerMessageError);

    this.initializeCanvasEventListener();
    this.cleanupOldEvents();
    this.onUnload(() => this.rememberedEvents.clear());
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

  get eventId() {
    return this.eventIdCounter++;
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

  get config() {
    return this.block.config.input.events;
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

    if (this.config.pointerdown) {
      pointerDown = (e: PointerEvent) => {
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const pointerId = e.pointerId;
        const eventId = this.eventId;
        this.rememberEvent('pointerdown', eventId, e);
        eventBus.emit(`block:${this.block.xy.join(',')}:message`, {
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
    if (this.config.wheel) {
      wheel = (e: WheelEvent) => {
        e.preventDefault();
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const deltaX = e.deltaX;
        const deltaY = e.deltaY;
        const eventId = this.eventId;
        this.rememberEvent('wheel', eventId, e);
        eventBus.emit(`block:${this.block.xy.join(',')}:message`, {
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
    if (this.config.pointerup) {
      pointerUp = (e: PointerEvent) => {
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const pointerId = e.pointerId;
        const eventId = this.eventId;
        this.rememberEvent('pointerup', eventId, e);
        eventBus.emit(`block:${this.block.xy.join(',')}:message`, {
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
    if (this.config.pointermove) {
      pointerMove = (e: PointerEvent) => {
        const x = e.offsetX / this.block.container.scale;
        const y = e.offsetY / this.block.container.scale;
        const pointerId = e.pointerId;
        const eventId = this.eventId;
        this.rememberEvent('pointermove', eventId, e);
        eventBus.emit(`block:${this.block.xy.join(',')}:message`, {
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

    if (this.config.keydown) {
      const keyDown = (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.eventId;
        this.rememberEvent('keydown', eventId, e);
        eventBus.emit(`block:${this.block.xy.join(',')}:message`, {
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

    if (this.config.keyup) {
      const keyUp = (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.eventId;
        this.rememberEvent('keyup', eventId, e);
        eventBus.emit(`block:${this.block.xy.join(',')}:message`, {
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
}
