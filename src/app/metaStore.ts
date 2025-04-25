type MetaPointCoords = `${MetaPoint['x']},${MetaPoint['y']}`; // todo sync with Block coords

type MetaPoint = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
};

export class MetaStore {
  protected origins = new Map<MetaPointCoords, MetaPoint>();
  protected index = new Map<string, string>();

  addBlockMeta(x: number, y: number, w: number, h: number, src: string) {
    const originKey: MetaPointCoords = `${x},${y}`;

    this.origins.set(originKey, {
      x,
      y,
      w,
      h,
      src,
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
    return originKey
      ? this.origins.get(originKey as MetaPointCoords)
      : undefined;
  }
}
