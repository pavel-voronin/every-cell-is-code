/* eslint-disable no-unused-vars */
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

const dirs = [['n', 'e'], ['n', 's']];
let di = 0;

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#a31';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Click Me', 22, height / 2 + 2);
}

function handle(e) {
  if (e.data.type === 'click') {
    const eventId = e.data.eventId;
    postMessage({ type: 'intercept', eventId, intercepted: true });
    const to = dirs[di];
    di = (di + 1) % dirs.length;
    postMessage({
      type: 'message',
      from: [0, 0],
      to,
      payload: 'ChangeColor',
    });
  }
}
