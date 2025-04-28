import {
  CELL_SIZE,
  GRID_FONT,
  GRID_LINE_STYLE,
  GRID_LINE_WIDTH,
  GRID_STROKE_STYLE,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  TAP_THRESHOLD,
} from './constants';
import { eventBus } from './eventBus';

export class GridManager {
  protected scale = 1;
  protected offsetX = 0;
  protected offsetY = 0;
  protected pointers: Map<number, { x: number; y: number }> = new Map();
  protected isDragging = false;
  protected isPinching = false;
  protected lastTouchDist = 0;
  protected lastTouchMid = { x: 0, y: 0 };
  protected dragStart: { x: number; y: number } | null = null;

  constructor(
    protected canvas: HTMLCanvasElement,
    protected ctx: CanvasRenderingContext2D = canvas.getContext('2d')!,
  ) {
    eventBus.sync('window:resize', this.setCanvasSize.bind(this));
    eventBus.on('wheel', this.canvas.dispatchEvent.bind(this.canvas));
    eventBus.on('pointerdown', this.canvas.dispatchEvent.bind(this.canvas));
    eventBus.on('pointerup', this.canvas.dispatchEvent.bind(this.canvas));
    eventBus.on('pointermove', this.canvas.dispatchEvent.bind(this.canvas));

    canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
    canvas.addEventListener('pointerleave', this.onPointerUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this));
  }

  protected onWheel(e: WheelEvent) {
    e.preventDefault();
    const wx = e.offsetX / this.scale + this.offsetX,
      wy = e.offsetY / this.scale + this.offsetY;
    this.scale =
      e.deltaY < 0
        ? Math.min(MAX_SCALE, this.scale * SCALE_STEP)
        : e.deltaY > 0
          ? Math.max(MIN_SCALE, this.scale / SCALE_STEP)
          : this.scale;
    this.offsetX = wx - e.offsetX / this.scale;
    this.offsetY = wy - e.offsetY / this.scale;
    this.drawGrid();
  }

  protected onPointerDown(e: PointerEvent) {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) {
      this.isDragging = false;
      this.dragStart = { x: e.clientX, y: e.clientY };
    } else if (this.pointers.size === 2) {
      this.isPinching = true;
      const pts = Array.from(this.pointers.values());
      const p1 = pts[0],
        p2 = pts[1];
      this.lastTouchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      this.lastTouchMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }
  }

  protected onPointerMove(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    const prev = this.pointers.get(e.pointerId)!;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1 && !this.isPinching) {
      const start = this.dragStart;
      if (start && !this.isDragging) {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) > TAP_THRESHOLD) {
          this.isDragging = true;
        }
      }
      if (this.isDragging) {
        const dx = (e.clientX - prev.x) / this.scale;
        const dy = (e.clientY - prev.y) / this.scale;
        this.offsetX -= dx;
        this.offsetY -= dy;
        this.drawGrid();
      }
    } else if (this.pointers.size === 2) {
      this.isPinching = true;
      const pts = Array.from(this.pointers.values());
      const p1 = pts[0],
        p2 = pts[1];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const zoom = dist / this.lastTouchDist;
      const worldMidX = mid.x / this.scale + this.offsetX;
      const worldMidY = mid.y / this.scale + this.offsetY;
      this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale * zoom));
      this.offsetX = worldMidX - mid.x / this.scale;
      this.offsetY = worldMidY - mid.y / this.scale;
      const panDx = (mid.x - this.lastTouchMid.x) / this.scale;
      const panDy = (mid.y - this.lastTouchMid.y) / this.scale;
      this.offsetX -= panDx;
      this.offsetY -= panDy;
      this.lastTouchDist = dist;
      this.lastTouchMid = mid;
      this.drawGrid();
    }
  }

  protected onPointerUp(e: PointerEvent) {
    this.pointers.delete(e.pointerId);
    this.canvas.releasePointerCapture(e.pointerId);
    if (this.pointers.size === 1) {
      // Continue drag with remaining pointer
      this.isPinching = false;
      this.isDragging = true;
      const [rem] = this.pointers.values();
      if (rem) this.dragStart = { x: rem.x, y: rem.y };
    } else if (this.pointers.size === 0) {
      this.isPinching = false;
      this.isDragging = false;
      this.dragStart = null;
    }
  }

  setCanvasSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.drawGrid();
  }

  drawGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);

    const worldWidth = this.canvas.width / this.scale;
    const worldHeight = this.canvas.height / this.scale;
    const cols = Math.ceil(worldWidth / CELL_SIZE) + 1;
    const rows = Math.ceil(worldHeight / CELL_SIZE) + 1;
    const startX = Math.floor(this.offsetX / CELL_SIZE) * CELL_SIZE;
    const startY = Math.floor(this.offsetY / CELL_SIZE) * CELL_SIZE;

    this.ctx.lineWidth = GRID_LINE_WIDTH / this.scale;
    this.ctx.font = GRID_FONT;
    this.ctx.fillStyle = GRID_LINE_STYLE;
    this.ctx.strokeStyle = GRID_STROKE_STYLE;

    for (let i = 0; i < cols; i++) {
      const x = startX + i * CELL_SIZE - this.offsetX;

      for (let j = 0; j < rows; j++) {
        const y = startY + j * CELL_SIZE - this.offsetY;

        this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        const coordX = Math.floor((startX + i * CELL_SIZE) / CELL_SIZE);
        const coordY = Math.floor((startY + j * CELL_SIZE) / CELL_SIZE);

        this.ctx.fillText(`${coordX},${coordY}`, x + 5, y + 15);
      }
    }

    this.ctx.restore();

    eventBus.emit('grid:moved', this.offsetX, this.offsetY, this.scale);
  }
}
