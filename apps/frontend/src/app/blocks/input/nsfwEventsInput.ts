import { eventBus } from '../../communications/eventBus';
import { IEventsInputComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class NSFWEventsInput
  extends BaseComponent
  implements IEventsInputComponent
{
  protected eventIdCounter: number = 0;

  constructor(readonly block: Block) {
    super(block);

    this.initializeCanvasEventListener();
  }

  get eventId() {
    return this.eventIdCounter++;
  }

  get config() {
    return this.block.config.input.events;
  }

  protected initializeCanvasEventListener() {
    // pointerdown

    const pointerDown = () => {
      this.block.setStatus('moderation', 'ok');
    };

    this.block.container.container.addEventListener('pointerdown', pointerDown);
    this.onUnload(() => {
      this.block.container.container.removeEventListener(
        'pointerdown',
        pointerDown,
      );
    });

    // wheel

    const wheel = (e: WheelEvent) => {
      eventBus.emit('wheel', new WheelEvent(e.type, e));
    };
    this.block.container.container.addEventListener('wheel', wheel);
    this.onUnload(() => {
      this.block.container.container.removeEventListener('wheel', wheel);
    });
  }
}
