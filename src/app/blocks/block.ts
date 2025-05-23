import { XY } from '../types/base';
import { BlockConfig } from '../types/blocks';
import {
  IBackendComponent,
  IContainerComponent,
  IFrontendComponent,
  IEventsInputComponent,
  ISignalsInputComponent,
} from '../types/blockComponents';
import { Container } from './container';
import { CanvasFrontend } from './frontend/canvasFrontend';
import { ImageFrontend } from './frontend/imageFrontend';
import { EventsInput } from './input/eventsInput';
import { WorkerBackend } from './backend/workerBackend';
import { SignalsInput } from './input/signalsInput';

export class Block {
  container: IContainerComponent;
  eventsInput: IEventsInputComponent;
  signalsInput: ISignalsInputComponent;
  frontend?: IFrontendComponent;
  backend?: IBackendComponent;

  constructor(readonly config: BlockConfig) {
    this.container = new Container(this);
    this.eventsInput = new EventsInput(this);
    this.signalsInput = new SignalsInput(this);
    this.initFrontend();
    this.initBackend();
  }

  protected initFrontend() {
    if (this.config.frontend.type === 'image') {
      this.frontend = new ImageFrontend(this);
      this.container.appendFrontend(this.frontend);
    } else if (this.config.frontend.type === 'canvas') {
      this.frontend = new CanvasFrontend(this);
      this.container.appendFrontend(this.frontend);
    } else if (this.config.frontend.type === 'none') {
      // No frontend
    }
  }

  protected initBackend() {
    if (this.config.backend.type === 'worker') {
      this.backend = new WorkerBackend(this);
    } else if (this.config.backend.type === 'none') {
      // No backend
    }
  }

  unload() {
    this.backend?.unload();
    this.frontend?.unload();
    this.eventsInput.unload();
    this.signalsInput.unload();
    this.container.unload();
  }

  get xy(): XY {
    return [this.config.x, this.config.y];
  }
  get wh(): XY {
    return [this.config.w, this.config.h];
  }
  get x(): number {
    return this.config.x;
  }
  get y(): number {
    return this.config.y;
  }
  get w(): number {
    return this.config.w;
  }
  get h(): number {
    return this.config.h;
  }
}
