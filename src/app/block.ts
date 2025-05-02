import { BlockManager } from './blockManager';
import { CELL_SIZE, EVENT_RETENTION_TIMEOUT } from './constants';
import { Context } from './context';
import { eventBus } from './eventBus';
import { BlockEvents, XY } from './types';

export enum BlockState {
  Created = 'created',
  Loading = 'loading',
  Loaded = 'loaded',
  Started = 'started',
  Terminated = 'terminated',
}

export type WorkerMessage<T extends object = Record<string, unknown>> = {
  type: string;
  payload?: T; // idea: pick serializable type
};

const Direction: Record<string, XY> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1],
};

export class Block {
  protected state = BlockState.Created;
  protected counter = 0;
  protected canvas: HTMLCanvasElement;
  protected rememberedEvents = new Map<
    number,
    { type: string; event: Event; timestamp: number }
  >();
  protected scale: number = 1.0;

  protected worker: Worker;

  constructor(
    protected context: Context,
    protected blockManager: BlockManager,
    public xy: XY,
    public w: number,
    public h: number,
    public src: string,
    public events: BlockEvents,
  ) {
    // Canvas

    const width = CELL_SIZE * w;
    const height = CELL_SIZE * h;

    this.canvas = this.context.createCanvasElement();
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.tabIndex = -1;
    this.canvas.style.position = 'absolute';
    this.canvas.style.pointerEvents = Object.values(this.events).every(
      (v) => v === false,
    )
      ? 'none'
      : 'auto';
    this.canvas.style.zIndex = '1';

    this.initializeCanvasEventListener();

    const offCanvas = this.canvas.transferControlToOffscreen();
    offCanvas.width = width;
    offCanvas.height = height;

    eventBus.sync('camera:moved', (offset: XY, scale: number) => {
      const px = (this.xy[0] * CELL_SIZE - offset[0]) * scale;
      const py = (this.xy[1] * CELL_SIZE - offset[1]) * scale;
      this.scale = scale;

      this.setCanvasPosition(
        px,
        py,
        this.w * CELL_SIZE * scale,
        this.h * CELL_SIZE * scale,
      );
    });

    // Worker

    this.worker = new Worker(src, { type: 'module' }); // to use CSP eventually
    this.initializeWorkerEventListeners();

    this.worker.postMessage(
      {
        type: 'init',
        width,
        height,
        wCells: w,
        hCells: h,
        offCanvas,
      },
      [offCanvas],
    );

    this.cleanupOldEvents();
  }

  protected reEmitEvent(eventId: number) {
    const rememberedEvent = this.rememberedEvents.get(eventId)?.event;

    if (rememberedEvent) {
      eventBus.emit(rememberedEvent.type, rememberedEvent);
      this.rememberedEvents.delete(eventId);
    }
  }

  protected sendMessage(payload: Record<string, unknown>) {
    // 'from' should belong to the block

    const from: XY =
      Array.isArray(payload.from) &&
      payload.from.length === 2 &&
      payload.from.every((coord) => Number.isInteger(coord))
        ? (payload.from as XY)
        : [0, 0];

    if (from[0] < 0 || from[0] >= this.w || from[1] < 0 || from[1] >= this.h) {
      return;
    }

    const globalFrom: XY = [this.xy[0] + from[0], this.xy[1] + from[1]];

    // 'to' should point outside

    // `to` can be undefined (all directions) or be in formats:
    //
    //  - 'n' -- string, e.g. w, ne, s, etc.
    //  - [0, 1] -- relative coords (vector length = 1 at most)
    //  - ['n', 's'] -- array of strings
    //  - ['n', [1, 0]] -- array of mixed

    const to: XY[] = (
      payload.to
        ? (Array.isArray(payload.to) ? payload.to : [payload.to]).flatMap(
            (dir) => {
              if (typeof dir === 'string' && dir in Direction) {
                const d = Direction[dir as keyof typeof Direction];
                return [[from[0] + d[0], from[1] + d[1]]];
              } else if (
                Array.isArray(dir) &&
                dir.length === 2 &&
                dir.every((coord) => Number.isInteger(coord))
              ) {
                return [[from[0] + dir[0], from[1] + dir[1]]];
              }
              return [];
            },
          )
        : Object.values(Direction).map((d) => [from[0] + d[0], from[1] + d[1]])
    )
      .filter(
        (coords): coords is XY =>
          coords.length === 2 &&
          coords.every((coord) => typeof coord === 'number'),
      )
      .filter(([tx, ty]) => tx < 0 || tx >= this.w || ty < 0 || ty >= this.h)
      .map(([tx, ty]) => [
        this.xy[0] + from[0] + tx,
        this.xy[1] + from[1] + ty,
      ]);

    to.forEach((globalTo) => {
      this.blockManager.sendMessage(globalFrom, globalTo, payload);
    });
  }

  protected initializeWorkerEventListeners() {
    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.payload !== undefined) {
        if (e.data.type === 're-emit') {
          if (
            e.data.payload.eventId &&
            typeof e.data.payload.eventId === 'number'
          ) {
            this.reEmitEvent(e.data.payload.eventId);
          } else {
            // todo: terminate block
          }
        } else if (e.data.type === 'message') {
          this.sendMessage(e.data.payload);
        }
      }
    };
  }

  // Periodically clean up old remembered events
  protected cleanupOldEvents() {
    setInterval(() => {
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
    this.canvas.addEventListener('pointerenter', () => {
      this.canvas.focus();
    });

    if (this.events.wheel) {
      this.canvas.addEventListener('wheel', (e: WheelEvent) => {
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
      this.canvas.addEventListener('wheel', (e: WheelEvent) => {
        eventBus.emit('wheel', new WheelEvent(e.type, e));
      });
    }

    if (this.events.pointerdown) {
      this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
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
      this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
        eventBus.emit('pointerdown', new PointerEvent(e.type, e));
      });
    }

    if (this.events.pointerup) {
      this.canvas.addEventListener('pointerup', (e: PointerEvent) => {
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
      this.canvas.addEventListener('pointerup', (e: PointerEvent) => {
        eventBus.emit('pointerup', new PointerEvent(e.type, e));
      });
    }

    if (this.events.pointermove) {
      this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
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
      this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
        eventBus.emit('pointermove', new PointerEvent(e.type, e));
      });
    }

    if (this.events.keydown) {
      this.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
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
      this.canvas.addEventListener('keyup', (e: KeyboardEvent) => {
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

  setCanvasPosition(x: number, y: number, w: number, h: number) {
    this.canvas.style.transform = `translate(${x}px, ${y}px)`;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
  }
}
