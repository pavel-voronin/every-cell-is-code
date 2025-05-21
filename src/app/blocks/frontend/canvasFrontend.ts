import { CanvasFrontendConfig } from '../../types/blocks';
import { FrontendComponent } from '../../types/blockComponents';
import { Block } from '../block';

export class CanvasFrontend implements FrontendComponent {
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(
    readonly block: Block,
    readonly config: CanvasFrontendConfig,
  ) {
    this.element = document.createElement('canvas');

    this.element.width = this.block.container.w;
    this.element.height = this.block.container.h;
    this.element.tabIndex = -1;
    this.element.style.position = 'absolute';
    this.element.style.pointerEvents = 'all';
    this.element.style.zIndex = '1';
    this.element.style.width = `100%`;
    this.element.style.height = `100%`;

    this.ctx = this.element.getContext('2d')!;
  }

  unload() {
    this.element.remove();
  }
}
