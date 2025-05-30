import { XY } from '../types/base';
import {
  BlockConfig,
  BlockStatus,
  BlockComponentLayout,
} from '../types/blocks';
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
import { TerminatedFrontend } from './frontend/terminatedFrontend';

export class Block {
  public status!: BlockStatus;
  public state!: BlockComponentLayout;

  container!: IContainerComponent;
  eventsInput?: IEventsInputComponent;
  signalsInput?: ISignalsInputComponent;
  frontend?: IFrontendComponent;
  backend?: IBackendComponent;

  constructor(readonly config: BlockConfig) {
    this.status = {
      ...this.config.status,
      runtime: 'active', // todo: manage it
    };
    this.computeBlockComponentLayout();
    this.initComponents();
  }

  setStatus<K extends keyof BlockStatus>(axis: K, value: BlockStatus[K]): void {
    this.status[axis] = value;
    this.computeBlockComponentLayout();
    this.initComponents();
  }

  protected initComponents() {
    this.unload();

    this.container = new Container(this);
    if (this.state.interactive) {
      this.eventsInput = new EventsInput(this);
    }
    this.signalsInput = new SignalsInput(this);
    this.initFrontend();
    this.initBackend();
  }

  protected initFrontend() {
    if (this.state.frontend === 'terminated') {
      this.frontend = new TerminatedFrontend(this);
      this.container!.appendFrontend(this.frontend);
      return;
    } else if (this.state.frontend === 'default') {
      if (this.config.frontend.type === 'image') {
        this.frontend = new ImageFrontend(this);
        this.container!.appendFrontend(this.frontend);
      } else if (this.config.frontend.type === 'canvas') {
        this.frontend = new CanvasFrontend(this);
        this.container!.appendFrontend(this.frontend);
      } else if (this.config.frontend.type === 'none') {
        // No frontend
      }
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
    if (this.backend) this.backend.unload();
    if (this.frontend) this.frontend.unload();
    if (this.eventsInput) this.eventsInput.unload();
    if (this.signalsInput) this.signalsInput.unload();
    if (this.container) this.container.unload();
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

  // todo: add global/user ctx/preferences
  // userPreferences: {
  //   showNSFW?: boolean;
  // } = {},
  computeBlockComponentLayout() {
    if (this.status.runtime === 'terminated') {
      this.state = {
        frontend: 'terminated',
        backend: 'none',
        interactive: false,
      };
    } else {
      this.state = {
        frontend: 'default',
        backend: 'default',
        interactive: true,
      };
    }
  }
}
