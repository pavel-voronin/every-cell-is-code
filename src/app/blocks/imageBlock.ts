import { BlockManager } from '../blockManager';
import { CELL_SIZE } from '../constants';
import { Context } from '../context';
import { eventBus } from '../eventBus';
import { BlockMeta, XY } from '../types';
import { Block } from './interfaces';

export class ImageBlock implements Block {
  public xy: XY;
  public w: number;
  public h: number;

  protected scale: number = 1.0;
  protected image: HTMLImageElement;

  constructor(
    protected context: Context,
    protected blockManager: BlockManager,
    meta: BlockMeta,
  ) {
    this.xy = [meta.x, meta.y];
    this.w = meta.w;
    this.h = meta.h;
    this.image = context.createImageElement();
    this.image.src = meta.image_url!;
    this.image.style.pointerEvents = 'none';

    eventBus.sync('camera:moved', ([x, y]: XY, scale: number) => {
      this.scale = scale;

      const new_x = Math.floor((this.xy[0] * CELL_SIZE - x) * scale);
      const new_y = Math.floor((this.xy[1] * CELL_SIZE - y) * scale);
      const new_w = Math.floor(this.w * CELL_SIZE * scale);
      const new_h = Math.floor(this.h * CELL_SIZE * scale);

      this.setImagePosition(new_x, new_y, new_w, new_h);
    });
  }

  async setImagePosition(x: number, y: number, w: number, h: number) {
    this.image.style.transform = `translate(${x}px, ${y}px)`;
    this.image.style.maxWidth = `${w}px`;
    this.image.style.maxHeight = `${h}px`;
  }

  unload() {
    this.image.remove();
  }
}
