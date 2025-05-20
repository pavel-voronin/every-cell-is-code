import { CELL_SIZE, EVENT_RETENTION_TIMEOUT } from '../constants';
import { eventBus } from '../eventBus';
import { BlockEvents, BlockMeta, WorkerMessage, XY, XYWH } from '../types';
import { IBlock, IRenderable } from './interfaces';

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
    });

    this.cleanupOldEvents();
  }

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
    this.worker.addEventListener(
      'message',
      (e: MessageEvent<WorkerMessage>) => {
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
          case 're-emit':
            if (
              e.data.payload.eventId &&
              typeof e.data.payload.eventId === 'number'
            ) {
              this.reEmitEvent(e.data.payload.eventId);
            }
            break;
        }
      },
    );

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

  protected initializeCanvasEventListener() {
    this.element.addEventListener('pointerenter', () => {
      this.element.focus();
    });

    if (this.events.wheel) {
      this.element.addEventListener('wheel', (e: WheelEvent) => {
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
      });
    } else {
      this.element.addEventListener('wheel', (e: WheelEvent) => {
        eventBus.emit('wheel', new WheelEvent(e.type, e));
      });
    }

    if (this.events.pointerdown) {
      this.element.addEventListener('pointerdown', (e: PointerEvent) => {
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerdown', eventId, e);
        this.postMessage({
          type: 'pointerdown',
          payload: { x, y, pointerId, eventId },
        });
      });
    } else {
      this.element.addEventListener('pointerdown', (e: PointerEvent) => {
        eventBus.emit('pointerdown', new PointerEvent(e.type, e));
      });
    }

    if (this.events.pointerup) {
      this.element.addEventListener('pointerup', (e: PointerEvent) => {
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointerup', eventId, e);
        this.postMessage({
          type: 'pointerup',
          payload: { x, y, pointerId, eventId },
        });
      });
    } else {
      this.element.addEventListener('pointerup', (e: PointerEvent) => {
        eventBus.emit('pointerup', new PointerEvent(e.type, e));
      });
    }

    if (this.events.pointermove) {
      this.element.addEventListener('pointermove', (e: PointerEvent) => {
        const x = e.offsetX / this.scale;
        const y = e.offsetY / this.scale;
        const pointerId = e.pointerId;
        const eventId = this.nextEventId();
        this.rememberEvent('pointermove', eventId, e);
        this.postMessage({
          type: 'pointermove',
          payload: { x, y, pointerId, eventId },
        });
      });
    } else {
      this.element.addEventListener('pointermove', (e: PointerEvent) => {
        eventBus.emit('pointermove', new PointerEvent(e.type, e));
      });
    }

    if (this.events.keydown) {
      this.element.addEventListener('keydown', (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keydown', eventId, e);
        this.postMessage({
          type: 'keydown',
          payload: { code, eventId },
        });
      });
    }

    if (this.events.keyup) {
      this.element.addEventListener('keyup', (e: KeyboardEvent) => {
        const code = e.code;
        const eventId = this.nextEventId();
        this.rememberEvent('keyup', eventId, e);
        this.postMessage({
          type: 'keyup',
          payload: { code, eventId },
        });
      });
    }
  }

  nextEventId() {
    return this.counter++;
  }

  postMessage(message: WorkerMessage, options?: StructuredSerializeOptions) {
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
    if (this.cleanupOldEventsInterval) {
      clearInterval(this.cleanupOldEventsInterval);
    }
    eventBus.off('camera:moved', this.cameraMovedHandler);
    this.worker.terminate();
    this.element.remove();
  }
}
