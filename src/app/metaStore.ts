import { CHUNK_SIZE } from './constants';
import { eventBus } from './eventBus';

type MetaPointCoords = `${MetaPoint['x']},${MetaPoint['y']}`;

type MetaPoint = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  events: Events;
};

export type Events = {
  wheel: boolean;
  pointerdown: boolean;
  pointerup: boolean;
  pointermove: boolean;
};

enum ChunkStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

export class MetaStore {
  protected origins = new Map<MetaPointCoords, MetaPoint>();
  protected index = new Map<string, string>();
  protected chunkStatuses = new Map<string, ChunkStatus>();
  protected chunkPromises = new Map<string, Promise<void>>();

  constructor() {
    eventBus.on(
      'grid:visibleArea',
      (minX: number, maxX: number, minY: number, maxY: number) => {
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            this.loadChunk(x, y);
          }
        }
      },
    );
  }

  addBlockMeta(
    x: number,
    y: number,
    w: number,
    h: number,
    src: string,
    events: Partial<MetaPoint['events'] & { all: boolean }> = {},
  ) {
    const originKey: MetaPointCoords = `${x},${y}`;

    this.origins.set(originKey, {
      x,
      y,
      w,
      h,
      src,
      events: {
        wheel: events.wheel ?? events.all ?? false,
        pointerdown: events.pointerdown ?? events.all ?? false,
        pointerup: events.pointerup ?? events.all ?? false,
        pointermove: events.pointermove ?? events.all ?? false,
      },
    });

    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        const cellKey = `${x + dx},${y + dy}`;
        this.index.set(cellKey, originKey);
      }
    }
  }

  getBlockMeta(x: number, y: number) {
    const originKey = this.index.get(`${x},${y}`);
    return originKey
      ? this.origins.get(originKey as MetaPointCoords)
      : undefined;
  }

  async loadChunk(x: number, y: number): Promise<void> {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const key = `${chunkX},${chunkY}`;

    const status = this.chunkStatuses.get(key);

    if (status === ChunkStatus.Error) return;
    if (status === ChunkStatus.Loaded) return;
    if (status === ChunkStatus.Loading) return this.chunkPromises.get(key)!;

    this.chunkStatuses.set(key, ChunkStatus.Loading);
    const url = `./meta/chunk_${chunkX}_${chunkY}.json`;
    const promise = fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load chunk: ${url}`);

        const data = await res.json();

        for (const meta of data) {
          // todo: validate
          this.addBlockMeta(
            meta.x,
            meta.y,
            meta.w,
            meta.h,
            meta.src,
            meta.events ?? {},
          );

          eventBus.emit('meta:loaded', meta.x, meta.y);
        }

        this.chunkStatuses.set(key, ChunkStatus.Loaded);
      })
      .catch((err) => {
        this.chunkStatuses.set(key, ChunkStatus.Error);
        throw err;
      });
    this.chunkPromises.set(key, promise);
    return promise;
  }
}
