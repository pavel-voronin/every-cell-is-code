import { IFrontendComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class DraftFrontend extends BaseComponent implements IFrontendComponent {
  element: HTMLCanvasElement;

  constructor(readonly block: Block) {
    super(block);

    this.element = document.createElement('canvas');
    this.onUnload(() => this.element.remove());

    this.element.width = this.block.container.w;
    this.element.height = this.block.container.h;
    this.element.tabIndex = -1;

    const ctx = this.element.getContext('2d')!;

    ctx.fillStyle = 'gray';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '18px Arial';
    ctx.fillText(
      'Draft',
      this.block.container.w / 2,
      this.block.container.h / 2,
    );
  }
}
