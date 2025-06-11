import { signalBus } from '../../communications/signalBus';
import { XY } from '../../types/utils';
import { ISignalsInputComponent } from '../../types/blockComponents';
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
      this.block.eventBus.emit(`message`, {
        type: 'signal',
        from,
        payload,
      });
    };
    const { off } = this.block.eventBus.on(`signal`, receiveSignal);
    this.onUnload(off);
  }
}
