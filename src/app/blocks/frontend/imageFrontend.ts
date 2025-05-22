import { ImageFrontendConfig } from '../../types/blocks';
import { FrontendComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { resourceLoader } from '../resources/resourceLoader';

export class ImageFrontend implements FrontendComponent {
  element: HTMLImageElement;

  constructor(
    readonly block: Block,
    readonly config: ImageFrontendConfig,
  ) {
    const resource = resourceLoader(this.config.resource);

    this.element = document.createElement('img');
    this.element.src = resource.url;
    if (config.scale) {
      this.element.style.width = `${config.scale * 100}%`;
    }
    if (config.top) {
      this.element.style.top = `${config.top * 100}%`;
    }
    if (config.left) {
      this.element.style.left = `${config.left * 100}%`;
    }
  }

  unload() {
    this.element.remove();
  }
}
