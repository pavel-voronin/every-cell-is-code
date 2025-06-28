import { RealmSchema } from '@every-cell-is-code/types';
import { RealmConnectionSchema } from './types/realm';

export class Realm {
  private state: 'disconnected' | 'connected' | 'error' = 'disconnected';
  private schema: RealmSchema | null = null;

  constructor(
    public readonly name: string,
    public readonly url: string,
  ) {}

  async connect(): Promise<void> {
    if (this.state === 'connected') {
      console.warn(`Realm ${this.name} is already connected.`);
      return;
    }

    if (this.state === 'error') {
      console.warn(`Realm ${this.name} is in error state. Cannot reconnect.`);
      return;
    }

    try {
      const response = await fetch(this.url);

      if (!response.ok) {
        throw new Error(`Failed to load realm from ${this.url}`);
      }

      this.schema = RealmSchema.parse(await response.json());
      this.state = 'connected';

      console.log(`Realm ${this.name} connected successfully.`);
    } catch (error) {
      console.error(`Error loading realm from ${this.url}:`, error);
      this.state = 'error';
    }
  }

  public getState(): Realm['state'] {
    return this.state;
  }

  public getSchema(): Realm['schema'] {
    return this.schema;
  }
}

export class RealmManager {
  private realms: Map<string, Realm> = new Map();

  public addRealm(connectionSchema: RealmConnectionSchema): Realm {
    const realm = new Realm(connectionSchema.name, connectionSchema.url);
    this.realms.set(connectionSchema.name, realm);
    return realm;
  }

  public getRealm(name: string): Realm | undefined {
    return this.realms.get(name);
  }

  public removeRealm(name: string): void {
    this.realms.delete(name);
  }

  public getRealms(): RealmManager['realms'] {
    return this.realms;
  }
}
