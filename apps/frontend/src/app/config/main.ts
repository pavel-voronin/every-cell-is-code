interface Config {
  realmUrl: string;
}

export const config: Config = {
  realmUrl: import.meta.env.VITE_REALM_URL || 'http://localhost:3000/',
};
