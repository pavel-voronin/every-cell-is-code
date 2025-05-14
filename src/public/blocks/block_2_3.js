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
      payload: {
        bitmap,
      },
    },
    [bitmap],
  );

  angle += 0.01;
}
