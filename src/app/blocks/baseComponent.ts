import { IBlockComponent } from '../types/blockComponents';
import { Block } from './block';

export abstract class BaseComponent implements IBlockComponent {
  protected unloadHandlers: (() => void)[] = [];

  constructor(readonly block: Block) {}

  protected onUnload(handler: () => void) {
    this.unloadHandlers.push(handler);
  }

  unload() {
    this.unloadHandlers.forEach((handler) => handler());
  }
}
