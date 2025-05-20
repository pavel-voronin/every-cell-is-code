import { CELL_SIZE, EVENT_RETENTION_TIMEOUT } from '../constants';
import { eventBus } from '../communications/eventBus';
import { BlockEvents, BlockMeta, XY, XYWH } from '../types';
import { IBlock, IRenderable } from './interfaces';
import messageBus from '../communications/messageBus';

export class TemplatedWorkerBlock implements IBlock, IRenderable {
  public xy: XY;
  public wh: XY;

  public url?: string;
  public src?: string;
  public events: BlockEvents;

  protected counter = 0;
  element: HTMLCanvasElement;
  protected canvasContext: CanvasRenderingContext2D;
  protected lastBitmap: ImageBitmap | null = null;
  protected rememberedEvents = new Map<
    number,
    { type: string; event: Event; timestamp: number }
  >();
  protected scale: number = 1.0;

  protected worker: Worker;
  protected cleanupOldEventsInterval?: ReturnType<typeof setInterval>;

  constructor(meta: BlockMeta) {
    this.xy = [meta.x, meta.y];
    this.wh = [meta.w, meta.h];
    this.url = meta.url;
    this.src = meta.src;
    this.events = meta.events;

    // Canvas

    const width = CELL_SIZE * this.wh[0];
    const height = CELL_SIZE * this.wh[1];

    this.element = document.createElement('canvas');
    document.body.appendChild(this.element);

    this.element.width = width;
    this.element.height = height;
    this.element.tabIndex = -1;
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = Object.values(this.events).every(
      (v) => v === false,
    )
      ? 'none'
      : 'auto';
    this.element.style.zIndex = '1';

    this.canvasContext = this.element.getContext('2d')!;
    this.canvasContext.imageSmoothingEnabled = false;

    this.initializeCanvasEventListener();

    eventBus.sync('camera:moved', this.cameraMovedHandler);

    // Worker

    if (this.src) {
      this.worker = new Worker(
        URL.createObjectURL(
          new Blob([this.src], { type: 'application/javascript' }),
        ),
      );
    } else if (this.url) {
      this.worker = new Worker(this.url);
    } else {
      throw new Error('No worker URL or source provided');
    }

    this.initializeWorkerEventListeners();

    this.worker.postMessage({
      type: 'init',
      width,
      height,
      targetFPS: 60,
      origin: this.xy,
    });

    this.cleanupOldEvents();

    eventBus.on(
      `block:${this.xy[0]},${this.xy[1]}:message`,
      this.receiveMessage,
    );
  }

  receiveMessage = (from: XY, payload: unknown) => {
    this.postMessage({
      type: 'message',
      from,
      payload,
    });
  };

  cameraMovedHandler = ([x, y]: XY, scale: number) => {
    this.scale = scale;

    const new_x = Math.floor((this.xy[0] * CELL_SIZE - x) * scale);
    const new_y = Math.floor((this.xy[1] * CELL_SIZE - y) * scale);
    const new_w = Math.floor(this.wh[0] * CELL_SIZE * scale);
    const new_h = Math.floor(this.wh[1] * CELL_SIZE * scale);

    this.position([new_x, new_y, new_w, new_h]);
  };

  protected reEmitEvent(eventId: number) {
    const rememberedEvent = this.rememberedEvents.get(eventId)?.event;

    if (rememberedEvent) {
      eventBus.emit(rememberedEvent.type, rememberedEvent);
      this.rememberedEvents.delete(eventId);
    }
  }

  protected initializeWorkerEventListeners() {
    this.worker.addEventListener('message', (e: MessageEvent) => {
      e.data.payload ??= {};

      switch (e.data.type) {
        case 'draw':
          this.lastBitmap = e.data.payload.bitmap as ImageBitmap;
          this.canvasContext.drawImage(
            this.lastBitmap,
            0,
            0,
            this.wh[0] * CELL_SIZE * this.scale,
            this.wh[1] * CELL_SIZE * this.scale,
          );
          break;
        case 'terminate':
          eventBus.emit('block:terminate', this.xy);
          break;
        case 'subscribe': {
          const { to, topic, radius } = e.data as MessageEvent<{
            to?: XY;
            topic?: string;
            radius?: number;
          }>['data'];

          if (!to && !topic) {
            messageBus.subscribe(this.xy, {
              to: this.xy,
              radius: radius ?? 0,
            });
          } else {
            messageBus.subscribe(this.xy, {
              to,
              topic,
              radius: radius ?? 0,
            });
          }
          break;
        }
        case 'message': {
          const { to, topic, radius, payload } = e.data as MessageEvent<{
            to?: XY;
            topic?: string;
            radius?: number;
            payload: unknown;
          }>['data'];

          if (!to && !topic) {
            throw new Error('No target or topic specified for message event');
          }

          messageBus.send(
            this.xy,
            {
              to,
              topic,
              radius: radius ?? 0,
            },
            payload,
          );
          break;
        }
        case 're-emit':
          if (
            e.data.payload.eventId &&
            typeof e.data.payload.eventId === 'number'
          ) {
            this.reEmitEvent(e.data.payload.eventId);
          }
          break;
      }
    });

    this.worker.addEventListener('error', (e: ErrorEvent) => {
      eventBus.emit('block:worker-error', this.xy, e);
    });

    this.worker.addEventListener('messageerror', (e: MessageEvent) => {
      eventBus.emit('block:worker-messageerror', this.xy, e);
    });
  }

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

