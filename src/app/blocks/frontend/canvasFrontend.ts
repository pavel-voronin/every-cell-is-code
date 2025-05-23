import { IFrontendComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class CanvasFrontend
  extends BaseComponent
  implements IFrontendComponent
{
  element: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(readonly block: Block) {
    super(block);

    this.element = document.createElement('canvas');

    this.element.width = this.block.container.w;
    this.element.height = this.block.container.h;
    this.element.tabIndex = -1;

    this.ctx = this.element.getContext('2d')!;

    this.onUnload(() => this.element.remove());
  }
}
