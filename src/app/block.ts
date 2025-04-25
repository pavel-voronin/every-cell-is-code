import { BlockManager } from './blockManager';
import { CELL_SIZE } from './constants';

export enum BlockState {
  Created = 'created',
  Loading = 'loading',
  Loaded = 'loaded',
  Started = 'started',
  Terminated = 'terminated',
}

export class Block {
  protected state = BlockState.Created;
  protected counter = 0;
  public domCanvas: HTMLCanvasElement; // todo make it protected
  public pendingEvents = new Map(); // todo make it protected

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
    this.worker = new Worker(src, { type: 'module' });

    const width = CELL_SIZE * w;
    const height = CELL_SIZE * h;

    this.domCanvas = document.createElement('canvas');
    this.domCanvas.width = width;
    this.domCanvas.height = height;
    this.domCanvas.style.position = 'absolute';
    this.domCanvas.style.pointerEvents = 'none';
    this.domCanvas.style.zIndex = '1';
    document.body.appendChild(this.domCanvas);

    const offCanvas = this.domCanvas.transferControlToOffscreen();
    offCanvas.width = width;
    offCanvas.height = height;

    this.worker.onmessage = (e) => {
      if (e.data.type === 'intercept') {
        const { eventId, intercepted } = e.data;
        const resolver = this.pendingEvents.get(eventId);
        if (resolver) {
          resolver(intercepted);
          this.pendingEvents.delete(eventId);
        }
      } else if (e.data.type === 'message') {
        this.blockManager.sendMessage(this, e);
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
  }

  requestEventId() {
    return this.counter++;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  postMessage(message: any, options?: StructuredSerializeOptions) {
    this.worker.postMessage(message, options);
  }
}
