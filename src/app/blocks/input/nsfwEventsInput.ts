import { eventBus } from '../../communications/eventBus';
import { EVENT_RETENTION_TIMEOUT } from '../../constants';
import { IEventsInputComponent } from '../../types/blockComponents';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';

export class NSFWEventsInput
  extends BaseComponent
  implements IEventsInputComponent
{
  protected eventIdCounter: number = 0;
  protected rememberedEvents = new Map<
    number,
    { type: string; event: Event; timestamp: number }
  >();

  constructor(readonly block: Block) {
    super(block);

    this.initializeCanvasEventListener();
    this.cleanupOldEvents();
    this.onUnload(() => this.rememberedEvents.clear());
  }

  // Periodically clean up old remembered events
  protected cleanupOldEvents() {
    const cleanupOldEventsInterval = setInterval(() => {
      const now = Date.now();
      for (const [eventId, { timestamp }] of this.rememberedEvents.entries()) {
        if (now - timestamp > EVENT_RETENTION_TIMEOUT) {
          this.rememberedEvents.delete(eventId);
        }
      }
    }, EVENT_RETENTION_TIMEOUT);

    this.onUnload(() => {
      clearInterval(cleanupOldEventsInterval);
    });
  }

  get eventId() {
    return this.eventIdCounter++;
  }

  protected rememberEvent(type: string, eventId: number, e: Event) {
    this.rememberedEvents.set(eventId, {
      type,
      event: e,
      timestamp: Date.now(),
    });
  }

  reEmitEvent(eventId: number) {
    const rememberedEvent = this.rememberedEvents.get(eventId)?.event;

    if (rememberedEvent) {
      eventBus.emit(rememberedEvent.type, rememberedEvent);
      this.rememberedEvents.delete(eventId);
    }
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
