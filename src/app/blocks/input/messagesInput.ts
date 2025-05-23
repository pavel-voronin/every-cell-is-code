import { eventBus } from '../../communications/eventBus';
import messageBus from '../../communications/messageBus';
import { XY } from '../../types/base';
import { IMessagesInputComponent } from '../../types/blockComponents';
import { WorkerBackend } from '../backend/workerBackend';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class MessagesInput
  extends BaseComponent
  implements IMessagesInputComponent
{
  protected unloadHandlers: (() => void)[] = [];

  constructor(readonly block: Block) {
    super(block);
    this.subscribeToBlockMessages();
    this.onUnload(() => messageBus.unsubscribe(this.block.xy));
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
}
