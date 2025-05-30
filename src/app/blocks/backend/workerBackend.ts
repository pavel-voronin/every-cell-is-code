import { eventBus } from '../../communications/eventBus';
import { signalBus } from '../../communications/signalBus';
import { XY } from '../../types/base';
import { IBackendComponent } from '../../types/blockComponents';
import { WorkerBackendConfig } from '../../types/blocks';
import { Block } from '../block';
import { BaseComponent } from '../baseComponent';
import { resourceLoader } from '../resources/resourceLoader';

export class WorkerBackend extends BaseComponent implements IBackendComponent {
  worker: Worker;

  constructor(readonly block: Block) {
    super(block);

    const config = this.block.config.backend as WorkerBackendConfig;
    const resource = resourceLoader(config.resource);

    this.worker = new Worker(resource.url);

    this.initializeWorkerEventListeners();

    this.worker.postMessage({
      type: 'init',
      width: this.block.container.w,
      height: this.block.container.h,
      targetFPS: 60,
      origin: this.block.xy,
    });

    const { off } = eventBus.on(
      `block:${this.block.xy.join(',')}:message`,
      (message: unknown, options?: StructuredSerializeOptions) =>
        this.worker.postMessage(message, options),
    );
    this.onUnload(off);

    this.onUnload(() => this.worker.terminate());
  }

  protected initializeWorkerEventListeners() {
    this.worker.addEventListener('message', (e: MessageEvent) => {
      e.data.payload ??= {};

      switch (e.data.type) {
        case 'draw':
          eventBus.emit(
            `block:${this.block.xy.join(',')}:draw`,
            e.data.payload.bitmap,
          );
          break;
        case 'terminate':
          eventBus.emit('block:terminate', this.block.xy);
          break;
        case 'subscribe': {
          const { to, topic, radius } = e.data as MessageEvent<{
            to?: XY;
            topic?: string;
            radius?: number;
          }>['data'];

          if (!to && !topic) {
            signalBus.subscribe(this.block.xy, {
              to: this.block.xy,
              radius: radius ?? 0,
            });
          } else {
            signalBus.subscribe(this.block.xy, {
              to,
              topic,
              radius: radius ?? 0,
            });
          }
          break;
        }
        case 'signal': {
          const { to, topic, radius, payload } = e.data as MessageEvent<{
            to?: XY;
            topic?: string;
            radius?: number;
            payload: unknown;
          }>['data'];

          if (!to && !topic) {
            throw new Error('No target or topic specified for signal event');
          }

          signalBus.send(
            this.block.xy,
            {
              to,
              topic,
              radius: radius ?? 0,
            },
            payload,
          );
          break;
        }
        case 're-emit':
          if (
            e.data.payload.eventId !== undefined &&
            typeof e.data.payload.eventId === 'number'
          ) {
            this.block.eventsInput.reEmitEvent(e.data.payload.eventId);
          }
          break;
      }
    });

    this.worker.addEventListener('error', (e: ErrorEvent) => {
      eventBus.emit('block:worker-error', this.block.xy, e);
    });

    this.worker.addEventListener('messageerror', (e: MessageEvent) => {
      eventBus.emit('block:worker-messageerror', this.block.xy, e);
    });
  }
}
