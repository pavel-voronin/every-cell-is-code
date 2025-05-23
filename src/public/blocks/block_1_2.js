function onPointerDown() {
  self.sendSignal({
    to: [origin[0] + 2, origin[1]],
    payload: {
      text: 'Hello from block 1.2',
    },
  });

  return false;
}

function onUpdate(delta) {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
}
