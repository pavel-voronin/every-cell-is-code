import messageBus from '../../communications/messageBus';
import { XY } from '../../types/base';
import { BackendComponent } from '../../types/blockComponents';
import { WorkerBackendConfig } from '../../types/blocks';
import { Block } from '../block';
import { CanvasFrontend } from '../frontend/canvasFrontend';

export class WorkerBackend implements BackendComponent {
  worker: Worker;

  constructor(
    readonly block: Block,
    readonly config: WorkerBackendConfig,
  ) {
    // if (this.src) {
    //   this.worker = new Worker(
    //     URL.createObjectURL(
    //       new Blob([this.src], { type: 'application/javascript' }),
    //     ),
    //   );
    // } else
    this.worker = new Worker(this.config.resource.url);

    this.initializeWorkerEventListeners();

    this.worker.postMessage({
      type: 'init',
      width: this.block.container.w,
      height: this.block.container.h,
      targetFPS: 60,
      origin: this.block.xy,
    });
  }

  protected initializeWorkerEventListeners() {
    this.worker.addEventListener('message', (e: MessageEvent) => {
      e.data.payload ??= {};

      switch (e.data.type) {
        case 'draw':
          (this.block.frontend as CanvasFrontend).ctx.drawImage(
            e.data.payload.bitmap as ImageBitmap,
            0,
            0,
            this.block.container.w,
            this.block.container.h,
          );
          break;
        // case 'terminate':
        //   eventBus.emit('block:terminate', this.xy);
        //   break;
        case 'subscribe': {
          const { to, topic, radius } = e.data as MessageEvent<{
            to?: XY;
            topic?: string;
            radius?: number;
          }>['data'];

          if (!to && !topic) {
            messageBus.subscribe(this.block.xy, {
              to: this.block.xy,
              radius: radius ?? 0,
            });
          } else {
            messageBus.subscribe(this.block.xy, {
              to,
              topic,
              radius: radius ?? 0,
            });
          }
          break;
        }
        case 'message': {
          const { to, topic, radius, payload } = e.data as MessageEvent<{
            to?: XY;
            topic?: string;
            radius?: number;
            payload: unknown;
          }>['data'];

          if (!to && !topic) {
            throw new Error('No target or topic specified for message event');
          }

          messageBus.send(
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
        // case 're-emit':
        //   if (
        //     e.data.payload.eventId &&
        //     typeof e.data.payload.eventId === 'number'
        //   ) {
        //     this.reEmitEvent(e.data.payload.eventId);
        //   }
        //   break;
      }
    });

    // this.worker.addEventListener('error', (e: ErrorEvent) => {
    //   eventBus.emit('block:worker-error', this.xy, e);
    // });

    // this.worker.addEventListener('messageerror', (e: MessageEvent) => {
    //   eventBus.emit('block:worker-messageerror', this.xy, e);
    // });
  }

  // protected reEmitEvent(eventId: number) {
  //   const rememberedEvent = this.rememberedEvents.get(eventId)?.event;

  //   if (rememberedEvent) {
  //     eventBus.emit(rememberedEvent.type, rememberedEvent);
  //     this.rememberedEvents.delete(eventId);
  //   }
  // }

  // postMessage(message: any, options?: StructuredSerializeOptions) {
  //   this.worker.postMessage(message, options);
  // }

  unload(): void {
    this.worker.terminate();
  }
}
