import { ImageResourceSchema, WorkerResourceSchema } from '../../types/blocks';
import { ImageResource } from './imageResource';
import { WorkerResource } from './workerResource';

export function resourceLoader(config: WorkerResourceSchema): WorkerResource;
export function resourceLoader(config: ImageResourceSchema): ImageResource;
export function resourceLoader(
  config: ImageResourceSchema | WorkerResourceSchema,
) {
  switch (config.type) {
    case 'image':
      return new ImageResource(config.url);
    case 'worker':
      return new WorkerResource(config.url);
    default:
      throw new Error(`Unknown resource type: ${config['type']}`);
  }
}
