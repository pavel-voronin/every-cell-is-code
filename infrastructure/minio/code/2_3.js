// System template

let origin;
let width;
let height;
let isActive = true;
let targetFPS;
let lastFrameTime;
let canvas;
let ctx;
let renderLoopTimer = null;

self.onmessage = function (e) {
  const data = e.data;

  switch (data.type) {
    case 'init':
      handleInit(data);
      break;

    case 'pause':
      handlePause();
      break;

    case 'resume':
      handleResume();
      break;

    case 'pointerdown':
      handlePointerDownEvent(data.payload);
      break;

    case 'pointerup':
      handlePointerUpEvent(data.payload);
      break;

    case 'pointermove':
      handlePointerMoveEvent(data.payload);
      break;

    case 'wheel':
      handleWheelEvent(data.payload);
      break;

    case 'keyup':
      handleKeyUpEvent(data.event);
      break;

    case 'keydown':
      handleKeyDownEvent(data.event);
      break;

    case 'signal':
      handleSignal(data);
      break;

    default:
      throw new Error(`Unknown message type: ${data.type}`);
  }
};

function handleInit(data) {
  origin = data.origin;
  width = data.width ?? 100;
  height = data.height ?? 100;
  targetFPS = data.targetFPS ?? 0;

  canvas = new OffscreenCanvas(width, height);
  ctx = canvas.getContext('2d');

  if (typeof self.onInit === 'function') {
    self.onInit();
  }

  if (targetFPS > 0) {
    startRenderLoop();
  } else {
    sendFrame();
  }

  isActive = true;
}

function handlePause() {
  isActive = false;

  if (renderLoopTimer !== null) {
    clearTimeout(renderLoopTimer);
    renderLoopTimer = null;
  }

  if (typeof self.onPause === 'function') {
    self.onPause();
  }
}

function handleResume() {
  isActive = true;

  lastFrameTime = performance.now();

  if (typeof self.onResume === 'function') {
    self.onResume();
  }

  if (targetFPS > 0) {
    startRenderLoop();
  }
}

function handleWheelEvent(payload) {
  if (!isActive) return;

  if (typeof self.onWheel === 'function') {
    if (self.onWheel(payload) === false) {
      reEmit(payload.eventId);
    }
  }
}

function handlePointerDownEvent(payload) {
  if (!isActive) return;

  if (typeof self.onPointerDown === 'function') {
    if (self.onPointerDown(payload) === false) {
      reEmit(payload.eventId);
    }
  }
}

function handlePointerUpEvent(payload) {
  if (!isActive) return;

  if (typeof self.onPointerUp === 'function') {
    if (self.onPointerUp(payload) === false) {
      reEmit(payload.eventId);
    }
  }
}

function handlePointerMoveEvent(payload) {
  if (!isActive) return;

  if (typeof self.onPointerMove === 'function') {
    if (self.onPointerMove(payload) === false) {
      reEmit(payload.eventId);
    }
  }
}

function handleKeyUpEvent(payload) {
  if (!isActive) return;

  if (typeof self.onKeyUp === 'function') {
    self.onKeyUp(payload);
  }
}

function handleKeyDownEvent(payload) {
  if (!isActive) return;

  if (typeof self.onKeyDown === 'function') {
    self.onKeyDown(payload);
  }
}

function handleSignal(payload) {
  if (!isActive) return;

  if (typeof self.onSignal === 'function') {
    self.onSignal(payload);
  }
}

function startRenderLoop() {
  if (!isActive || targetFPS <= 0 || typeof self.onUpdate !== 'function')
    return;

  if (renderLoopTimer !== null) {
    clearTimeout(renderLoopTimer);
    renderLoopTimer = null;
  }

  lastFrameTime = performance.now();

  const frameInterval = 1000 / targetFPS;
  let nextFrameTime = lastFrameTime + frameInterval;

  const frameTimer = () => {
    if (!isActive || targetFPS <= 0) return;

    const now = performance.now();

    if (now > nextFrameTime + frameInterval) {
      const skipped = Math.floor((now - nextFrameTime) / frameInterval);
      nextFrameTime += frameInterval * (skipped + 1);
    } else {
      nextFrameTime += frameInterval;
    }

    renderFrame(now);

    let delay = nextFrameTime - performance.now();
    if (delay < 0) delay = 0;

    renderLoopTimer = setTimeout(frameTimer, delay);
  };

  renderLoopTimer = setTimeout(frameTimer, frameInterval);
}

