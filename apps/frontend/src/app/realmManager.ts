import { RealmSchema } from '@every-cell-is-code/types';
import { config } from './config/main';
import { Realm, RealmConnectionSchema } from './types/realm';

export class RealmManager {
  private realms: Map<string, Realm> = new Map();

  public addDefaultRealms(): void {
    config.defaultRealms?.forEach((realm) => {
      this.addRealm(realm);
    });
  }

  public loadRealm(name: string): void {
    const realm = this.getRealm(name);
    if (!realm) {
      console.error(`Realm with name ${name} does not exist.`);
      return;
    }

    fetch(realm.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load realm from ${realm.url}`);
        }
        return response.json();
      })
      .then((realmSchema: RealmSchema) => {
        // todo: validate
        this.populateRealm(name, realmSchema);
        realm.state = 'connected';
      })
      .catch((error) => {
        console.error(`Error loading realm from ${realm.url}:`, error);
        realm.state = 'error';
      });
  }

  public addRealm(connectionSchema: RealmConnectionSchema): void {
    this.realms.set(connectionSchema.name, {
      ...connectionSchema,
      schema: null,
      state: 'disconnected',
    });
  }

  public getRealm(name: string): Realm | undefined {
    return this.realms.get(name);
  }

  public removeRealm(name: string): void {
    this.realms.delete(name);
  }

  public listRealms(): string[] {
    return Array.from(this.realms.keys());
  }

  private populateRealm(name: string, schema: RealmSchema): void {
    const realm = this.getRealm(name);
    if (!realm) {
      console.error(`Realm with name ${name} does not exist.`);
      return;
    }

    realm.schema = schema;
  }
}
