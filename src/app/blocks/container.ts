import { eventBus } from '../communications/eventBus';
import { CELL_SIZE } from '../constants';
import { XY } from '../types/base';
import {
  ContainerComponent,
  FrontendComponent,
} from '../types/blockComponents';
import { Block } from './block';

export class Container implements ContainerComponent {
  container: HTMLDivElement;
  scale: number = 1;

  constructor(protected block: Block) {
    this.container = document.createElement('div');
    this.container.classList.add('container');

    document.body.appendChild(this.container);

    eventBus.sync('camera:moved', this.cameraMovedHandler);
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

  appendFrontend(frontend: FrontendComponent) {
    this.container.appendChild(frontend.element);
  }

  unload() {
    eventBus.off('camera:moved', this.cameraMovedHandler);
    this.container.remove();
  }

  get w(): number {
    return this.block.w * CELL_SIZE;
  }

  get h(): number {
    return this.block.h * CELL_SIZE;
  }
}
