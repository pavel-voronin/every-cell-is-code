import { WorkerMessage } from '../types';

export interface Block {
  unload: () => void;
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
