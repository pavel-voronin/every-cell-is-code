type SemVer =
  | number
  | `${number}`
  | `${number}.${number}`
  | `${number}.${number}.${number}`;

// todo: auth
export type Realm = {
  id: string;
  name: string;
  description: string;
  version: SemVer;
  apiUrl: string;
  features?: Record<string, SemVer>;
  settings?: {
    offsetX?: number;
    offsetY?: number;
  };
};
