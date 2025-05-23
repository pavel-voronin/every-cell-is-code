import { eventBus } from '../../communications/eventBus';
import { signalBus } from '../../communications/signalBus';
import { XY } from '../../types/base';
import { ISignalsInputComponent } from '../../types/blockComponents';
import { WorkerBackend } from '../backend/workerBackend';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class SignalsInput
  extends BaseComponent
  implements ISignalsInputComponent
{
  protected unloadHandlers: (() => void)[] = [];

  constructor(readonly block: Block) {
    super(block);
    this.subscribeToBlockSignals();
    this.onUnload(() => signalBus.unsubscribe(this.block.xy));
  }

  protected subscribeToBlockSignals() {
    const receiveSignal = (from: XY, payload: unknown) => {
      (this.block.backend as WorkerBackend).worker.postMessage({
        type: 'signal',
        from,
        payload,
      });
    };
    eventBus.on(`block:${this.block.x},${this.block.y}:signal`, receiveSignal);
    this.onUnload(() => {
      eventBus.off(
        `block:${this.block.x},${this.block.y}:signal`,
        receiveSignal,
      );
    });
  }
}
