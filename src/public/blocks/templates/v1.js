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
      payload: { bitmap },
    },
    [bitmap],
  );
}

function reEmit(eventId) {
  self.postMessage({
    type: 're-emit',
    payload: { eventId },
  });
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
