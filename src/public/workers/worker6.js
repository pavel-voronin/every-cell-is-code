/* eslint-disable @typescript-eslint/no-unused-vars */
let wCells, hCells, width, height, ctx;
let score = 0;

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

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#000';
  ctx.font = `${Math.floor(height * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(score), width / 2, height / 2);
}

function handle(e) {
  if (
    e.data.type === 'message' &&
    e.data.payload &&
    e.data.payload.command === 'UpdateScore'
  ) {
    score = e.data.payload.score;
    draw();
  }
}
