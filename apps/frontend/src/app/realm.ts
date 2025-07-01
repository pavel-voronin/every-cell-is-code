import { RealmSchema } from '@every-cell-is-code/types';

export class Realm {
  protected _schema: RealmSchema | null = null;

  constructor(public readonly url: string) {}

  async connect(): Promise<void> {
    try {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new Error(`Failed to load realm from ${this.url}`);
      }

      this._schema = RealmSchema.parse(await response.json());

      console.log(`Realm connected successfully.`);
    } catch (error) {
      console.error(`Error loading realm from ${this.url}:`, error);
      throw error;
    }
  }

  get schema(): Realm['_schema'] {
    return this._schema;
  }
}
