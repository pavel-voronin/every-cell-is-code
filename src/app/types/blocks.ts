export type ImageResource = {
  type: 'image';
  url: string;
};

export type WorkerResource = {
  type: 'worker';
  file: string;
  url: string;
  template: string;
};

export type ImageFrontendConfig = {
  type: 'image';
  resource: ImageResource;
  scale?: number;
  left?: number;
  top?: number;
  hAlign?: 'left' | 'center' | 'right';
  vAlign?: 'top' | 'middle' | 'bottom';
};

export type CanvasFrontendConfig = {
  type: 'canvas';
};

type FrontendConfig =
  | { type: 'none' }
  | ImageFrontendConfig
  | CanvasFrontendConfig;

export type WorkerBackendConfig = { type: 'worker'; resource: WorkerResource };

type BackendConfig = { type: 'none' } | WorkerBackendConfig;

type BlockEvents = {
  wheel?: true;
  pointerdown?: true;
  pointerup?: true;
  pointermove?: true;
  keydown?: true;
  keyup?: true;
};

export type BlockConfig = {
  x: number;
  y: number;
  w: number;
  h: number;
  frontend: FrontendConfig;
  backend: BackendConfig;
  input: {
    events: BlockEvents;
  };
};

export type Chunk = BlockConfig[];
