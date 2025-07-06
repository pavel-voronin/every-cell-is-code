import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Chunk, Realm } from '@every-cell-is-code/types';
import { configuration } from '../config/main.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod/v4';
import { getBlockUrl } from './services/s3.js';

const app = new Hono();

// Enable CORS for all routes and origins (temporary solution)
app.use('*', cors({ origin: '*' }));

// Create API router with /api prefix
const apiRouter = new Hono().basePath('/api');

apiRouter.get(
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

apiRouter.get(
  `/chunks/:layer/:x/:y`,
  zValidator(
    'param',
    z.object({
      layer: z.coerce.number().pipe(z.int()),
      x: z.coerce.number().pipe(z.int()),
      y: z.coerce.number().pipe(z.int()),
    }),
  ),
  (c) => {
    const params = c.req.valid('param');

    const layer = params.layer;
    const x = params.x;
    const y = params.y;

    return c.json<Chunk>({ layer, x, y });
  },
);

apiRouter.get('/connect', (c) => {
  const schema: Realm = {
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

  return c.json<Realm>(schema);
});

// Mount the API router
app.route('/', apiRouter);

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