function renderFrame(timestamp) {
  if (!isActive) return;

  const deltaTime = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  if (typeof self.onUpdate === 'function') {
    self.onUpdate(deltaTime);
  }

  sendFrame();
}

function terminate() {
  self.postMessage({ type: 'terminate' });
}

function sendSignal({ to, topic, radius, payload }) {
  self.postMessage({
    type: 'signal',
    to,
    radius: radius ?? 0,
    topic,
    payload,
  });
}

function sendFrame() {
  const bitmap = canvas.transferToImageBitmap();
  self.postMessage(
    {
      type: 'draw',
      bitmap,
    },
    [bitmap],
  );
}

function reEmit(eventId) {
  self.postMessage({ type: 're-emit', eventId });
}

function setFPS(fps) {
  targetFPS = fps;
  if (renderLoopTimer !== null) {
    clearTimeout(renderLoopTimer);
    renderLoopTimer = null;
  }
  if (fps > 0 && isActive) {
    startRenderLoop();
  }
}

// User's code will be injected here

let angle = 0;

function onUpdate(delta) {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Tesseract: 16 vertices in 4D
  const size = Math.min(width, height) * 0.2;
  const vertices4D = [];
  for (let i = 0; i < 16; i++) {
    vertices4D.push([
      i & 1 ? size : -size,
      i & 2 ? size : -size,
      i & 4 ? size : -size,
      i & 8 ? size : -size,
    ]);
  }

  // Rotation in 4D (XY and WZ planes)
  const rotate4D = (v, a) => {
    // XY
    let [x, y, z, w] = v;
    let x1 = x * Math.cos(a) - y * Math.sin(a);
    let y1 = x * Math.sin(a) + y * Math.cos(a);
    // WZ
    let z1 = z * Math.cos(a) - w * Math.sin(a);
    let w1 = z * Math.sin(a) + w * Math.cos(a);
    return [x1, y1, z1, w1];
  };

  // Projection 4D -> 3D
  const project4Dto3D = ([x, y, z, w]) => {
    const wDist = 6 * size; // Was 3 * size, now 6 * size
    const factor = wDist / (wDist - w);
    return [x * factor, y * factor, z * factor];
  };

  // Projection 3D -> 2D
  const project3Dto2D = ([x, y, z]) => {
    const zDist = 8 * size; // Was 4 * size, now 8 * size
    const factor = zDist / (zDist - z);
    return [width / 2 + x * factor, height / 2 + y * factor];
  };

  // Rotation in 3D (XZ and YZ)
  const rotate3D = (v, a) => {
    let [x, y, z] = v;
    // XZ
    let x1 = x * Math.cos(a * 0.7) - z * Math.sin(a * 0.7);
    let z1 = x * Math.sin(a * 0.7) + z * Math.cos(a * 0.7);
    // YZ
    let y1 = y * Math.cos(a * 0.4) - z1 * Math.sin(a * 0.4);
    let z2 = y * Math.sin(a * 0.4) + z1 * Math.cos(a * 0.4);
    return [x1, y1, z2];
  };

  // Transform all vertices
  const projected = vertices4D.map((v) =>
    project3Dto2D(rotate3D(project4Dto3D(rotate4D(v, angle)), angle)),
  );

  // Tesseract edges: connect vertices differing by 1 bit
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      if (((i ^ j) & ((i ^ j) - 1)) === 0) {
        // difference in exactly one bit
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
      }
    }
  }

  const bitmap = canvas.transferToImageBitmap();
  self.postMessage(
    {
      type: 'draw',
      bitmap,
    },
    [bitmap],
  );

  angle += 0.01;
}
