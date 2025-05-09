let wCells, hCells, width, height, ctx;

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    wCells = e.data.wCells;
    hCells = e.data.hCells;
    width = e.data.width;
    height = e.data.height;
    ctx = e.data.offCanvas.getContext('2d');
    draw();
  } else {
    handle(e);
  }
};

let color = 'cyan';

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#3aa';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(height, width) / 3, 0, 2 * Math.PI);
  ctx.fill();
}

function changeColor() {
  color = 'hsl(' + Math.random() * 360 + ',100%,50%)';
  draw();
}

function handle(e) {
  if (
    e.data.type === 'message' &&
    e.data.payload &&
    e.data.payload.command === 'ChangeColor'
  ) {
    changeColor();
  }

  if (e.data.type === 'pointerdown') {
    const { x, y, pointerId, eventId } = e.data.payload;

    const r = Math.min(height, width) / 3,
      dx = x - width / 2,
      dy = y - height / 2;
    if (dx * dx + dy * dy <= r * r) {
      changeColor();
    } else {
      postMessage({ type: 're-emit', payload: { eventId } });
    }
  }
}
