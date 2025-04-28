import { BlockManager } from './blockManager';
import { CELL_SIZE, EVENT_RETENTION_TIMEOUT } from './constants';
import { Context } from './context';
import { eventBus } from './eventBus';
import { Events } from './metaStore';

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

const Direction = {
  n: [0, -1] as [number, number],
  ne: [1, -1] as [number, number],
  e: [1, 0] as [number, number],
  se: [1, 1] as [number, number],
  s: [0, 1] as [number, number],
  sw: [-1, 1] as [number, number],
  w: [-1, 0] as [number, number],
  nw: [-1, -1] as [number, number],
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
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public src: string,
    public events: Events,
  ) {
    // Canvas

    const width = CELL_SIZE * w;
    const height = CELL_SIZE * h;

    this.canvas = this.context.createCanvasElement();
    this.canvas.width = width;
    this.canvas.height = height;
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

    eventBus.sync(
      'camera:moved',
      (offsetX: number, offsetY: number, scale: number) => {
        const px = (this.x * CELL_SIZE - offsetX) * scale;
        const py = (this.y * CELL_SIZE - offsetY) * scale;
        this.scale = scale;

        this.setCanvasPosition(
          px,
          py,
          this.w * CELL_SIZE * scale,
          this.h * CELL_SIZE * scale,
        );
      },
    );

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

  protected initializeWorkerEventListeners() {
    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 're-emit') {
        if (
          e.data.payload &&
          e.data.payload.eventId &&
          typeof e.data.payload.eventId === 'number'
        ) {
          this.reEmitEvent(e.data.payload.eventId);
        } else {
          // todo: terminate block
        }
      } else if (e.data.type === 'message') {
        const payload = e.data.payload as {
          to?: keyof typeof Direction | (keyof typeof Direction)[];
          from?: [number, number];
        };

        // 'from' should belong to the block
        const from = payload.from ? payload.from : [0, 0];

        if (
          from &&
          (from[0] < 0 || from[0] >= this.w || from[1] < 0 || from[1] >= this.h)
        ) {
          return;
        }

        // 'to' should point outside
        const to: [number, number][] = (
          payload.to
            ? (typeof payload.to === 'string'
                ? [payload.to]
                : payload.to
              ).filter((dir) => dir in Direction)
            : (Object.keys(Direction) as (keyof typeof Direction)[])
        )
          .filter((dir) => {
            const d = Direction[dir];
            const tx = from[0] + d[0];
            const ty = from[1] + d[1];

            return tx >= this.w || tx < 0 || ty < 0 || ty >= this.h;
          })
          .map((dir) => {
            const d = Direction[dir];
            return [this.x + from[0] + d[0], this.y + from[1] + d[1]];
          });

        this.blockManager.sendMessage(to, e.data.payload!);
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
