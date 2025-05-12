import { CHUNK_SIZE } from './constants';
import {
  BlockEvents,
  BlockMeta,
  Chunk,
  RawBlockEvents,
  RawBlockMeta,
  XY,
} from './types';
import { eventBus } from './eventBus';
import { TupleMap } from './structures/tuppleMap';
import knownChunks from './knownChunks';

enum ChunkStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

export class MetaManager {
  protected origins = new TupleMap<BlockMeta>();
  protected index = new TupleMap<XY>();
  protected chunkStatuses = new TupleMap<ChunkStatus>();
  protected visibleAreaRequestId = 0;

  constructor() {
    eventBus.on(
      'grid:visible-area',
      async (minX: number, maxX: number, minY: number, maxY: number) => {
        this.visibleAreaRequestId++;
        const currentRequestId = this.visibleAreaRequestId;
        const chunkPromises: Promise<void>[] = [];
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            chunkPromises.push(this.loadChunk([x, y]));
          }
        }
        await Promise.all(chunkPromises);
        if (currentRequestId === this.visibleAreaRequestId) {
          eventBus.emit('meta:visible-chunks-loaded', minX, maxX, minY, maxY);
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
    this.origins.set([meta.x, meta.y], {
      x: meta.x,
      y: meta.y,
      w: meta.w,
      h: meta.h,
      src: meta.src,
      events: this.resolveBlockEvents(meta.events),
    });

    for (let dx = 0; dx < meta.w; dx++) {
      for (let dy = 0; dy < meta.h; dy++) {
        this.index.set([meta.x + dx, meta.y + dy], [meta.x, meta.y]);
      }
    }
  }

  getBlockMeta(x: number, y: number) {
    const originKey = this.index.get([x, y]);
    return originKey ? this.origins.get(originKey) : undefined;
  }

  protected async loadChunk([x, y]: XY): Promise<void> {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);

    const status = this.chunkStatuses.get([chunkX, chunkY]);

    if (status === ChunkStatus.Error) return;
    if (status === ChunkStatus.Loaded) return;
    if (status === ChunkStatus.Loading) return;

    // Check if chunk is known
    const isKnown = knownChunks.some(
      ([kx, ky]) => kx === chunkX && ky === chunkY,
    );

    if (!isKnown) {
      this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Error);
      return;
    }

    this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Loading);
    const url = `./meta/chunk_${chunkX}_${chunkY}.json`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Error);
          return;
        }

        const data: unknown = await res.json();
        if (!this.validateChunk(data)) {
          throw new Error(`Invalid chunk data: ${url}`);
        }

        this.loadChunkData([chunkX, chunkY], data as Chunk);
      })
      .catch((err) => {
        this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Error);
        throw err;
      });
  }

  loadChunkData(chunkXY: XY, data: Chunk) {
    for (const meta of data) {
      this.addBlockMeta(meta);
    }

    this.chunkStatuses.set(chunkXY, ChunkStatus.Loaded);
  }
}
