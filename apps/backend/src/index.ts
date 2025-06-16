import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Block, Chunk, RealmSchema } from '@every-cell-is-code/types';
import { configuration } from '../config/main.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod/v4';

const app = new Hono();

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

    return c.json<Block>({ x, y });
  },
);

app.get(`/chunks/:layerId/:x/:y`, (c) => {
  const x = c.req.param('x');
  const y = c.req.param('y');
  return c.json<Chunk>({ x, y });
});

app.get('/connect', (c) => {
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
