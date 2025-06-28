import { z } from 'zod/v4';

export const SemVer = z.union([
  z.number(),
  z.string().regex(new RegExp(/^(\d+|\d+\.\d+|\d+\.\d+\.\d+)$/)),
]);
export type SemVer = z.infer<typeof SemVer>;

export const BlockDescriptor = z.union([
  SemVer,
  z.object({ version: SemVer }).catchall(z.unknown()),
]);
export type BlockDescriptor = z.infer<typeof BlockDescriptor>;

export const Layer = z.object({
  covers: z.object({ width: z.number(), height: z.number() }),
  offset: z.optional(z.object({ x: z.number(), y: z.number() })),
  presence: z.enum(['full', 'bitmask', 'bloom']),
  subscribe: z.optional(z.enum(['poll', 'websocket', 'sse', 'none'])),
});
export type Layer = z.infer<typeof Layer>;

export const RealmSchemaV1 = z.object({
  // meta
  schemaVersion: SemVer,
  name: z.string(),
  description: z.string(),
  // structure
  blocks: z.object({
    frontend: z.record(z.string(), BlockDescriptor).optional(),
    backend: z.record(z.string(), BlockDescriptor).optional(),
    container: z.record(z.string(), BlockDescriptor).optional(),
    events: z.record(z.string(), BlockDescriptor).optional(),
    signals: z.record(z.string(), BlockDescriptor).optional(),
  }),
  layers: z.array(Layer),
  // communication (tbd)
  apiUrl: z.string(),
});
export type RealmSchemaV1 = z.infer<typeof RealmSchemaV1>;

export const RealmSchema = RealmSchemaV1;
export type RealmSchema = z.infer<typeof RealmSchema>;
