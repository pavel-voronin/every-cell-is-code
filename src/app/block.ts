import { BlockManager } from './blockManager';
import { CELL_SIZE } from './constants';
import { eventBus } from './eventBus';

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
  protected pendingEvents = new Map<number, (intercepted: boolean) => void>();

  protected worker: Worker;

  constructor(
    protected document: Document,
    protected blockManager: BlockManager,
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public src: string,
  ) {
    this.worker = new Worker(src, { type: 'module' }); // to use CSP eventually

    const width = CELL_SIZE * w;
    const height = CELL_SIZE * h;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.position = 'absolute';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '1';
    document.body.appendChild(this.canvas);

    const offCanvas = this.canvas.transferControlToOffscreen();
    offCanvas.width = width;
    offCanvas.height = height;

    this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.type === 'intercepted') {
        const { eventId, intercepted } = e.data.payload as {
          eventId: number;
          intercepted: boolean;
        };

        const resolver = this.pendingEvents.get(eventId);
        if (resolver) {
          resolver(intercepted);
          this.dropPendingEvent(eventId);
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

    eventBus.sync(
      'grid:moved',
      (offsetX: number, offsetY: number, scale: number) => {
        const px = (this.x * CELL_SIZE - offsetX) * scale;
        const py = (this.y * CELL_SIZE - offsetY) * scale;

        this.setCanvasPosition(
          px,
          py,
          this.w * CELL_SIZE * scale,
          this.h * CELL_SIZE * scale,
        );
      },
    );
  }

  requestEventId() {
    return this.counter++;
  }

  dropPendingEvent(eventId: number) {
    this.pendingEvents.delete(eventId);
  }

  addPendingEvent(eventId: number, resolver: (intercepted: boolean) => void) {
    this.pendingEvents.set(eventId, resolver);
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
