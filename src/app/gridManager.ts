import { BlockManager } from './blockManager';
import { CELL_SIZE, MAX_SCALE, MIN_SCALE } from './constants';
import { eventBus } from './eventBus';

// todo: integrate them into class

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let isPinching = false;
let lastTouchDist = 0;
let lastTouchMid = { x: 0, y: 0 };

export class GridManager {
  constructor(
    protected canvas: HTMLCanvasElement,
    protected blockManager: BlockManager,
    protected ctx: CanvasRenderingContext2D = canvas.getContext('2d')!,
  ) {
    eventBus.sync('window:resize', this.setCanvasSize.bind(this));

    canvas.addEventListener('mousedown', async (e) => {
      const mx = e.offsetX / scale + offsetX;
      const my = e.offsetY / scale + offsetY;

      for (const block of this.blockManager.getBlocks()) {
        const bx = block.x * CELL_SIZE;
        const by = block.y * CELL_SIZE;
        const bw = block.w * CELL_SIZE;
        const bh = block.h * CELL_SIZE;
        const rx = mx - bx;
        const ry = my - by;

        if (rx >= 0 && rx <= bw && ry >= 0 && ry <= bh) {
          const eventId = block.requestEventId();

          const promise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
              block.dropPendingEvent(eventId);
              resolve(false);
            }, 50);

            block.addPendingEvent(eventId, (intercepted: boolean) => {
              clearTimeout(timeout);
              resolve(intercepted);
            });
          });

          block.postMessage({
            type: 'click',
            payload: { x: rx, y: ry, eventId },
          });

          const intercepted = await promise;

          if (intercepted) return;
        }
      }

      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        offsetX -= (e.clientX - lastX) / scale;
        offsetY -= (e.clientY - lastY) / scale;
        lastX = e.clientX;
        lastY = e.clientY;
        this.drawGrid();
      }
    });
    canvas.addEventListener('mouseup', () => (isDragging = false));
    canvas.addEventListener('mouseleave', () => (isDragging = false));
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const f = 1.1;
        const wx = e.offsetX / scale + offsetX,
          wy = e.offsetY / scale + offsetY;
        scale =
          e.deltaY < 0
            ? Math.min(MAX_SCALE, scale * f)
            : Math.max(MIN_SCALE, scale / f);
        offsetX = wx - e.offsetX / scale;
        offsetY = wy - e.offsetY / scale;
        this.drawGrid();
      },
      { passive: false },
    );

    // Touch events: single-finger tap vs drag, and two-finger pinch+pan
    const TAP_THRESHOLD = 5;
    let touchStartX = 0,
      touchStartY = 0;

    canvas.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const t = e.touches;
        if (t.length === 1) {
          // Single touch start: record for tap vs drag
          isPinching = false;
          isDragging = false;
          touchStartX = t[0].clientX;
          touchStartY = t[0].clientY;
          lastX = touchStartX;
          lastY = touchStartY;
        } else if (t.length === 2) {
          // Pinch start
          isPinching = true;
          isDragging = false;
          const p1 = { x: t[0].clientX, y: t[0].clientY };
          const p2 = { x: t[1].clientX, y: t[1].clientY };
          lastTouchDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          lastTouchMid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
      },
      { passive: false },
    );

    canvas.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault();
        const t = e.touches;
        if (t.length === 1 && !isPinching) {
          const dxScreen = t[0].clientX - touchStartX;
          const dyScreen = t[0].clientY - touchStartY;
          if (!isDragging && Math.hypot(dxScreen, dyScreen) > TAP_THRESHOLD) {
            // Start drag if moved beyond threshold
            isDragging = true;
          }
          if (isDragging) {
            const dx = (t[0].clientX - lastX) / scale;
            const dy = (t[0].clientY - lastY) / scale;
            offsetX -= dx;
            offsetY -= dy;
            lastX = t[0].clientX;
            lastY = t[0].clientY;
            this.drawGrid();
          }
        } else if (t.length === 2) {
          // Pinch+pan
          const p1 = { x: t[0].clientX, y: t[0].clientY };
          const p2 = { x: t[1].clientX, y: t[1].clientY };
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
          // Scale
          const zoom = dist / lastTouchDist;
          const worldMidX = mid.x / scale + offsetX;
          const worldMidY = mid.y / scale + offsetY;
          scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * zoom));
          offsetX = worldMidX - mid.x / scale;
          offsetY = worldMidY - mid.y / scale;
          // Pan as midpoint moves
          const panDx = (mid.x - lastTouchMid.x) / scale;
          const panDy = (mid.y - lastTouchMid.y) / scale;
          offsetX -= panDx;
          offsetY -= panDy;
          lastTouchDist = dist;
          lastTouchMid = mid;
          this.drawGrid();
        }
      },
      { passive: false },
    );

    canvas.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        const t = e.touches;
        if (!isPinching && !isDragging && t.length === 0) {
          // Treat as tap: convert to click
          const mx = touchStartX - canvas.getBoundingClientRect().left;
          const my = touchStartY - canvas.getBoundingClientRect().top;
          const normX = mx / scale + offsetX;
          const normY = my / scale + offsetY;

          for (const block of this.blockManager.getBlocks()) {
            const bx = block.x * CELL_SIZE;
            const by = block.y * CELL_SIZE;
            const bw = block.w * CELL_SIZE;
            const bh = block.h * CELL_SIZE;
            const rx = normX - bx;
            const ry = normY - by;
            if (rx >= 0 && rx <= bw && ry >= 0 && ry <= bh) {
              block.postMessage({ type: 'click', payload: { x: rx, y: ry } });
              break;
            }
          }
        }

        if (t.length === 1) {
          // Continue drag with remaining finger
          isPinching = false;
          isDragging = true;
          lastX = t[0].clientX;
          lastY = t[0].clientY;
        } else if (t.length === 0) {
          isPinching = false;
          isDragging = false;
        }
      },
      { passive: false },
    );
  }

  setCanvasSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.drawGrid();
  }

  drawGrid() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.scale(scale, scale);

    const worldWidth = this.canvas.width / scale;
    const worldHeight = this.canvas.height / scale;
    const cols = Math.ceil(worldWidth / CELL_SIZE) + 1;
    const rows = Math.ceil(worldHeight / CELL_SIZE) + 1;
    const startX = Math.floor(offsetX / CELL_SIZE) * CELL_SIZE;
    const startY = Math.floor(offsetY / CELL_SIZE) * CELL_SIZE;
    const lineWidth = 1 / scale;
    this.ctx.lineWidth = lineWidth;
    this.ctx.font = `${12}px sans-serif`;
    this.ctx.fillStyle = '#aaf';

    for (let i = 0; i < cols; i++) {
      const x = startX + i * CELL_SIZE - offsetX;
      for (let j = 0; j < rows; j++) {
        const y = startY + j * CELL_SIZE - offsetY;
        this.ctx.strokeStyle = '#444';
        this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        const coordX = Math.floor((startX + i * CELL_SIZE) / CELL_SIZE);
        const coordY = Math.floor((startY + j * CELL_SIZE) / CELL_SIZE);
        this.ctx.fillText(`${coordX},${coordY}`, x + 5, y + 15);
      }
    }

    this.ctx.restore();

    eventBus.emit('grid:moved', offsetX, offsetY, scale);
  }
}
