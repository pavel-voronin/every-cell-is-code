import { RealmSchema } from '@every-cell-is-code/types';

export type RealmConnectionSchema = {
  name: string;
  url: string;
};

export type Realm = RealmConnectionSchema & {
  schema: RealmSchema | null;
  state: 'disconnected' | 'connected' | 'error';
};
