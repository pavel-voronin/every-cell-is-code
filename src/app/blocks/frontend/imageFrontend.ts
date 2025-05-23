import { ImageFrontendConfig } from '../../types/blocks';
import { IFrontendComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { resourceLoader } from '../resources/resourceLoader';
import { BaseComponent } from '../baseComponent';

export class ImageFrontend extends BaseComponent implements IFrontendComponent {
  element: HTMLImageElement;

  constructor(readonly block: Block) {
    super(block);

    const config = this.block.config.frontend as ImageFrontendConfig;
    const resource = resourceLoader(config.resource);

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

    this.onUnload(() => this.element.remove());
  }
}
