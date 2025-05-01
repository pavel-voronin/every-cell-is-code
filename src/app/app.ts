import { BlockManager } from './blockManager';
import { MetaStore } from './metaStore';
import { GridManager } from './gridManager';
import { eventBus } from './eventBus';
import { Context } from './context';

export class App {
  protected gridManager: GridManager;
  protected metaStore = new MetaStore();
  protected blockManager: BlockManager;

  constructor(
    protected context: Context,
    protected canvas: HTMLCanvasElement,
  ) {
    // Browser specific preparations

    this.stopTouchEvents();

    this.context.window.addEventListener('resize', (e: Event) => {
      eventBus.emit(
        'window:resize',
        (e.target as Window).innerWidth,
        (e.target as Window).innerHeight,
      );
    });
    this.context.window.dispatchEvent(new Event('resize'));

    // App specific preparations

    this.blockManager = new BlockManager(this.context, this.metaStore);
    this.gridManager = new GridManager(canvas, [3, 3]);
  }

  protected stopTouchEvents() {
    this.context.document.addEventListener(
      'touchstart',
      (e) => e.preventDefault(),
      { passive: false, capture: true },
    );
    this.context.document.addEventListener(
      'touchmove',
      (e) => e.preventDefault(),
      { passive: false, capture: true },
    );
    this.context.document.addEventListener(
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
    this.context.document.addEventListener(
      'touchcancel',
      (e) => e.preventDefault(),
      { passive: false, capture: true },
    );
  }
}
