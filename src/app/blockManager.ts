import { Block } from './block';
import { Context } from './context';
import { eventBus } from './eventBus';
import { MetaStore } from './metaStore';
import { XY } from './types';

export class BlockManager {
  protected blocks = new Map<string, Block>();

  constructor(
    protected context: Context,
    protected metaStore: MetaStore,
  ) {
    this.metaStore = metaStore;

    eventBus.on('meta:loaded', (xy: XY) => {
      this.spawn(xy[0], xy[1]);
    });

    eventBus.on('block:worker-error', (xy: XY) => {
      const block = this.blocks.get(`${xy[0]}_${xy[1]}`);
      if (block) {
        block.unload();
        this.blocks.delete(`${xy[0]}_${xy[1]}`);
      }
    });

    eventBus.on('block:worker-messageerror', (xy: XY) => {
      const block = this.blocks.get(`${xy[0]}_${xy[1]}`);
      if (block) {
        block.unload();
        this.blocks.delete(`${xy[0]}_${xy[1]}`);
      }
    });

    eventBus.on('block:terminate', (xy: XY) => {
      const block = this.blocks.get(`${xy[0]}_${xy[1]}`);
      if (block) {
        block.unload();
        this.blocks.delete(`${xy[0]}_${xy[1]}`);
      }
    });
  }

  spawn(x: number, y: number) {
    const blockMeta = this.metaStore.getBlockMeta(x, y);

    if (blockMeta) {
      const { x, y, w, h, src, events } = blockMeta;
      this.blocks.set(
        `${x}_${y}`,
        new Block(this.context, this, [x, y], w, h, src, events),
      );
    }
  }

  sendMessage(
    from: [number, number],
    to: [number, number],
    payload: Record<string, unknown>,
  ) {
    const origin = this.metaStore.getBlockMeta(to[0], to[1]);

    if (origin) {
      const block = this.blocks.get(`${origin.x}_${origin.y}`);
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
