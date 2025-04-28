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
    this.gridManager = new GridManager(canvas);

    // Data

    this.metaStore.addBlockMeta(4, 2, 1, 2, './workers/worker1.js', {
      pointerdown: true,
    });
    this.metaStore.addBlockMeta(3, 3, 1, 1, './workers/worker2.js', {
      pointerdown: true,
    });
    this.metaStore.addBlockMeta(2, 4, 2, 1, './workers/worker1.js', {
      pointerdown: true,
    });
    this.metaStore.addBlockMeta(2, 3, 1, 1, './workers/worker3.js');
    this.metaStore.addBlockMeta(3, 2, 1, 1, './workers/worker4.js');
    this.metaStore.addBlockMeta(2, 2, 1, 1, './workers/worker5.js', {
      pointerdown: true,
    });
    this.metaStore.addBlockMeta(2, 1, 1, 1, './workers/worker6.js');

    this.blockManager.spawn(4, 2);
    this.blockManager.spawn(3, 3);
    this.blockManager.spawn(2, 4);
    this.blockManager.spawn(2, 3);
    this.blockManager.spawn(3, 2);
    this.blockManager.spawn(2, 2);
    this.blockManager.spawn(2, 1);
  }

  protected stopTouchEvents() {
    this.context.document.addEventListener(
      'touchstart',
      (e) => e.preventDefault(),
      { capture: true },
    );
    this.context.document.addEventListener(
      'touchmove',
      (e) => e.preventDefault(),
      { capture: true },
    );
    this.context.document.addEventListener(
      'touchend',
      (e) => e.preventDefault(),
      { capture: true },
    );
    this.context.document.addEventListener(
      'touchcancel',
      (e) => e.preventDefault(),
      { capture: true },
    );
  }
}
