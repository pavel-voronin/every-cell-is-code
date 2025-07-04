import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Chunk, RealmSchema } from '@every-cell-is-code/types';
import { configuration } from '../config/main.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod/v4';
import { getBlockUrl } from './services/s3.js';

const app = new Hono();

// Enable CORS for all routes and origins (temporary solution)
app.use('*', cors({ origin: '*' }));

app.get(
  `/blocks/:x/:y`,
  zValidator(
    'param',
    z.object({
      x: z.coerce.number().pipe(z.int()),
      y: z.coerce.number().pipe(z.int()),
    }),
  ),
  (c) => {
    const params = c.req.valid('param');

    const { x, y } = params;

    return c.text(getBlockUrl(x, y)); // temporary solution, just demonstration purpose
  },
);

app.get(
  `/chunks/:layerId/:x/:y`,
  zValidator(
    'param',
    z.object({
      layerId: z.coerce.number().pipe(z.int()),
      x: z.coerce.number().pipe(z.int()),
      y: z.coerce.number().pipe(z.int()),
    }),
  ),
  (c) => {
    const params = c.req.valid('param');

    const layerId = params.layerId;
    const x = params.x;
    const y = params.y;

    return c.json<Chunk>({ layerId, x, y });
  },
);

app.get('/api/connect', (c) => {
  const schema: RealmSchema = {
    schemaVersion: 1,
    name: configuration.name,
    description: configuration.description,
    // todo: compile time
    blocks: {
      frontend: {
        image: 1,
        canvas: 1,
      },
      backend: {
        worker: '1',
      },
    },
    layers: configuration.layers,
    apiUrl: configuration.publicUrl,
  };

  return c.json<RealmSchema>(schema);
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
