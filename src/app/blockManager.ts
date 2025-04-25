import { Block } from './block';
import { MetaStore } from './metaStore';

export class BlockManager {
  protected blocks = new Map<string, Block>();

  constructor(
    protected document: Document,
    protected metaStore: MetaStore,
  ) {
    this.metaStore = metaStore;
  }

  spawn(x: number, y: number) {
    const blockMeta = this.metaStore.getBlockMeta(x, y);

    if (blockMeta) {
      const { x, y, w, h, src } = blockMeta;
      this.blocks.set(
        `${x}_${y}`,
        new Block(this.document, this, x, y, w, h, src),
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage(fromBlock: Block, e: any) {
    const dirs: { [key: string]: [number, number] } = {
      n: [0, -1],
      ne: [1, -1],
      e: [1, 0],
      se: [1, 1],
      s: [0, 1],
      sw: [-1, 1],
      w: [-1, 0],
      nw: [-1, -1],
    };

    const dirList: string[] =
      e.data.to === undefined
        ? Object.keys(dirs)
        : Array.isArray(e.data.to)
          ? e.data.to
          : [e.data.to];

    const from = e.data.from === undefined ? [0, 0] : e.data.from;
    if (
      from[0] < 0 ||
      from[0] >= fromBlock.w ||
      from[1] < 0 ||
      from[1] >= fromBlock.h
    ) {
      // Ignore or handle invalid 'from' coordinate
      return;
    }

    for (const dir of dirList) {
      const d = dirs[dir];
      if (!d) continue;
      const tx = fromBlock.x + from[0] + d[0];
      const ty = fromBlock.y + from[1] + d[1];
      for (const [, b] of this.blocks) {
        for (let dx = 0; dx < b.w; dx++) {
          for (let dy = 0; dy < b.h; dy++) {
            if (b.x + dx === tx && b.y + dy === ty) {
              b.postMessage({
                type: 'message',
                payload: e.data.payload,
              });
            }
          }
        }
      }
    }
  }

  getBlocks() {
    return this.blocks;
  }
}
