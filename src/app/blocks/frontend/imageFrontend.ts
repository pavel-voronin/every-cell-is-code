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
  }

  unload() {
    this.element.remove();
  }
}
