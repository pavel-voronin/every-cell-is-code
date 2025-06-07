import { eventBus } from './communications/eventBus';
import { MetaManager } from './metaManager';
import { TupleMap } from './structures/tuppleMap';
import { XY } from './types/utils';
import { Block } from './blocks/block';

export class BlockManager {
  protected blocks = new TupleMap<Block>();
  private visibleChunksRequestId = 0;

  constructor(protected metaManager: MetaManager) {
    eventBus.on(`block:signal`, (to: XY, from: XY, payload: unknown) => {
      const subscriber = this.blocks.get(to);

      if (subscriber) {
        subscriber.eventBus.emit(`signal`, from, payload);
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
            const origin = this.metaManager.getBlockMeta(x, y);
            if (!origin) {
              continue;
            }
            if (!this.blocks.has([origin.x, origin.y])) {
              this.spawn([origin.x, origin.y]);
            }
          }
        }

        if (currentRequestId === this.visibleChunksRequestId) {
          for (const [bx, by] of this.blocks.keys()) {
            const blockMeta = this.metaManager.getBlockMeta(bx, by);
            if (!blockMeta) continue;
            const { x, y, w, h } = blockMeta;
            const isOutside =
              x + w - 1 < minX || x > maxX || y + h - 1 < minY || y > maxY;
            if (isOutside) {
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

    const config = this.metaManager.getBlockMeta(x, y);

    if (config) {
      if (this.blocks.has([config.x, config.y])) return;

      this.blocks.set([x, y], new Block(config));
    }
  }
}
