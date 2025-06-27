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

type Layer = {
  covers: { width: number; height: number };
  offset?: { x: number; y: number };
  presence: 'full' | 'bitmask' | 'bloom';
  subscribe?: 'poll' | 'websocket' | 'sse' | 'none';
};

type RealmSchemaV1 = {
  // meta
  schemaVersion: SemVer;
  name: string;
  description: string;
  // structure
  blocks: {
    frontend?: Record<string, BlockDescriptor>;
    backend?: Record<string, BlockDescriptor>;
    container?: Record<string, BlockDescriptor>;
    events?: Record<string, BlockDescriptor>;
    signals?: Record<string, BlockDescriptor>;
  };
  layers: Layer[];
  // communication (tbd)
  apiUrl: string;
};

export type RealmSchema = RealmSchemaV1;
