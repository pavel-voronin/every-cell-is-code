export type XY = [number, number];
export type XYWH = [number, number, number, number];

export type BlockEvents = {
  wheel: boolean;
  pointerdown: boolean;
  pointerup: boolean;
  pointermove: boolean;
  keydown: boolean;
  keyup: boolean;
};

export type RawBlockEvents = Partial<BlockEvents> & { all?: boolean };

export type RawBlockMeta = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  events?: RawBlockEvents;
};

export type Chunk = RawBlockMeta[];

export type BlockMeta = {
  x: number;
  y: number;
  w: number;
  h: number;
  src: string;
  events: BlockEvents;
};
