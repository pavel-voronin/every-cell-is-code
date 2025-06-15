import type { Configuration } from '../types/configuration.js';

export const configuration: Configuration = {
  name: 'Example Realm',
  description: 'An example realm for demonstration purposes.',
  layers: [
    {
      covers: { width: 16, height: 16 },
      presence: 'full',
    },
    {
      covers: { width: 16, height: 16 },
      presence: 'bitmask',
      subscribe: 'websocket',
    },
  ],
};
