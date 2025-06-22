import { z } from 'zod/v4';

export const ImageResourceSchema = z.object({
  type: z.literal('image'),
  url: z.string(),
});
export type ImageResourceSchema = z.infer<typeof ImageResourceSchema>;

export const WorkerResourceSchema = z.object({
  type: z.literal('worker'),
  url: z.string(),
});
export type WorkerResourceSchema = z.infer<typeof WorkerResourceSchema>;

export const ImageFrontendConfig = z.object({
  type: z.literal('image'),
  resource: ImageResourceSchema,
  aspect: z.enum(['preserve', 'fit']),
  scale: z.optional(z.number()),
  anchorX: z.optional(z.enum(['right', 'center', 'left'])),
  anchorY: z.optional(z.enum(['bottom', 'center', 'top'])),
  offsetX: z.optional(z.number()),
  offsetY: z.optional(z.number()),
});
export type ImageFrontendConfig = z.infer<typeof ImageFrontendConfig>;

export const CanvasFrontendConfig = z.object({
  type: z.literal('canvas'),
});
export type CanvasFrontendConfig = z.infer<typeof CanvasFrontendConfig>;

export const FrontendConfig = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  ImageFrontendConfig,
  CanvasFrontendConfig,
]);
export type FrontendConfig = z.infer<typeof FrontendConfig>;

export const WorkerBackendConfig = z.object({
  type: z.literal('worker'),
  resource: WorkerResourceSchema,
});
export type WorkerBackendConfig = z.infer<typeof WorkerBackendConfig>;

export const BackendConfig = z.discriminatedUnion('type', [
  z.object({ type: z.literal('none') }),
  WorkerBackendConfig,
]);
export type BackendConfig = z.infer<typeof BackendConfig>;

export const BlockEvents = z.object({
  wheel: z.optional(z.literal(true)),
  pointerdown: z.optional(z.literal(true)),
  pointerup: z.optional(z.literal(true)),
  pointermove: z.optional(z.literal(true)),
  keydown: z.optional(z.literal(true)),
  keyup: z.optional(z.literal(true)),
});
export type BlockEvents = z.infer<typeof BlockEvents>;

export const BlockStatusInput = z.object({
  published: z.enum(['draft', 'published']).default('draft'),
  moderation: z
    .enum(['unchecked', 'ok', 'nsfw', 'banned'])
    .default('unchecked'),
});
export type BlockStatusInput = z.infer<typeof BlockStatusInput>;

export const BlockStatus = BlockStatusInput.transform((input) => ({
  ...input,
  runtime: 'active' as 'active' | 'hibernated' | 'terminated',
}));
export type BlockStatus = z.output<typeof BlockStatus>;

export const BlockConfig = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  frontend: FrontendConfig,
  backend: BackendConfig,
  input: z.object({ events: BlockEvents }),
  status: BlockStatusInput,
});
export type BlockConfig = z.infer<typeof BlockConfig>;

export const Chunk = z.array(BlockConfig);
export type Chunk = z.infer<typeof Chunk>;

export const BlockComponentLayout = z.object({
  container: z.enum(['div', 'iframe']).default('div'),
  frontend: z
    .enum(['default', 'nsfw', 'terminated', 'draft', 'banned'])
    .default('default'),
  backend: z.enum(['default', 'none']).default('default'),
  events: z.enum(['default', 'nsfw', 'none']).default('default'),
  signals: z.boolean(),
});
export type BlockComponentLayout = z.infer<typeof BlockComponentLayout>;
