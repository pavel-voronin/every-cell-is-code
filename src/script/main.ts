const canvas = document.getElementById('gridCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element with id 'gridCanvas' not found.");
}
const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Failed to get 2D context from canvas.');
}

const CELL_SIZE = 100;
let scale = 1;
const minScale = 0.5,
  maxScale = 2;
let offsetX = 0,
  offsetY = 0;
let isDragging = false,
  lastX = 0,
  lastY = 0;
let isPinching = false,
  lastTouchDist = 0,
  lastTouchMid = { x: 0, y: 0 };

const blocks = new Map();

function drawGrid() {
  ctx!.clearRect(0, 0, canvas.width, canvas.height);
  ctx!.save();
  ctx!.scale(scale, scale);

  const worldWidth = canvas.width / scale;
  const worldHeight = canvas.height / scale;
  const cols = Math.ceil(worldWidth / CELL_SIZE) + 1;
  const rows = Math.ceil(worldHeight / CELL_SIZE) + 1;
  const startX = Math.floor(offsetX / CELL_SIZE) * CELL_SIZE;
  const startY = Math.floor(offsetY / CELL_SIZE) * CELL_SIZE;
  const lineWidth = 1 / scale;
  ctx!.lineWidth = lineWidth;
  ctx!.font = `${12}px sans-serif`;
  ctx!.fillStyle = '#aaf';

  for (let i = 0; i < cols; i++) {
    const x = startX + i * CELL_SIZE - offsetX;
    for (let j = 0; j < rows; j++) {
      const y = startY + j * CELL_SIZE - offsetY;
      ctx!.strokeStyle = '#444';
      ctx!.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      const coordX = Math.floor((startX + i * CELL_SIZE) / CELL_SIZE);
      const coordY = Math.floor((startY + j * CELL_SIZE) / CELL_SIZE);
      ctx!.fillText(`${coordX},${coordY}`, x + 5, y + 15);
    }
  }

  for (const b of blocks.values()) {
    const px = (b.gridX * CELL_SIZE - offsetX) * scale;
    const py = (b.gridY * CELL_SIZE - offsetY) * scale;
    b.domCanvas.style.transform = `translate(${px}px, ${py}px)`;
    b.domCanvas.style.width = `${b.wCells * CELL_SIZE * scale}px`;
    b.domCanvas.style.height = `${b.hCells * CELL_SIZE * scale}px`;
  }

  ctx!.restore();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawGrid();
}
window.addEventListener('resize', resize);
resize();

const pendingEvents = new Map();

function createBlock(
  gridX: number,
  gridY: number,
  wCells: number,
  hCells: number,
  script: string,
) {
  const id = `${gridX}_${wCells}_${gridY}_${hCells}`;
  const width = CELL_SIZE * wCells;
  const height = CELL_SIZE * hCells;
  const worker = new Worker(script, { type: 'module' });

  const domCanvas = document.createElement('canvas');
  domCanvas.width = width;
  domCanvas.height = height;
  domCanvas.style.position = 'absolute';
  domCanvas.style.pointerEvents = 'none';
  domCanvas.style.zIndex = '1';
  document.body.appendChild(domCanvas);

  const offCanvas = domCanvas.transferControlToOffscreen();
  offCanvas.width = width;
  offCanvas.height = height;

  worker.onmessage = (e) => {
    if (e.data.type === 'intercept') {
      const { eventId, intercepted } = e.data;
      const resolver = pendingEvents.get(eventId);
      if (resolver) {
        resolver(intercepted);
        pendingEvents.delete(eventId);
      }
    } else if (e.data.type === 'message') {
      const dirs: { [key: string]: [number, number] } = {
        n: [0, -1],
        ne: [1, -1],
        e: [1, 0],
        se: [1, 1],
        s: [0, 1],
        sw: [-1, 1],
        w: [-1, 0],
        nw: [-1, -1],
      };

      const dirList: string[] =
        e.data.to === undefined
          ? Object.keys(dirs)
          : Array.isArray(e.data.to)
            ? e.data.to
            : [e.data.to];

      const from = e.data.from === undefined ? [0, 0] : e.data.from;
      if (
        from[0] < 0 ||
        from[0] >= wCells ||
        from[1] < 0 ||
        from[1] >= hCells
      ) {
        // Ignore or handle invalid 'from' coordinate
        return;
      }

      for (const dir of dirList) {
        const d = dirs[dir];
        if (!d) continue;
        const tx = gridX + from[0] + d[0];
        const ty = gridY + from[1] + d[1];
        for (const [, b] of blocks) {
          for (let dx = 0; dx < b.wCells; dx++) {
            for (let dy = 0; dy < b.hCells; dy++) {
              if (b.gridX + dx === tx && b.gridY + dy === ty) {
                b.worker.postMessage({
                  type: 'message',
                  payload: e.data.payload,
                });
              }
            }
          }
        }
      }
    }
  };

  worker.postMessage(
    {
      type: 'init',
      width,
      height,
      wCells,
      hCells,
      offCanvas,
    },
    [offCanvas],
  );
  const block = {
    gridX,
    gridY,
    wCells,
    hCells,
    worker,
    canvas: offCanvas,
    domCanvas,
    requestEventId: (() => {
      let counter = 0;
      return () => counter++;
    })(),
  };

  blocks.set(id, block);
}

