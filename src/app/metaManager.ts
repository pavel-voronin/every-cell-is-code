import { CHUNK_SIZE } from './constants';
import { XY } from './types/base';
import { BlockConfig } from './types/blocks';
import { Chunk } from './types/blocks';
import { eventBus } from './communications/eventBus';
import { TupleMap } from './structures/tuppleMap';
import knownChunks from './knownChunks';

enum ChunkStatus {
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error',
}

export class MetaManager {
  protected origins = new TupleMap<BlockConfig>();
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

  protected addBlockMeta(meta: unknown) {
    const config = meta as BlockConfig;
    this.origins.set([config.x, config.y], config);

    for (let dx = 0; dx < config.w; dx++) {
      for (let dy = 0; dy < config.h; dy++) {
        this.index.set([config.x + dx, config.y + dy], [config.x, config.y]);
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
    if (!knownChunks.has([chunkX, chunkY])) {
      this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Error);
      return;
    }

    this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Loading);
    const url = `./meta/chunk_${chunkX}_${chunkY}.json`;
    await fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          this.chunkStatuses.set([chunkX, chunkY], ChunkStatus.Error);
          return;
        }

        const data: unknown = await res.json();

        // todo: validate

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
