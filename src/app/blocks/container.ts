import { eventBus } from '../communications/eventBus';
import { CELL_SIZE } from '../constants';
import { XY } from '../types/base';
import {
  IContainerComponent,
  IFrontendComponent,
} from '../types/blockComponents';
import { Block } from './block';
import { BaseComponent } from './baseComponent';

export class Container extends BaseComponent implements IContainerComponent {
  container: HTMLDivElement;
  scale: number = 1;

  constructor(readonly block: Block) {
    super(block);

    this.container = document.createElement('div');
    this.container.classList.add('container');
    document.body.appendChild(this.container);
    this.onUnload(() => this.container.remove());

    const { off } = eventBus.sync('camera:moved', this.cameraMovedHandler);
    this.onUnload(off);
  }

  protected cameraMovedHandler = ([x, y]: XY, scale: number) => {
    this.scale = scale;

    const screenX = Math.floor((this.block.x * CELL_SIZE - x) * scale);
    const screenY = Math.floor((this.block.y * CELL_SIZE - y) * scale);
    const screenWidth = Math.floor(this.block.w * CELL_SIZE * scale);
    const screenHeight = Math.floor(this.block.h * CELL_SIZE * scale);

    this.container.style.transform = `translate(${screenX}px, ${screenY}px)`;
    this.container.style.width = `${screenWidth}px`;
    this.container.style.height = `${screenHeight}px`;
  };

  appendFrontend(frontend: IFrontendComponent) {
    this.container.appendChild(frontend.element);
  }

  get w(): number {
    return this.block.w * CELL_SIZE;
  }

  get h(): number {
    return this.block.h * CELL_SIZE;
  }
}
