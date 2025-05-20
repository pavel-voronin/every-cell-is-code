import { CELL_SIZE } from '../constants';
import { eventBus } from '../communications/eventBus';
import { BlockMeta, XY, XYWH } from '../types';
import { IBlock, IRenderable } from './interfaces';

export type ImageBlockMeta = BlockMeta;

export class ImageBlock implements IBlock, IRenderable {
  xy: XY;
  wh: XY;

  element: HTMLImageElement;

  constructor(meta: ImageBlockMeta) {
    this.xy = [meta.x, meta.y];
    this.wh = [meta.w, meta.h];

    this.element = document.createElement('img');
    this.element.src = meta.image_url!;
    this.element.style.pointerEvents = 'none';
    document.body.appendChild(this.element);

    eventBus.sync('camera:moved', this.cameraMovedHandler);
  }

  cameraMovedHandler = ([x, y]: XY, scale: number) => {
    const new_x = Math.floor((this.xy[0] * CELL_SIZE - x) * scale);
    const new_y = Math.floor((this.xy[1] * CELL_SIZE - y) * scale);
    const new_w = Math.floor(this.wh[0] * CELL_SIZE * scale);
    const new_h = Math.floor(this.wh[1] * CELL_SIZE * scale);

    this.position([new_x, new_y, new_w, new_h]);
  };

  position([x, y, w, h]: XYWH) {
    this.element.style.transform = `translate(${x}px, ${y}px)`;
    this.element.style.maxWidth = `${w}px`;
    this.element.style.maxHeight = `${h}px`;
  }

  unload() {
    eventBus.off('camera:moved', this.cameraMovedHandler);
    this.element.remove();
  }
}
