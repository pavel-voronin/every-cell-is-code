import { WorkerMessage, XY, XYWH } from '../types';

export interface IBlock {
  xy: XY;
  wh: XY;
  unload: () => void;
}

export interface IRenderable {
  element: HTMLElement;
  position: (xywh: XYWH) => void;
}

export interface ReceivesMessage {
  postMessage(
    message: WorkerMessage,
    options?: StructuredSerializeOptions,
  ): void;
}

export function doesReceiveMessage(obj: unknown): obj is ReceivesMessage {
  return typeof (obj as ReceivesMessage).postMessage === 'function';
}
