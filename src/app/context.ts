export class Context {
  constructor(
    public document: Document,
    public window: Window,
  ) {}

  createCanvasElement(): HTMLCanvasElement {
    const canvas = this.document.createElement('canvas');
    this.document.body.appendChild(canvas);
    return canvas;
  }
}
