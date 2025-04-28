type MetaPointCoords = `${MetaPoint['x']},${MetaPoint['y']}`; // todo sync with Block coords

type MetaPoint = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  events: Events;
};

// todo: move to domain types
export type Events = {
  wheel: boolean;
  pointerdown: boolean;
  pointerup: boolean;
  pointermove: boolean;
};

export class MetaStore {
  protected origins = new Map<MetaPointCoords, MetaPoint>();
  protected index = new Map<string, string>();

  addBlockMeta(
    x: number,
    y: number,
    w: number,
    h: number,
    src: string,
    events: Partial<MetaPoint['events'] & { all: boolean }> = {},
  ) {
    const originKey: MetaPointCoords = `${x},${y}`;

    this.origins.set(originKey, {
      x,
      y,
      w,
      h,
      src,
      events: {
        wheel: events.wheel ?? events.all ?? false,
        pointerdown: events.pointerdown ?? events.all ?? false,
        pointerup: events.pointerup ?? events.all ?? false,
        pointermove: events.pointermove ?? events.all ?? false,
      },
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
