import { BlockManager } from './blockManager';
import { MetaManager } from './metaManager';
import { GridManager } from './gridManager';
import { eventBus } from './communications/eventBus';

export class App {
  protected gridManager: GridManager;
  protected metaManager = new MetaManager();
  protected blockManager: BlockManager;

  constructor(protected canvas: HTMLCanvasElement) {
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

    this.blockManager = new BlockManager(this.metaManager);

    ('__PRELOAD_CHUNKS__'); // eslint-disable-line @typescript-eslint/no-unused-expressions

    this.gridManager = new GridManager(canvas, [3, 3]);
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
}
