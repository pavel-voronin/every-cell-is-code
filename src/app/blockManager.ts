import { Block } from './block';
import { Context } from './context';
import { MetaStore } from './metaStore';

export class BlockManager {
  protected blocks = new Map<string, Block>();

  constructor(
    protected context: Context,
    protected metaStore: MetaStore,
  ) {
    this.metaStore = metaStore;
  }

  spawn(x: number, y: number) {
    const blockMeta = this.metaStore.getBlockMeta(x, y);

    if (blockMeta) {
      const { x, y, w, h, src, events } = blockMeta;
      this.blocks.set(
        `${x}_${y}`,
        new Block(this.context, this, x, y, w, h, src, events),
      );
    }
  }

  sendMessage(coords: [number, number][], payload: Record<string, unknown>) {
    for (const coord of coords) {
      const origin = this.metaStore.getBlockMeta(coord[0], coord[1]);

      if (origin) {
        const block = this.blocks.get(`${origin.x}_${origin.y}`);
        if (block) {
          block.postMessage({
            type: 'message',
            payload,
          });
        }
      }
    }
  }

  getBlocks() {
    return this.blocks.values();
  }
}
