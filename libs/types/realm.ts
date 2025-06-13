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

type ChunkLayer = {
  index: 0;
  name: string;
  type: 'grid';
  cellSize: number;
};

type AggregateLayer = {
  index: Exclude<number, 0>;
  name: string;
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
  supportedBlocks: Record<string, BlockDescriptor>;
  layers: [ChunkLayer, ...([AggregateLayer] | [])];
  settings?: {
    settingName: string;
  };
};

export type RealmSchema = RealmSchemaV1;
