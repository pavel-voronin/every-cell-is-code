import { XY } from '../types/utils';
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
import { DivContainer } from './container/divContainer';
import { CanvasFrontend } from './frontend/canvasFrontend';
import { ImageFrontend } from './frontend/imageFrontend';
import { EventsInput } from './input/eventsInput';
import { WorkerBackend } from './backend/workerBackend';
import { SignalsInput } from './input/signalsInput';
import { TerminatedFrontend } from './frontend/terminatedFrontend';
import { BannedFrontend } from './frontend/bannedFrontend';
import { DraftFrontend } from './frontend/draftFrontend';
import { NSFWFrontend } from './frontend/nsfwFrontend';
import { NSFWEventsInput } from './input/nsfwEventsInput';
import { EventBus } from '../communications/eventBus';

export class Block {
  public status!: BlockStatus;
  public state!: BlockComponentLayout;
  public readonly eventBus = new EventBus();

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

    this.initContainer();
    this.initEventsInput();
    this.initSignalsInput();
    this.initFrontend();
    this.initBackend();
  }

  protected initContainer() {
    if (this.state.container === 'div') {
      this.container = new DivContainer(this);
    } else {
      // 'iframe'
    }
  }

  protected initEventsInput() {
    if (this.state.events === 'default') {
      this.eventsInput = new EventsInput(this);
    } else if (this.state.events === 'nsfw') {
      this.eventsInput = new NSFWEventsInput(this);
    } else if (this.state.events === 'none') {
      // No events input
    }
  }

  protected initSignalsInput() {
    if (this.state.signals) {
      this.signalsInput = new SignalsInput(this);
    }
  }

  protected initFrontend() {
    if (this.state.frontend === 'banned') {
      this.frontend = new BannedFrontend(this);
      this.container!.appendFrontend(this.frontend);
      return;
    } else if (this.state.frontend === 'draft') {
      this.frontend = new DraftFrontend(this);
      this.container!.appendFrontend(this.frontend);
      return;
    } else if (this.state.frontend === 'terminated') {
      this.frontend = new TerminatedFrontend(this);
      this.container!.appendFrontend(this.frontend);
      return;
    } else if (this.state.frontend === 'nsfw') {
      this.frontend = new NSFWFrontend(this);
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
    if (this.status.moderation === 'nsfw') {
      this.state = {
        container: 'div',
        frontend: 'nsfw',
        backend: 'none',
        events: 'nsfw',
        signals: false,
      };
    } else if (this.status.moderation === 'banned') {
      this.state = {
        container: 'div',
        frontend: 'banned',
        backend: 'none',
        events: 'none',
        signals: false,
      };
    } else if (this.status.runtime === 'terminated') {
      this.state = {
        container: 'div',
        frontend: 'terminated',
        backend: 'none',
        events: 'none',
        signals: false,
      };
    } else if (this.status.published === 'draft') {
      this.state = {
        container: 'div',
        frontend: 'draft',
        backend: 'none',
        events: 'none',
        signals: false,
      };
    } else {
      this.state = {
        container: 'div',
        frontend: 'default',
        backend: 'default',
        events: 'default',
        signals: true,
      };
    }
  }
}
