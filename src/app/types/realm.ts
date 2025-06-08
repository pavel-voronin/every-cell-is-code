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

type RealmSchemaV1 = {
  schemaVersion: SemVer;
  name: string;
  description: string;
  apiUrl: string;
  supportedBlocks: Record<string, BlockDescriptor>;
  settings?: {
    offsetX?: number;
    offsetY?: number;
  };
};

export type RealmSchema = RealmSchemaV1;
