import { Block } from './block';
import { Context } from './context';
import { eventBus } from './eventBus';
import { MetaStore } from './metaStore';
import { TupleMap } from './structures/tuppleMap';
import { XY } from './types';

export class BlockManager {
  protected blocks = new TupleMap<Block>();
  private visibleChunksRequestId = 0;

  constructor(
    protected context: Context,
    protected metaStore: MetaStore,
  ) {
    this.metaStore = metaStore;

    eventBus.on('block:worker-error', (xy: XY) => {
      const block = this.blocks.get(xy);
      if (block) {
        block.unload();
        this.blocks.delete(xy);
      }
    });

    eventBus.on('block:worker-messageerror', (xy: XY) => {
      const block = this.blocks.get(xy);
      if (block) {
        block.unload();
        this.blocks.delete(xy);
      }
    });

    eventBus.on('block:terminate', (xy: XY) => {
      const block = this.blocks.get(xy);
      if (block) {
        block.unload();
        this.blocks.delete(xy);
      }
    });

    eventBus.on(
      'meta:visible-chunks-loaded',
      (minX: number, maxX: number, minY: number, maxY: number) => {
        this.visibleChunksRequestId++;
        const currentRequestId = this.visibleChunksRequestId;

        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            if (currentRequestId !== this.visibleChunksRequestId) return;
            if (!this.blocks.has([x, y])) {
              this.spawn([x, y]);
            }
          }
        }

        if (currentRequestId === this.visibleChunksRequestId) {
          for (const [bx, by] of this.blocks.keys()) {
            if (bx < minX || bx > maxX || by < minY || by > maxY) {
              const block = this.blocks.get([bx, by]);
              if (block) {
                block.unload();
                this.blocks.delete([bx, by]);
              }
            }
          }
        }
      },
    );
  }

  async spawn([x, y]: XY) {
    if (this.blocks.has([x, y])) {
      return;
    }

    const blockMeta = this.metaStore.getBlockMeta(x, y);

    if (blockMeta) {
      this.blocks.set([x, y], new Block(this.context, this, blockMeta));
    }
  }

  sendMessage(
    from: [number, number],
    to: [number, number],
    payload: Record<string, unknown>,
  ) {
    const origin = this.metaStore.getBlockMeta(to[0], to[1]);

    if (origin) {
      const block = this.blocks.get([origin.x, origin.y]);
      if (block) {
        const localFrom = [from[0] - origin.x, from[1] - origin.y];
        const localTo = [to[0] - origin.x, to[1] - origin.y];

        block.postMessage({
          type: 'message',
          payload: {
            ...payload,
            from: localFrom,
            to: localTo,
          },
        });
      }
    }
  }

  getBlocks() {
    return this.blocks.values();
  }
}
