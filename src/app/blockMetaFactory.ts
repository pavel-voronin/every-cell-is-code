import { BlockEvents, BlockMeta, RawBlockMeta } from './types';

export type ImageBlockMeta = BlockMeta & { image_url: string };
export type TemplatedWorkerBlockMeta = BlockMeta & { src: string };

function resolveBlockEvents(events: RawBlockMeta['events'] = {}): BlockEvents {
  return {
    wheel: events?.wheel ?? events?.all ?? false,
    pointerdown: events?.pointerdown ?? events?.all ?? false,
    pointerup: events?.pointerup ?? events?.all ?? false,
    pointermove: events?.pointermove ?? events?.all ?? false,
    keydown: events?.keydown ?? events?.all ?? false,
    keyup: events?.keyup ?? events?.all ?? false,
  };
}

export function toImageBlockMeta(raw: RawBlockMeta): ImageBlockMeta {
  return {
    type: raw.type,
    x: raw.x,
    y: raw.y,
    w: raw.w,
    h: raw.h,
    url: raw.url,
    events: resolveBlockEvents(raw.events),
    image_url: raw.image_url || '',
  };
}

export function toTemplatedWorkerBlockMeta(
  raw: RawBlockMeta,
): TemplatedWorkerBlockMeta {
  return {
    type: raw.type,
    x: raw.x,
    y: raw.y,
    w: raw.w,
    h: raw.h,
    url: raw.url,
    events: resolveBlockEvents(raw.events),
    src: raw.src || '',
  };
}

export type BlockMetaConverter = (raw: RawBlockMeta) => BlockMeta;

export const blockMetaConverters: Record<string, BlockMetaConverter> = {
  image: toImageBlockMeta,
  templated_worker: toTemplatedWorkerBlockMeta,
};
