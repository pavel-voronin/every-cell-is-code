import { XY, XYWH } from '../types';

export interface IBlock {
  xy: XY;
  wh: XY;
  unload: () => void;
}

export interface IRenderable {
  element: HTMLElement;
  position: (xywh: XYWH) => void;
}
