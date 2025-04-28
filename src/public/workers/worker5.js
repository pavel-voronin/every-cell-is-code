let wCells, hCells, width, height, ctx;
let gameState = 'start'; // start | running | gameover
let dino,
  obstacles,
  score,
  groundY,
  velocityY,
  gravity,
  jumpPower,
  speed,
  buttonRect,
  lastFrame;
let bestScore = 0;

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    wCells = e.data.wCells;
    hCells = e.data.hCells;
    width = e.data.width;
    height = e.data.height;
    ctx = e.data.offCanvas.getContext('2d');
    setup();
    draw();
  }
  if (e.data.type === 'click') {
    handleClick(e);
  }
};

function setup() {
  groundY = height * 0.8;
  dino = {
    x: width * 0.1,
    y: groundY - height * 0.1,
    w: height * 0.07,
    h: height * 0.1,
    vy: 0,
    jumping: false,
  };
  obstacles = [];
  score = 0;
  velocityY = 0;
  gravity = height * 0.0025;
  jumpPower = height * 0.045;
  speed = width * 0.012;
  buttonRect = {
    x: width * 0.05,
    y: groundY + height * 0.05,
    w: width * 0.9,
    h: height * 0.13,
  };
  lastFrame = performance.now();
}

function startGame() {
  setup();
  gameState = 'running';
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  gameState = 'gameover';
  if (score > bestScore) bestScore = score;
  postMessage({ type: 'message', payload: { command: 'UpdateScore', score } });
  draw();
}

function handleClick(e) {
  const { x, y, eventId } = e.data.payload;

  if (gameState === 'start') {
    if (inRect(x, y, buttonRect)) {
      postMessage({
        type: 'intercepted',
        payload: { eventId, intercepted: true },
      });
      startGame();
    }
  } else if (gameState === 'running') {
    if (inRect(x, y, buttonRect)) {
      postMessage({
        type: 'intercepted',
        payload: { eventId, intercepted: true },
      });
      jump();
    }
  } else if (gameState === 'gameover') {
    if (inRect(x, y, buttonRect)) {
      postMessage({
        type: 'intercepted',
        payload: { eventId, intercepted: true },
      });
      startGame();
    }
  }
}

function inRect(x, y, rect) {
  return (
    x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h
  );
}

function jump() {
  if (!dino.jumping) {
    dino.vy = -jumpPower;
    dino.jumping = true;
  }
}

function gameLoop(now) {
  if (gameState !== 'running') return;
  let dt = (now - lastFrame) / 16.67; // normalize to 60fps
  lastFrame = now;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Dino physics
  dino.y += dino.vy * dt;
  dino.vy += gravity * dt;
  if (dino.y >= groundY - dino.h) {
    dino.y = groundY - dino.h;
    dino.vy = 0;
    dino.jumping = false;
  }

  // Move obstacles
  for (let obs of obstacles) {
    obs.x -= speed * dt;
  }
  // Remove obstacles that are off-screen
  obstacles = obstacles.filter((obs) => obs.x + obs.w > 0);

  // Add new obstacles — always spawn outside the right edge
  // Distance between obstacles decreases as score increases (progression)
  let progression = Math.max(0.5, 1 - score / 1000); // from 1 to 0.5
  let minGap = width * (0.18 * progression + 0.1); // from 0.28w to 0.19w
  let maxGap = width * (0.32 * progression + 0.16); // from 0.48w to 0.32w

  if (
    obstacles.length === 0 ||
    obstacles[obstacles.length - 1].x < width * 0.6
  ) {
    let h = height * (0.07 + Math.random() * 0.07);
    let w = h * (0.3 + Math.random() * 0.2);
    let gap = minGap + Math.random() * (maxGap - minGap);
    let x =
      obstacles.length === 0
        ? width + gap
        : Math.max(
            width + gap,
            obstacles[obstacles.length - 1].x +
              obstacles[obstacles.length - 1].w +
              gap,
          );
    obstacles.push({
      x,
      y: groundY - h,
      w,
      h,
    });
  }

  // Collision detection
  for (let obs of obstacles) {
    if (
      dino.x < obs.x + obs.w &&
      dino.x + dino.w > obs.x &&
      dino.y < obs.y + obs.h &&
      dino.y + dino.h > obs.y
    ) {
      gameOver();
      return;
    }
  }

  // Score and progression (speed up)
  score += Math.floor(dt);
  speed = width * (0.012 + 0.008 * Math.min(1, score / 1000)); // from 0.012 to 0.02
}

function draw() {
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  // Ground
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Obstacles
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  for (let obs of obstacles) {
    ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
  }

  // Dino
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(dino.x, dino.y, dino.w, dino.h);

  // Score
  if (gameState !== 'gameover') {
    ctx.fillStyle = '#111';
    ctx.font = `${Math.floor(height * 0.35)}px monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${score}`, 0, 0);
  }

  // Button
  ctx.fillStyle = '#eee';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.fillRect(buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h);
  ctx.strokeRect(buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h);
  ctx.fillStyle = '#111';
  ctx.font = `${Math.floor(height * 0.1)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let btnText = '';
  if (gameState === 'start') btnText = 'START';
  else if (gameState === 'running') btnText = 'JUMP';
  else if (gameState === 'gameover') btnText = 'RESTART';
  ctx.fillText(
    btnText,
    buttonRect.x + buttonRect.w / 2,
    buttonRect.y + buttonRect.h / 2,
  );

  // Game over text
  if (gameState === 'gameover') {
    ctx.fillStyle = '#111';
    ctx.font = `${Math.floor(height * 0.18)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', width / 2, height * 0.3);
    ctx.font = `${Math.floor(height * 0.18)}px monospace`;
    ctx.fillText(`Score: ${bestScore}`, width / 2, height * 0.5);
  }
}
