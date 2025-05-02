import { CHUNK_SIZE } from './constants';
import {
  BlockEvents,
  BlockMeta,
  BlockMetaCoords,
  Chunk,
  RawBlockEvents,
  RawBlockMeta,
  XY,
} from './types';
import { eventBus } from './eventBus';

enum ChunkStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

export class MetaStore {
  protected origins = new Map<BlockMetaCoords, BlockMeta>();
  protected index = new Map<string, string>();
  protected chunkStatuses = new Map<string, ChunkStatus>();

  constructor() {
    eventBus.on(
      'grid:visibleArea',
      (minX: number, maxX: number, minY: number, maxY: number) => {
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            this.loadChunk([x, y]);
          }
        }
      },
    );
  }

  protected resolveBlockEvents(events: RawBlockEvents = {}): BlockEvents {
    return {
      wheel: events.wheel ?? events.all ?? false,
      pointerdown: events.pointerdown ?? events.all ?? false,
      pointerup: events.pointerup ?? events.all ?? false,
      pointermove: events.pointermove ?? events.all ?? false,
      keydown: events.keydown ?? events.all ?? false,
      keyup: events.keyup ?? events.all ?? false,
    };
  }

  protected validateChunk(chunk: unknown): chunk is Chunk {
    return (
      Array.isArray(chunk) &&
      chunk.every((meta) => this.validateRawBlockMeta(meta))
    );
  }

  protected validateRawBlockMeta(meta: unknown): meta is RawBlockMeta {
    return (
      typeof (meta as RawBlockMeta) === 'object' &&
      typeof (meta as RawBlockMeta).x === 'number' &&
      typeof (meta as RawBlockMeta).y === 'number' &&
      typeof (meta as RawBlockMeta).w === 'number' &&
      typeof (meta as RawBlockMeta).h === 'number' &&
      typeof (meta as RawBlockMeta).src === 'string' &&
      ((meta as RawBlockMeta).events === undefined ||
        typeof (meta as RawBlockMeta).events === 'object')
    );
  }

  protected addBlockMeta(meta: RawBlockMeta) {
    const originKey: BlockMetaCoords = `${meta.x},${meta.y}`;
    this.origins.set(originKey, {
      x: meta.x,
      y: meta.y,
      w: meta.w,
      h: meta.h,
      src: meta.src,
      events: this.resolveBlockEvents(meta.events),
    });

    for (let dx = 0; dx < meta.w; dx++) {
      for (let dy = 0; dy < meta.h; dy++) {
        const cellKey = `${meta.x + dx},${meta.y + dy}`;
        this.index.set(cellKey, originKey);
      }
    }
  }

  getBlockMeta(x: number, y: number) {
    const originKey = this.index.get(`${x},${y}`);
    return originKey
      ? this.origins.get(originKey as BlockMetaCoords)
      : undefined;
  }

  protected async loadChunk([x, y]: XY): Promise<void> {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const key = `${chunkX},${chunkY}`;

    const status = this.chunkStatuses.get(key);

    if (status === ChunkStatus.Error) return;
    if (status === ChunkStatus.Loaded) return;
    if (status === ChunkStatus.Loading) return;

    this.chunkStatuses.set(key, ChunkStatus.Loading);
    const url = `./meta/chunk_${chunkX}_${chunkY}.json`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          this.chunkStatuses.set(key, ChunkStatus.Error);
          return;
        }

        const data: unknown = await res.json();
        if (!this.validateChunk(data)) {
          throw new Error(`Invalid chunk data: ${url}`);
        }

        this.loadChunkData([chunkX, chunkY], data as Chunk);
      })
      .catch((err) => {
        this.chunkStatuses.set(key, ChunkStatus.Error);
        throw err;
      });
  }

  loadChunkData(chunkXY: XY, data: Chunk) {
    const key = `${chunkXY[0]},${chunkXY[1]}`;

    for (const meta of data) {
      this.addBlockMeta(meta);
      eventBus.emit('meta:loaded', [meta.x, meta.y]);
    }

    this.chunkStatuses.set(key, ChunkStatus.Loaded);
  }
}
