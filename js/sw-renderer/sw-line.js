function drawLineSW(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
  if (strokeWidth === 1) {
    drawLineSW1px(x1, y1, x2, y2, strokeR, strokeG, strokeB, strokeA);
  } else {
    drawLineSWThick(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA);
  }
}

function drawLineSW1px(x1, y1, x2, y2, r, g, b, a) {

  // tweaks to make the sw render more closely match the canvas render
  x1 -= 0.5;
  y1 -= 0.5;
  x2 -= 0.5;
  y2 -= 0.5;
  
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  x2 = Math.round(x2);
  y2 = Math.round(y2);
  
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    setPixel(x1, y1, r, g, b, a);
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x1 += sx; }
    if (e2 < dx) { err += dx; y1 += sy; }
  }
}

function drawLineSWThick(x1, y1, x2, y2, thickness, r, g, b, a) {

  // tweaks to make the sw render more closely match the canvas render
  x1 -= 0.5;
  y1 -= 0.5;
  x2 -= 0.5;
  y2 -= 0.5;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return;
  
  const perpX = -dy / length;
  const perpY = dx / length;
  
  const halfThickness = thickness / 2;
  const corners = [
    [x1 + perpX * halfThickness, y1 + perpY * halfThickness],
    [x1 - perpX * halfThickness, y1 - perpY * halfThickness],
    [x2 + perpX * halfThickness, y2 + perpY * halfThickness],
    [x2 - perpX * halfThickness, y2 - perpY * halfThickness]
  ];
  
  const minX = Math.floor(Math.min(...corners.map(c => c[0])));
  const maxX = Math.ceil(Math.max(...corners.map(c => c[0])));
  const minY = Math.floor(Math.min(...corners.map(c => c[1])));
  const maxY = Math.ceil(Math.max(...corners.map(c => c[1])));
  
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x - x1;
      const py = y - y1;
      const dot = (px * dx + py * dy) / length;
      const projX = (dx / length) * dot;
      const projY = (dy / length) * dot;
      const distX = px - projX;
      const distY = py - projY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      
      if (dot >= 0 && dot <= length && dist <= halfThickness) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }
}

