import { IFrontendComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class CanvasFrontend
  extends BaseComponent
  implements IFrontendComponent
{
  element: HTMLCanvasElement;

  constructor(readonly block: Block) {
    super(block);

    this.element = document.createElement('canvas');

    this.element.width = this.block.container.w;
    this.element.height = this.block.container.h;
    this.element.tabIndex = -1;

    const ctx = this.element.getContext('2d')!;

    this.onUnload(() => this.element.remove());

    const { off } = this.block.eventBus.on(`draw`, (bitmap: ImageBitmap) => {
      ctx.drawImage(
        bitmap,
        0,
        0,
        this.block.container.w,
        this.block.container.h,
      );
    });
    this.onUnload(off);
  }
}
