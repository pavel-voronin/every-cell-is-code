type SemVer =
  | number
  | `${number}`
  | `${number}.${number}`
  | `${number}.${number}.${number}`;

type BlockDescriptor =
  | SemVer
  | {
      version: SemVer;
      [key: string]: unknown;
    };

type GridLayer = {
  index: 0;
  type: 'grid';
};

type AggregateLayer = {
  index: Exclude<number, 0>;
  type: 'aggregate';
  covers: { layer: number; width: number; height: number };
  offset?: { x: number; y: number };
  presence?: 'bitmask' | 'bloom' | 'none';
  subscribe?: 'poll' | 'websocket' | 'sse' | 'none';
};

type RealmSchemaV1 = {
  schemaVersion: SemVer;
  name: string;
  description: string;
  apiUrl: string;
  blocks: {
    frontend?: Record<string, BlockDescriptor>;
    backend?: Record<string, BlockDescriptor>;
    container?: Record<string, BlockDescriptor>;
    events?: Record<string, BlockDescriptor>;
    signals?: Record<string, BlockDescriptor>;
  };
  layers: [GridLayer, ...([AggregateLayer] | [])];
  settings?: {
    settingName: string;
  };
};

export type RealmSchema = RealmSchemaV1;
