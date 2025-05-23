import { eventBus } from '../../communications/eventBus';
import messageBus from '../../communications/messageBus';
import { XY } from '../../types/base';
import { MessagesInputComponent } from '../../types/blockComponents';
import { WorkerBackend } from '../backend/workerBackend';
import { Block } from '../block';

export class MessagesInput implements MessagesInputComponent {
  protected unloadHandlers: (() => void)[] = [];

  constructor(readonly block: Block) {
    this.subscribeToBlockMessages();
  }

  protected subscribeToBlockMessages() {
    const receiveMessage = (from: XY, payload: unknown) => {
      (this.block.backend as WorkerBackend).worker.postMessage({
        type: 'message',
        from,
        payload,
      });
    };
    eventBus.on(
      `block:${this.block.x},${this.block.y}:message`,
      receiveMessage,
    );
    this.onUnload(() => {
      eventBus.off(
        `block:${this.block.x},${this.block.y}:message`,
        receiveMessage,
      );
    });
  }

  protected onUnload(handler: () => void) {
    this.unloadHandlers.push(handler);
  }

  unload() {
    this.unloadHandlers.forEach((handler) => handler());
    messageBus.unsubscribe(this.block.xy);
  }
}
