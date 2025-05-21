import {
  CELL_SIZE,
  GRID_FONT,
  GRID_LINE_STYLE,
  GRID_LINE_WIDTH,
  GRID_STROKE_STYLE,
  INITIAL_SCALE,
  MAX_SCALE,
  MIN_SCALE,
  SCALE_STEP,
  TAP_THRESHOLD,
  VISIBLE_AREA_MARGIN,
} from './constants';
import { XY, XYWH } from './types/base';
import { eventBus } from './communications/eventBus';

export class GridManager {
  protected scale = INITIAL_SCALE;
  protected offset: XY = [0, 0];
  protected pointers = new Map<number, XY>();
  protected isDragging = false;
  protected isPinching = false;
  protected lastTouchDist = 0;
  protected lastTouchMid: XY = [0, 0];
  protected dragStart: XY | null = null;
  protected ctx: CanvasRenderingContext2D;
  private lastVisibleArea: XYWH | null = null;

  constructor(
    protected canvas: HTMLCanvasElement,
    initialCoords: XY = [0, 0],
  ) {
    this.ctx = canvas.getContext('2d')!;
    eventBus.sync('window:resize', this.setCanvasSize.bind(this));
    this.moveTo(initialCoords);
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
    const wx = e.offsetX / this.scale + this.offset[0];
    const wy = e.offsetY / this.scale + this.offset[1];
    this.scale =
      e.deltaY < 0
        ? Math.min(MAX_SCALE, this.scale * SCALE_STEP)
        : e.deltaY > 0
          ? Math.max(MIN_SCALE, this.scale / SCALE_STEP)
          : this.scale;
    this.offset[0] = wx - e.offsetX / this.scale;
    this.offset[1] = wy - e.offsetY / this.scale;
    this.drawGrid();
  }

  protected onPointerDown(e: PointerEvent) {
    this.canvas.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (this.pointers.size === 1) {
      this.isDragging = false;
      this.dragStart = [e.clientX, e.clientY];
    } else if (this.pointers.size === 2) {
      this.isPinching = true;
      const pts = Array.from(this.pointers.values());
      const p1 = pts[0];
      const p2 = pts[1];
      this.lastTouchDist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      this.lastTouchMid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    }
  }

  protected onPointerMove(e: PointerEvent) {
    if (!this.pointers.has(e.pointerId)) return;
    const prev = this.pointers.get(e.pointerId)!;
    this.pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (this.pointers.size === 1 && !this.isPinching) {
      const start = this.dragStart;
      if (start && !this.isDragging) {
        const dx = e.clientX - start[0];
        const dy = e.clientY - start[1];
        if (Math.hypot(dx, dy) > TAP_THRESHOLD) {
          this.isDragging = true;
        }
      }
      if (this.isDragging) {
        const dx = (e.clientX - prev[0]) / this.scale;
        const dy = (e.clientY - prev[1]) / this.scale;
        this.offset[0] -= dx;
        this.offset[1] -= dy;
        this.drawGrid();
      }
    } else if (this.pointers.size === 2) {
      this.isPinching = true;
      const pts = Array.from(this.pointers.values());
      const p1 = pts[0],
        p2 = pts[1];
      const dist = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const mid: XY = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      const zoom = dist / this.lastTouchDist;
      const worldMidX = mid[0] / this.scale + this.offset[0];
      const worldMidY = mid[1] / this.scale + this.offset[1];
      this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.scale * zoom));
      this.offset[0] = worldMidX - mid[0] / this.scale;
      this.offset[1] = worldMidY - mid[1] / this.scale;
      const panDx = (mid[0] - this.lastTouchMid[0]) / this.scale;
      const panDy = (mid[1] - this.lastTouchMid[1]) / this.scale;
      this.offset[0] -= panDx;
      this.offset[1] -= panDy;
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
      if (rem) this.dragStart = [rem[0], rem[1]];
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
    const startX = Math.floor(this.offset[0] / CELL_SIZE) * CELL_SIZE;
    const startY = Math.floor(this.offset[1] / CELL_SIZE) * CELL_SIZE;

    this.ctx.lineWidth = GRID_LINE_WIDTH / this.scale;
    this.ctx.font = GRID_FONT;
    this.ctx.fillStyle = GRID_LINE_STYLE;
    this.ctx.strokeStyle = GRID_STROKE_STYLE;

    for (let i = 0; i < cols; i++) {
      const x = startX + i * CELL_SIZE - this.offset[0];

      for (let j = 0; j < rows; j++) {
        const y = startY + j * CELL_SIZE - this.offset[1];

        this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        const coordX = Math.floor((startX + i * CELL_SIZE) / CELL_SIZE);
        const coordY = Math.floor((startY + j * CELL_SIZE) / CELL_SIZE);

        this.ctx.fillText(`${coordX},${coordY}`, x + 5, y + 15);
      }
    }

    this.ctx.restore();

    eventBus.emit('camera:moved', this.offset, this.scale);

    this.emitVisibleAreaIfNeeded();
  }

  private emitVisibleAreaIfNeeded() {
    const worldWidth = this.canvas.width / this.scale;
    const worldHeight = this.canvas.height / this.scale;

    const minVisibleX =
      Math.floor(this.offset[0] / CELL_SIZE) - VISIBLE_AREA_MARGIN;
    const maxVisibleX =
      Math.floor((this.offset[0] + worldWidth) / CELL_SIZE) +
      VISIBLE_AREA_MARGIN;
    const minVisibleY =
      Math.floor(this.offset[1] / CELL_SIZE) - VISIBLE_AREA_MARGIN;
    const maxVisibleY =
      Math.floor((this.offset[1] + worldHeight) / CELL_SIZE) +
      VISIBLE_AREA_MARGIN;

    const newVisibleArea: [number, number, number, number] = [
      minVisibleX,
      maxVisibleX,
      minVisibleY,
      maxVisibleY,
    ];
    if (
      !this.lastVisibleArea ||
      this.lastVisibleArea[0] !== newVisibleArea[0] ||
      this.lastVisibleArea[1] !== newVisibleArea[1] ||
      this.lastVisibleArea[2] !== newVisibleArea[2] ||
      this.lastVisibleArea[3] !== newVisibleArea[3]
    ) {
      eventBus.emit(
        'grid:visible-area',
        minVisibleX,
        maxVisibleX,
        minVisibleY,
        maxVisibleY,
      );

      this.lastVisibleArea = newVisibleArea;
    }
  }

  public moveTo(xy: XY) {
    this.offset[0] =
      xy[0] * CELL_SIZE - this.canvas.width / (2 * this.scale) + CELL_SIZE / 2;
    this.offset[1] =
      xy[1] * CELL_SIZE - this.canvas.height / (2 * this.scale) + CELL_SIZE / 2;

    this.drawGrid();
  }
}
