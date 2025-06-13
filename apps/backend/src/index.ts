import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { RealmSchema } from '@every-cell-is-code/types';

const app = new Hono();

app.get('/connect', (c) => {
  const schema: RealmSchema = {
    schemaVersion: 1,
    name: 'Example Realm',
    description: 'An example realm for demonstration purposes.',
    apiUrl: 'http://api.example.com/realm',
    supportedBlocks: {
      imageFrontend: 1,
      workerBackend: '1.',
    },
    layers: [
      {
        index: 0,
        name: 'Chunk Layer',
        type: 'grid',
        cellSize: 16,
      },
      {
        index: 1,
        name: 'Aggregate Layer',
        type: 'aggregate',
        covers: { layer: 0, width: 16, height: 16 },
        presence: 'bitmask',
        subscribe: 'websocket',
      },
    ],
  };

  return c.json(schema);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
