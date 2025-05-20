export type XY = [number, number];

export function isXY(value: unknown): value is XY {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  );
}

export type XYWH = [number, number, number, number];

export type BlockEvents = {
  wheel: boolean;
  pointerdown: boolean;
  pointerup: boolean;
  pointermove: boolean;
  keydown: boolean;
  keyup: boolean;
};

export type RawBlockMeta = {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url?: string;
  events?: Partial<BlockEvents>;
  src?: string;
  image_url?: string;
};

export type Chunk = RawBlockMeta[];

export type BlockMeta = {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url?: string;
  events: BlockEvents;
  src?: string;
  image_url?: string;
};
