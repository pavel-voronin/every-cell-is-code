function onPointerDown() {
  self.postMessage({
    type: 'message',
    to: [origin[0] + 2, origin[1]],
    radius: 0,
    // topic: 'newcomers',
    payload: {
      text: 'Hello from block 1.2',
    },
  });
}

function onUpdate(delta) {
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  const bitmap = canvas.transferToImageBitmap();
  self.postMessage(
    {
      type: 'draw',
      payload: {
        bitmap,
      },
    },
    [bitmap],
  );
}
