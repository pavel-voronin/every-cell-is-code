import { RealmConnectionSchema } from '../types/realm';

interface Config {
  apiUrl: string;
  defaultRealms?: RealmConnectionSchema[];
}

export const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:9000/',
  defaultRealms: [
    {
      name: 'Example Realm',
      url: 'http://localhost:3000/connect',
    },
  ],
};