createBlock(4, 2, 1, 2, './workers/worker1.js');
createBlock(3, 3, 1, 1, './workers/worker2.js');
createBlock(2, 4, 2, 1, './workers/worker1.js');
createBlock(2, 3, 1, 1, './workers/worker3.js');
createBlock(3, 2, 1, 1, './workers/worker4.js');
createBlock(2, 2, 1, 1, './workers/worker5.js');
createBlock(2, 1, 1, 1, './workers/worker6.js');

drawGrid();

canvas.addEventListener('mousedown', async (e) => {
  const mx = e.offsetX / scale + offsetX;
  const my = e.offsetY / scale + offsetY;

  for (const b of blocks.values()) {
    const bx = b.gridX * CELL_SIZE;
    const by = b.gridY * CELL_SIZE;
    const bw = b.wCells * CELL_SIZE;
    const bh = b.hCells * CELL_SIZE;
    const rx = mx - bx;
    const ry = my - by;

    if (rx >= 0 && rx <= bw && ry >= 0 && ry <= bh) {
      const eventId = b.requestEventId();

      const promise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pendingEvents.delete(eventId);
          resolve(false);
        }, 50);

        pendingEvents.set(eventId, (intercepted: boolean) => {
          clearTimeout(timeout);
          resolve(intercepted);
        });
      });

      b.worker.postMessage({
        type: 'click',
        x: rx,
        y: ry,
        eventId,
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
    drawGrid();
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
        ? Math.min(maxScale, scale * f)
        : Math.max(minScale, scale / f);
    offsetX = wx - e.offsetX / scale;
    offsetY = wy - e.offsetY / scale;
    drawGrid();
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
        drawGrid();
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
      scale = Math.min(maxScale, Math.max(minScale, scale * zoom));
      offsetX = worldMidX - mid.x / scale;
      offsetY = worldMidY - mid.y / scale;
      // Pan as midpoint moves
      const panDx = (mid.x - lastTouchMid.x) / scale;
      const panDy = (mid.y - lastTouchMid.y) / scale;
      offsetX -= panDx;
      offsetY -= panDy;
      lastTouchDist = dist;
      lastTouchMid = mid;
      drawGrid();
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
      for (const b of blocks.values()) {
        const bx = b.gridX * CELL_SIZE;
        const by = b.gridY * CELL_SIZE;
        const bw = b.wCells * CELL_SIZE;
        const bh = b.hCells * CELL_SIZE;
        const rx = normX - bx;
        const ry = normY - by;
        if (rx >= 0 && rx <= bw && ry >= 0 && ry <= bh) {
          b.worker.postMessage({ type: 'click', x: rx, y: ry });
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
