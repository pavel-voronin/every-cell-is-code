import { BlockManager } from './blockManager';
import { MetaManager } from './metaManager';
import { GridManager } from './gridManager';
import { eventBus } from './communications/eventBus';
import { DEFAULT_COORDS } from './constants';
import { XY } from './types/utils';
import { config } from './config/main';
import { Realm } from './realm';

type AppState = 'not initialized' | 'initialized';

export class App {
  protected state: AppState = 'not initialized';
  protected gridManager!: GridManager;
  protected metaManager = new MetaManager();
  protected blockManager!: BlockManager;
  protected realm!: Realm;
  private ignoreNextHashChange = false;

  constructor(protected canvas: HTMLCanvasElement) {}

  async init(): Promise<void> {
    // Browser specific preparations

    this.stopTouchEvents();

    window.addEventListener('resize', (e: Event) => {
      eventBus.emit(
        'window:resize',
        (e.target as Window).innerWidth,
        (e.target as Window).innerHeight,
      );
    });
    window.dispatchEvent(new Event('resize'));

    // App specific preparations

    this.realm = new Realm(config.realmUrl);
    await this.realm.connect();

    this.blockManager = new BlockManager(this.metaManager);

    const initialCoords = this.getCoordsFromHash() ?? DEFAULT_COORDS;
    this.gridManager = new GridManager(this.canvas, initialCoords);

    eventBus.on('grid:center-changed', ([x, y]: XY) => {
      const hash = `#x=${x}&y=${y}`;
      if (window.location.hash !== hash) {
        this.ignoreNextHashChange = true;
        history.replaceState(null, '', hash);
      }
    });

    window.addEventListener('hashchange', () => {
      if (this.ignoreNextHashChange) {
        this.ignoreNextHashChange = false;
        return;
      }
      const coords = this.getCoordsFromHash();
      if (!coords) return;
      const current = this.gridManager.xy;
      if (!current || current[0] !== coords[0] || current[1] !== coords[1]) {
        this.gridManager.moveTo(coords);
      }
    });

    this.state = 'initialized';
  }

  protected getCoordsFromHash(): XY | undefined {
    const hash = window.location.hash;
    const match = /#x=(-?\d+)&y=(-?\d+)/.exec(hash);
    if (match) {
      return [parseInt(match[1], 10), parseInt(match[2], 10)];
    }
    return undefined;
  }

  protected stopTouchEvents() {
    document.addEventListener('touchstart', (e) => e.preventDefault(), {
      passive: false,
      capture: true,
    });
    document.addEventListener('touchmove', (e) => e.preventDefault(), {
      passive: false,
      capture: true,
    });
    document.addEventListener(
      'touchend',
      (e: TouchEvent) => {
        e.preventDefault();
        // check if type of target is <a> then pass event to it
        if (e.target && (e.target as HTMLElement).tagName === 'A') {
          (e.target as HTMLAnchorElement).click();
          return;
        }
      },
      { passive: false, capture: true },
    );
    document.addEventListener('touchcancel', (e) => e.preventDefault(), {
      passive: false,
      capture: true,
    });
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(state: AppState): void {
    this.state = state;
  }
}
