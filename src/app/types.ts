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

export type WorkerMessage<T extends object = Record<string, unknown>> = {
  type: string;
  payload?: T; // idea: pick serializable type
};
