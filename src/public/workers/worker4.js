let wCells, hCells, width, height, ctx;
let flashState = 'idle'; // 'idle', 'flashing', 'fading'
let flashAlpha = 0;
let flashStart, fadeStart;
const FLASH_DURATION = 80; // ms, fast white flash
const FADE_DURATION = 180; // ms, slower fade to black

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    wCells = e.data.wCells;
    hCells = e.data.hCells;
    width = e.data.width;
    height = e.data.height;
    ctx = e.data.offCanvas.getContext('2d');
    draw();
  }
  if (e.data.type === 'message') {
    startFlash();
  }
};

function startFlash() {
  flashState = 'flashing';
  flashAlpha = 1;
  flashStart = performance.now();
  requestAnimationFrame(animateFlash);
}

function animateFlash(now) {
  if (flashState === 'flashing') {
    const elapsed = now - flashStart;
    if (elapsed < FLASH_DURATION) {
      flashAlpha = 1;
      draw();
      requestAnimationFrame(animateFlash);
    } else {
      flashState = 'fading';
      fadeStart = now;
      requestAnimationFrame(animateFlash);
    }
  } else if (flashState === 'fading') {
    const elapsed = now - fadeStart;
    flashAlpha = 1 - Math.min(elapsed / FADE_DURATION, 1);
    draw();
    if (elapsed < FADE_DURATION) {
      requestAnimationFrame(animateFlash);
    } else {
      flashState = 'idle';
      flashAlpha = 0;
      draw();
    }
  }
}

function draw() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;
  }
}
