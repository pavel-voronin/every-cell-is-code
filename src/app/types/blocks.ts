export type ImageResourceSchema = {
  type: 'image';
  url: string;
};

export type WorkerResourceSchema = {
  type: 'worker';
  file: string;
  url: string;
  template: string;
};

export type ImageFrontendConfig = {
  type: 'image';
  resource: ImageResourceSchema;
  aspect: 'preserve' | 'fit';
  scale?: number;
  anchorX?: 'right' | 'center' | 'left';
  anchorY?: 'bottom' | 'center' | 'top';
  offsetX?: number;
  offsetY?: number;
};

export type CanvasFrontendConfig = {
  type: 'canvas';
};

type FrontendConfig =
  | { type: 'none' }
  | ImageFrontendConfig
  | CanvasFrontendConfig;

export type WorkerBackendConfig = {
  type: 'worker';
  resource: WorkerResourceSchema;
};

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
