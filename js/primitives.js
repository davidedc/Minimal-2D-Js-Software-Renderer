// Basic drawing primitives (lines and rectangles)
function drawLine(x1, y1, x2, y2, thickness, r, g, b, a) {
  if (thickness === 1) {
    drawLine1px(x1, y1, x2, y2, r, g, b, a);
  } else {
    drawThickLine(x1, y1, x2, y2, thickness, r, g, b, a);
  }
}

function drawLine1px(x1, y1, x2, y2, r, g, b, a) {
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

function drawThickLine(x1, y1, x2, y2, thickness, r, g, b, a) {
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

function drawRotatedRect(centerX, centerY, width, height, rotation, 
                        strokeR, strokeG, strokeB, strokeA, 
                        fillR, fillG, fillB, fillA, strokeWidth) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  
  const points = [
    [-width/2, -height/2],
    [width/2, -height/2],
    [width/2, height/2],
    [-width/2, height/2]
  ].map(([x, y]) => ({
    x: centerX + x * cos - y * sin,
    y: centerY + x * sin + y * cos
  }));

  if (fillA > 0) {
    const minX = Math.floor(Math.min(...points.map(p => p.x)));
    const maxX = Math.ceil(Math.max(...points.map(p => p.x)));
    const minY = Math.floor(Math.min(...points.map(p => p.y)));
    const maxY = Math.ceil(Math.max(...points.map(p => p.y)));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (pointInPolygon(x, y, points)) {
          setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }
  }

  if (strokeA > 0) {
    if (strokeWidth === 1) {
      for (let i = 0; i < 4; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 4];
        drawLine1px(
          p1.x, p1.y,
          p2.x, p2.y,
          strokeR, strokeG, strokeB, strokeA
        );
      }
    } else {
      const halfStroke = strokeWidth / 2;

      for (let i = 0; i < 4; i += 2) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 4];
        const line = extendLine(p1, p2, halfStroke);
        
        drawThickLine(
          line.start.x, line.start.y,
          line.end.x, line.end.y,
          strokeWidth,
          strokeR, strokeG, strokeB, strokeA
        );
      }

      for (let i = 1; i < 4; i += 2) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 4];
        const line = shortenLine(p1, p2, halfStroke);
        
        drawThickLine(
          line.start.x, line.start.y,
          line.end.x, line.end.y,
          strokeWidth,
          strokeR, strokeG, strokeB, strokeA
        );
      }
    }
  }
}

function drawAxisAlignedRect(centerX, centerY, rectWidth, rectHeight,
                           strokeR, strokeG, strokeB, strokeA,
                           fillR, fillG, fillB, fillA,
                           strokeWidth) {
  centerX = Math.round(centerX);
  centerY = Math.round(centerY);
  rectWidth = Math.round(rectWidth);
  rectHeight = Math.round(rectHeight);
  strokeWidth = Math.round(strokeWidth);

  const halfWidth = Math.floor(rectWidth / 2);
  const halfHeight = Math.floor(rectHeight / 2);
  
  const left = centerX - halfWidth;
  const right = left + rectWidth - 1;
  const top = centerY - halfHeight;
  const bottom = top + rectHeight - 1;

  if (fillA > 0) {
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        setPixel(x, y, fillR, fillG, fillB, fillA);
      }
    }
  }

  if (strokeA > 0 && strokeWidth > 0) {
    const halfStroke = Math.floor(strokeWidth / 2);
    
    for (let y = top - halfStroke; y <= bottom + halfStroke; y++) {
      for (let x = left - halfStroke; x <= right + halfStroke; x++) {
        if (y >= top - halfStroke && y <= top + halfStroke) {
          setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
        }
        else if (y >= bottom - halfStroke && y <= bottom + halfStroke) {
          setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
        }
        else if (x >= left - halfStroke && x <= left + halfStroke) {
          setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
        }
        else if (x >= right - halfStroke && x <= right + halfStroke) {
          setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
        }
      }
    }
  }
}

function plotThickPoint(x, y, r, g, b, a, thickness) {
  const halfThick = Math.floor(thickness / 2);
  for (let dy = -halfThick; dy < thickness - halfThick; dy++) {
    for (let dx = -halfThick; dx < thickness - halfThick; dx++) {
      setPixel(x + dx, y + dy, r, g, b, a);
    }
  }
}

function circlePlotPoints(xc, yc, x, y, r, g, b, a, thickness) {
  // Plot all octants
  plotThickPoint(xc + x, yc + y, r, g, b, a, thickness);
  plotThickPoint(xc - x, yc + y, r, g, b, a, thickness);
  plotThickPoint(xc + x, yc - y, r, g, b, a, thickness);
  plotThickPoint(xc - x, yc - y, r, g, b, a, thickness);
  plotThickPoint(xc + y, yc + x, r, g, b, a, thickness);
  plotThickPoint(xc - y, yc + x, r, g, b, a, thickness);
  plotThickPoint(xc + y, yc - x, r, g, b, a, thickness);
  plotThickPoint(xc - y, yc - x, r, g, b, a, thickness);
}

function drawCircle(xc, yc, radius, r, g, b, a, fill = false, thickness = 1) {
  if (fill) {
    const radiusSquared = (radius - 0.5) * (radius - 0.5);
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radiusSquared) {
          setPixel(xc + x, yc + y, r, g, b, a);
        }
      }
    }
  }

  if (!fill || thickness > 0) {
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;

    while (y >= x) {
      circlePlotPoints(xc, yc, x, y, r, g, b, a, thickness);
      x++;

      if (d > 0) {
        y--;
        d = d + 4 * (x - y) + 10;
      } else {
        d = d + 4 * x + 6;
      }
    }
  }
}