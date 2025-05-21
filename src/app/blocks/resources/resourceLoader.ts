import { ImageResource } from './imageResource';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resourceLoader = (config: any) => {
  switch (config.type) {
    case 'image':
      return new ImageResource(config.url);
    default:
      throw new Error(`Unknown resource type: ${config.type}`);
  }
};
