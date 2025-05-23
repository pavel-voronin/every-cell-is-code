import { eventBus } from '../communications/eventBus';
import { EVENT_RETENTION_TIMEOUT } from '../constants';
import { XY } from '../types/base';
import { InputComponent } from '../types/blockComponents';
import { WorkerBackend } from './backend/workerBackend';
import { Block } from './block';

export class Input implements InputComponent {
  protected counter: number = 0;
  protected rememberedEvents = new Map<
    number,
    { type: string; event: Event; timestamp: number }
  >();
  protected cleanupOldEventsInterval?: ReturnType<typeof setInterval>;

  protected pointerEnter?: () => void;
  protected wheel?: (e: WheelEvent) => void;
  protected pointerDown?: (e: PointerEvent) => void;
  protected pointerUp?: (e: PointerEvent) => void;
  protected pointerMove?: (e: PointerEvent) => void;
  protected keyDown?: (e: KeyboardEvent) => void;
  protected keyUp?: (e: KeyboardEvent) => void;

  constructor(readonly block: Block) {
    this.initializeCanvasEventListener();
    this.cleanupOldEvents();
    eventBus.on(
      `block:${this.block.x},${this.block.y}:message`,
      this.receiveMessage,
    );
  }

  receiveMessage = (from: XY, payload: unknown) => {
    (this.block.backend as WorkerBackend).worker.postMessage({
      type: 'message',
      from,
      payload,
    });
  };

  // Periodically clean up old remembered events
  protected cleanupOldEvents() {
    this.cleanupOldEventsInterval = setInterval(() => {
      const now = Date.now();
      for (const [eventId, { timestamp }] of this.rememberedEvents.entries()) {
        if (now - timestamp > EVENT_RETENTION_TIMEOUT) {
          this.rememberedEvents.delete(eventId);
        }
      }
    }, EVENT_RETENTION_TIMEOUT);
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
    this.pointerEnter = () => {
      this.block.container.container.focus();
    };
    this.block.container.container.addEventListener(
      'pointerenter',
      this.pointerEnter,
    );

    if (this.block.config.input.events.wheel) {
      this.wheel = (e: WheelEvent) => {
        e.preventDefault();
        // const x = e.offsetX / this.block.container.scale;
        // const y = e.offsetY / this.block.container.scale;
        // const deltaX = e.deltaX;
        // const deltaY = e.deltaY;
        const eventId = this.nextEventId();
        this.rememberEvent('wheel', eventId, e);
        // this.postMessage({
        //   type: 'wheel',
        //   payload: { x, y, deltaX, deltaY, eventId },
        // });
      };
    } else {
      this.wheel = (e: WheelEvent) => {
        eventBus.emit('wheel', new WheelEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener('wheel', this.wheel);

    if (this.block.config.input.events.pointerdown) {
      this.pointerDown = (e: PointerEvent) => {
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
      this.pointerDown = (e: PointerEvent) => {
        eventBus.emit('pointerdown', new PointerEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener(
      'pointerdown',
      this.pointerDown,
    );

    if (this.block.config.input.events.pointerup) {
      this.pointerUp = (e: PointerEvent) => {
        // const x = e.offsetX / this.block.container.scale;
        // const y = e.offsetY / this.block.container.scale;
        // const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerup', eventId, e);
        // this.postMessage({
        //   type: 'pointerup',
        //   payload: { x, y, pointerId, eventId },
        // });
      };
    } else {
      this.pointerUp = (e: PointerEvent) => {
        eventBus.emit('pointerup', new PointerEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener(
      'pointerup',
      this.pointerUp,
    );

    if (this.block.config.input.events.pointermove) {
      this.pointerMove = (e: PointerEvent) => {
        // const x = e.offsetX / this.block.container.scale;
        // const y = e.offsetY / this.block.container.scale;
        // const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointermove', eventId, e);
        // this.postMessage({
        //   type: 'pointermove',
        //   payload: { x, y, pointerId, eventId },
        // });
      };
    } else {
      this.pointerMove = (e: PointerEvent) => {
        eventBus.emit('pointermove', new PointerEvent(e.type, e));
      };
    }
    this.block.container.container.addEventListener(
      'pointermove',
      this.pointerMove,
    );

    if (this.block.config.input.events.keydown) {
      this.keyDown = (e: KeyboardEvent) => {
        // const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keydown', eventId, e);
        // this.postMessage({
        //   type: 'keydown',
        //   payload: { code, eventId },
        // });
      };
      this.block.container.container.addEventListener('keydown', this.keyDown);
    }

    if (this.block.config.input.events.keyup) {
      this.keyUp = (e: KeyboardEvent) => {
        // const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keyup', eventId, e);
        // this.postMessage({
        //   type: 'keyup',
        //   payload: { code, eventId },
        // });
      };
      this.block.container.container.addEventListener('keyup', this.keyUp);
    }
  }

  unload() {
    if (this.pointerEnter) {
      this.block.container.container.removeEventListener(
        'pointerenter',
        this.pointerEnter,
      );
    }
    if (this.wheel) {
      this.block.container.container.removeEventListener('wheel', this.wheel);
    }
    if (this.pointerDown) {
      this.block.container.container.removeEventListener(
        'pointerdown',
        this.pointerDown,
      );
    }
    if (this.pointerUp) {
      this.block.container.container.removeEventListener(
        'pointerup',
        this.pointerUp,
      );
    }
    if (this.pointerMove) {
      this.block.container.container.removeEventListener(
        'pointermove',
        this.pointerMove,
      );
    }
    if (this.keyDown) {
      this.block.container.container.removeEventListener(
        'keydown',
        this.keyDown,
      );
    }
    if (this.keyUp) {
      this.block.container.container.removeEventListener('keyup', this.keyUp);
    }

    this.rememberedEvents.clear();
    // messageBus.unsubscribe(this.xy);
    if (this.cleanupOldEventsInterval) {
      clearInterval(this.cleanupOldEventsInterval);
    }
    // eventBus.off('camera:moved', this.cameraMovedHandler);
    eventBus.off(
      `block:${this.block.x},${this.block.y}:message`,
      this.receiveMessage,
    );
  }
}
