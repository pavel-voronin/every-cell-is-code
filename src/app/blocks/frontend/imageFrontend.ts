import { IFrontendComponent } from '../../types/blockComponents';
import { ImageFrontendConfig } from '../../types/blocks';
import { BaseComponent } from '../baseComponent';
import { Block } from '../block';
import { resourceLoader } from '../resources/resourceLoader';

export class ImageFrontend extends BaseComponent implements IFrontendComponent {
  element: HTMLImageElement;

  constructor(readonly block: Block) {
    super(block);

    const config = this.block.config.frontend as ImageFrontendConfig;
    const resource = resourceLoader(config.resource);

    this.element = document.createElement('img');
    this.element.onload = () => {
      this.applyImageStyles(config);
    };
    this.element.onerror = () => {
      // todo: rethink when block lifecycle is implemented
      console.error(`Failed to load image: ${resource.url}`);
    };
    this.element.src = resource.url;
    this.onUnload(() => this.element.remove());
  }

  private applyImageStyles(config: ImageFrontendConfig) {
    const scale = config.scale ?? 1.0;
    const anchorX = config.anchorX ?? 'center';
    const anchorY = config.anchorY ?? 'center';
    const offsetX = config.offsetX ?? 0.0;
    const offsetY = config.offsetY ?? 0.0;
    const aspect = config.aspect ?? 'preserve';

    const containerWidth = this.block.container.w;
    const containerHeight = this.block.container.h;

    const imageWidth = this.element.naturalWidth;
    const imageHeight = this.element.naturalHeight;

    let finalWidth: number, finalHeight: number;

    if (aspect === 'fit') {
      finalWidth = containerWidth;
      finalHeight = containerHeight;
    } else {
      // preserve
      const containerAspectRatio = containerWidth / containerHeight;
      const imageAspectRatio = imageWidth / imageHeight;

      if (imageAspectRatio > containerAspectRatio) {
        finalWidth = containerWidth;
        finalHeight = containerWidth / imageAspectRatio;
      } else {
        finalHeight = containerHeight;
        finalWidth = containerHeight * imageAspectRatio;
      }
    }

    finalWidth *= scale;
    finalHeight *= scale;

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    const targetX = centerX + (offsetX * containerWidth) / 2;
    const targetY = centerY + (offsetY * containerHeight) / 2;

    let posX = targetX;
    let posY = targetY;

    if (anchorX === 'left') posX = targetX;
    else if (anchorX === 'center') posX = targetX - finalWidth / 2;
    else if (anchorX === 'right') posX = targetX - finalWidth;

    if (anchorY === 'top') posY = targetY;
    else if (anchorY === 'center') posY = targetY - finalHeight / 2;
    else if (anchorY === 'bottom') posY = targetY - finalHeight;

    const widthPercent = (finalWidth / containerWidth) * 100;
    const heightPercent = (finalHeight / containerHeight) * 100;
    const leftPercent = (posX / containerWidth) * 100;
    const topPercent = (posY / containerHeight) * 100;

    this.element.style.width = `${widthPercent}%`;
    this.element.style.height = `${heightPercent}%`;
    this.element.style.left = `${leftPercent}%`;
    this.element.style.top = `${topPercent}%`;
  }
}