  protected rememberEvent(type: string, eventId: number, e: Event) {
    this.rememberedEvents.set(eventId, {
      type,
      event: e,
      timestamp: Date.now(),
    });
  }

  #_pointerEnter?: () => void;
  #_wheel?: (e: WheelEvent) => void;
  #_pointerDown?: (e: PointerEvent) => void;
  #_pointerUp?: (e: PointerEvent) => void;
  #_pointerMove?: (e: PointerEvent) => void;
  #_keyDown?: (e: KeyboardEvent) => void;
  #_keyUp?: (e: KeyboardEvent) => void;

  protected initializeCanvasEventListener() {
    this.#_pointerEnter = () => {
      this.element.focus();
    };
    this.element.addEventListener('pointerenter', this.#_pointerEnter);

    if (this.events.wheel) {
      this.#_wheel = (e: WheelEvent) => {
        e.preventDefault();
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const deltaX = e.deltaX;
        const deltaY = e.deltaY;
        const eventId = this.nextEventId();
        this.rememberEvent('wheel', eventId, e);
        this.postMessage({
          type: 'wheel',
          payload: { x, y, deltaX, deltaY, eventId },
        });
      };
    } else {
      this.#_wheel = (e: WheelEvent) => {
        eventBus.emit('wheel', new WheelEvent(e.type, e));
      };
    }
    this.element.addEventListener('wheel', this.#_wheel);

    if (this.events.pointerdown) {
      this.#_pointerDown = (e: PointerEvent) => {
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerdown', eventId, e);
        this.postMessage({
          type: 'pointerdown',
          payload: { x, y, pointerId, eventId },
        });
      };
    } else {
      this.#_pointerDown = (e: PointerEvent) => {
        eventBus.emit('pointerdown', new PointerEvent(e.type, e));
      };
    }
    this.element.addEventListener('pointerdown', this.#_pointerDown);

    if (this.events.pointerup) {
      this.#_pointerUp = (e: PointerEvent) => {
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerup', eventId, e);
        this.postMessage({
          type: 'pointerup',
          payload: { x, y, pointerId, eventId },
        });
      };
    } else {
      this.#_pointerUp = (e: PointerEvent) => {
        eventBus.emit('pointerup', new PointerEvent(e.type, e));
      };
    }
    this.element.addEventListener('pointerup', this.#_pointerUp);

    if (this.events.pointermove) {
      this.#_pointerMove = (e: PointerEvent) => {
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointermove', eventId, e);
        this.postMessage({
          type: 'pointermove',
          payload: { x, y, pointerId, eventId },
        });
      };
    } else {
      this.#_pointerMove = (e: PointerEvent) => {
        eventBus.emit('pointermove', new PointerEvent(e.type, e));
      };
    }
    this.element.addEventListener('pointermove', this.#_pointerMove);

    if (this.events.keydown) {
      this.#_keyDown = (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keydown', eventId, e);
        this.postMessage({
          type: 'keydown',
          payload: { code, eventId },
        });
      };
      this.element.addEventListener('keydown', this.#_keyDown);
    }

    if (this.events.keyup) {
      this.#_keyUp = (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keyup', eventId, e);
        this.postMessage({
          type: 'keyup',
          payload: { code, eventId },
        });
      };
      this.element.addEventListener('keyup', this.#_keyUp);
    }
  }

  nextEventId() {
    return this.counter++;
  }

  // todo: figure out
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage(message: any, options?: StructuredSerializeOptions) {
    this.worker.postMessage(message, options);
  }

  position([x, y, w, h]: XYWH) {
    this.element.style.transform = `translate(${x}px, ${y}px)`;

    // idea: return css based scaling as option

    if (this.element.width !== w || this.element.height !== h) {
      this.element.width = w;
      this.element.height = h;

      this.canvasContext.imageSmoothingEnabled = false;

      if (this.lastBitmap) {
        this.canvasContext.drawImage(
          this.lastBitmap,
          0,
          0,
          this.wh[0] * CELL_SIZE * this.scale,
          this.wh[1] * CELL_SIZE * this.scale,
        );
      }
    }
  }

  unload() {
    if (this.#_pointerEnter) {
      this.element.removeEventListener('pointerenter', this.#_pointerEnter);
    }
    if (this.#_wheel) {
      this.element.removeEventListener('wheel', this.#_wheel);
    }
    if (this.#_pointerDown) {
      this.element.removeEventListener('pointerdown', this.#_pointerDown);
    }
    if (this.#_pointerUp) {
      this.element.removeEventListener('pointerup', this.#_pointerUp);
    }
    if (this.#_pointerMove) {
      this.element.removeEventListener('pointermove', this.#_pointerMove);
    }
    if (this.#_keyDown) {
      this.element.removeEventListener('keydown', this.#_keyDown);
    }
    if (this.#_keyUp) {
      this.element.removeEventListener('keyup', this.#_keyUp);
    }

    this.rememberedEvents.clear();
    messageBus.unsubscribe(this.xy);
    if (this.cleanupOldEventsInterval) {
      clearInterval(this.cleanupOldEventsInterval);
    }
    eventBus.off('camera:moved', this.cameraMovedHandler);
    eventBus.off(
      `block:${this.xy[0]},${this.xy[1]}:message`,
      this.receiveMessage,
    );
    this.worker.terminate();
    this.element.remove();
    this.canvasContext = null!;
    this.element = null!;
    this.worker = null!;
    this.lastBitmap = null!;
  }
}
