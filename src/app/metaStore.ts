export class MetaStore {
  origins = new Map();
  index = new Map();

  addBlockMeta(x: number, y: number, w: number, h: number, src: string) {
    const originKey = `${x},${y}`;

    this.origins.set(originKey, {
      x,
      y,
      src,
      w,
      h,
      block: null,
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
    return originKey ? this.origins.get(originKey) : null;
  }
}
