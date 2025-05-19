import { ImageBlock } from './blocks/imageBlock';
import { IBlock, doesReceiveMessage } from './blocks/interfaces';
import { TemplatedWorkerBlock } from './blocks/templatedWorkerBlock';
import { eventBus } from './eventBus';
import { MetaManager } from './metaManager';
import { TupleMap } from './structures/tuppleMap';
import { XY } from './types';

export class BlockManager {
  protected blocks = new TupleMap<IBlock>();
  private visibleChunksRequestId = 0;

  constructor(protected metaManager: MetaManager) {
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

    eventBus.on('block:sendMessage', (from, to, payload) => {
      this.sendMessage(from, to, payload);
    });
  }

  async spawn([x, y]: XY) {
    if (this.blocks.has([x, y])) {
      return;
    }

    const blockMeta = this.metaManager.getBlockMeta(x, y);

    if (blockMeta) {
      if (this.blocks.has([blockMeta.x, blockMeta.y])) return;

      switch (blockMeta.type) {
        case 'templated_worker':
          this.blocks.set([x, y], new TemplatedWorkerBlock(blockMeta));
          break;
        case 'image':
          this.blocks.set([x, y], new ImageBlock(blockMeta));
          break;
        default:
          throw new Error(`Block type ${blockMeta.type} is not supported`);
      }
    }
  }

  sendMessage(
    from: [number, number],
    to: [number, number],
    payload: Record<string, unknown>,
  ) {
    const origin = this.metaManager.getBlockMeta(to[0], to[1]);

    if (origin) {
      const block = this.blocks.get([origin.x, origin.y]);
      if (block && doesReceiveMessage(block)) {
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
}
