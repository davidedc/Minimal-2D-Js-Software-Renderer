// Basic drawing primitives (lines and rectangles)
function drawLine(x1, y1, x2, y2, thickness, r, g, b, a) {
  if (thickness === 1) {
    drawLine1px(x1, y1, x2, y2, r, g, b, a);
  } else {
    drawThickLine(x1, y1, x2, y2, thickness, r, g, b, a);
  }
}

function drawLine1px(x1, y1, x2, y2, r, g, b, a) {

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

function drawThickLine(x1, y1, x2, y2, thickness, r, g, b, a) {

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

function drawRotatedRect(centerX, centerY, width, height, rotation,
  strokeR, strokeG, strokeB, strokeA,
  fillR, fillG, fillB, fillA, strokeWidth) {
  
  // tweaks to make the sw render more closely match the canvas render
  
  // This would be to use the thin line drawing function more often
  // as it's neater, but it leaves some gaps between the line and the fill
  // which renders the overall result worse.
  //if (Math.floor(strokeWidth) === 1)
  //  strokeWidth = 1;
  
  if (rotation === 0) {
    // Use specialized axis-aligned version
    drawAxisAlignedRectSW(
      centerX, centerY, width, height,
      strokeR, strokeG, strokeB, strokeA,
      fillR, fillG, fillB, fillA,
      strokeWidth
      );
    return;
  }

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



// Helper function for consistent rounding behavior
function roundPoint(x, y) {
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

// Draw axis-aligned rectangle using Canvas API with precise pixel alignment
function drawAxisAlignedRectCanvas(ctx, shape) {
  const { center, width, height, strokeWidth, strokeColor, fillColor } = shape;
  
  // Round all inputs
  const centerX = Math.round(center.x);
  const centerY = Math.round(center.y);
  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);
  const roundedStrokeWidth = Math.round(strokeWidth);

  const halfWidth = Math.floor(roundedWidth / 2);
  const halfHeight = Math.floor(roundedHeight / 2);
  
  const pathLeft = centerX - halfWidth;
  const pathTop = centerY - halfHeight;

  // Draw fill first
  if (fillColor.a > 0) {
      ctx.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillColor.a / 255})`;
      const inset = Math.ceil(roundedStrokeWidth / 2) - 1;
      ctx.fillRect(
          pathLeft + inset + 1,
          pathTop + inset + 1,
          roundedWidth - 2 * (inset + 1),
          roundedHeight - 2 * (inset + 1)
      );
  }

  // Then draw stroke
  if (strokeColor.a > 0 && roundedStrokeWidth > 0) {
      ctx.lineWidth = roundedStrokeWidth;
      ctx.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
      
      const strokeOffset = roundedStrokeWidth % 2 === 0 ? 0 : 0.5;
      ctx.strokeRect(
          pathLeft + strokeOffset,
          pathTop + strokeOffset,
          roundedWidth - 2 * strokeOffset,
          roundedHeight - 2 * strokeOffset
      );
  }
}

// Draw axis-aligned rectangle using software rendering
function drawAxisAlignedRectSW(centerX, centerY, rectWidth, rectHeight,
  strokeR, strokeG, strokeB, strokeA,
  fillR, fillG, fillB, fillA,
  strokeWidth) {
  
  // Round all inputs
  centerX = Math.round(centerX);
  centerY = Math.round(centerY);
  rectWidth = Math.round(rectWidth);
  rectHeight = Math.round(rectHeight);
  strokeWidth = Math.round(strokeWidth);

  const halfWidth = Math.floor(rectWidth / 2);
  const halfHeight = Math.floor(rectHeight / 2);
  
  const pathLeft = centerX - halfWidth;
  const pathTop = centerY - halfHeight;
  const pathRight = pathLeft + rectWidth;
  const pathBottom = pathTop + rectHeight;

  // Draw fill first
  if (fillA > 0) {
      const inset = Math.ceil(strokeWidth / 2) - 1;
      const fillLeft = pathLeft + inset + 1;
      const fillRight = pathRight - inset - 1;
      const fillTop = pathTop + inset + 1;
      const fillBottom = pathBottom - inset - 1;
      
      for (let y = fillTop; y < fillBottom; y++) {
          for (let x = fillLeft; x < fillRight; x++) {
              setPixel(x, y, fillR, fillG, fillB, fillA);
          }
      }
  }

  // Then draw stroke
  if (strokeA > 0 && strokeWidth > 0) {
      const outsetStroke = Math.floor(strokeWidth / 2);
      const insetStroke = Math.ceil(strokeWidth / 2);

      const strokeOuterLeft = pathLeft - outsetStroke;
      const strokeOuterRight = pathRight + outsetStroke;
      const strokeOuterTop = pathTop - outsetStroke;
      const strokeOuterBottom = pathBottom + outsetStroke;

      const strokeInnerLeft = pathLeft + insetStroke;
      const strokeInnerRight = pathRight - insetStroke;
      const strokeInnerTop = pathTop + insetStroke;
      const strokeInnerBottom = pathBottom - insetStroke;

      // Draw all pixels that are within stroke distance of the path
      for (let y = strokeOuterTop; y < strokeOuterBottom; y++) {
          for (let x = strokeOuterLeft; x < strokeOuterRight; x++) {
              // Skip the inner rectangle (area beyond stroke width)
              if (x >= strokeInnerLeft && x < strokeInnerRight && 
                  y >= strokeInnerTop && y < strokeInnerBottom) {
                  continue;
              }
              setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
      }
  }
}


function addThickPoint(strokePixels, x, y, thickness) {
  const halfThick = Math.floor(thickness / 2);
  for (let dy = -halfThick; dy < thickness - halfThick; dy++) {
      for (let dx = -halfThick; dx < thickness - halfThick; dx++) {
          addStrokePixel(strokePixels, Math.round(x + dx), Math.round(y + dy));
      }
  }
}

function addThickArcPoint(strokePixels, xc, yc, x, y, thickness, startAngle, endAngle) {
  const halfThick = Math.floor(thickness / 2);
  for (let dy = -halfThick; dy < thickness - halfThick; dy++) {
      for (let dx = -halfThick; dx < thickness - halfThick; dx++) {
          // Check if this thick point pixel is within the arc's angle range
          const strokeX = x + dx;
          const strokeY = y + dy;
          let angle = Math.atan2(strokeY - yc, strokeX - xc);
          if (angle < 0) angle += 2 * Math.PI;
          if (angle < startAngle) angle += 2 * Math.PI;
          if (angle >= startAngle && angle <= endAngle) {
              strokePixels.add(`${Math.round(strokeX)},${Math.round(strokeY)}`);
          }
      }
  }
}

// TODO note that if the stroke is fully opaque, then it can be drawn with a single pass
// rather than the current two-pass approach (collect all stroke pixels, then draw them).
function drawArcSW(xc, yc, radius, startAngle, endAngle, r, g, b, a, fill = false, thickness = 1) {
  // Convert angles from degrees to radians
  startAngle = (startAngle % 360) * Math.PI / 180;
  endAngle = (endAngle % 360) * Math.PI / 180;
  
  // Ensure endAngle is greater than startAngle
  if (endAngle < startAngle) {
      endAngle += 2 * Math.PI;
  }
  
  // Apply the same tweaks as in circle drawing
  if (thickness > 1)
    thickness *= 0.75;
  xc -= 1;
  yc -= 1;
  //radius *= 1.015;

  // Helper function to check if an angle is within the specified range
  function isAngleInRange(px, py) {
      let angle = Math.atan2(py, px);
      if (angle < 0) angle += 2 * Math.PI;
      if (angle < startAngle) angle += 2 * Math.PI;
      return angle >= startAngle && angle <= endAngle;
  }

  if (fill) {
      const radiusSquared = (radius - 0.5) * (radius - 0.5);
      for (let y = -radius; y <= radius; y++) {
          for (let x = -radius; x <= radius; x++) {
              if (x * x + y * y <= radiusSquared && isAngleInRange(x, y)) {
                  setPixel(Math.round(xc + x), Math.round(yc + y), Math.round(r), g, b, a);
              }
          }
      }
  }

  if (!fill || thickness > 0) {
      // Collect all stroke pixels first
      const strokePixels = new Set();
      let x = 0;
      let y = radius;
      let d = 3 - 2 * radius;
      
      while (y >= x) {
          const points = [
              [x, y], [-x, y], [x, -y], [-x, -y],
              [y, x], [-y, x], [y, -x], [-y, -x]
          ];
          
          points.forEach(([px, py]) => {
              if (isAngleInRange(px, py)) {
                  // Pass center coordinates and angles to addThickArcPoint
                  addThickArcPoint(strokePixels, xc, yc, xc + px, yc + py, thickness, startAngle, endAngle);
              }
          });
          
          x++;
          if (d > 0) {
              y--;
              d = d + 4 * (x - y) + 10;
          } else {
              d = d + 4 * x + 6;
          }
      }

      // Now render each pixel exactly once
      for (let pixel of strokePixels) {
          const [x, y] = pixel.split(',').map(Number);
          setPixel(x, y, r, g, b, a);
      }
  }
}

function addStrokePixel(strokePixels, x, y) {
  strokePixels.add(`${x},${y}`);
}

function circlePlotPoints(strokePixels, xc, yc, x, y, thickness) {
  addThickPoint(strokePixels, xc + x, yc + y, thickness);
  addThickPoint(strokePixels, xc - x, yc + y, thickness);
  addThickPoint(strokePixels, xc + x, yc - y, thickness);
  addThickPoint(strokePixels, xc - x, yc - y, thickness);
  addThickPoint(strokePixels, xc + y, yc + x, thickness);
  addThickPoint(strokePixels, xc - y, yc + x, thickness);
  addThickPoint(strokePixels, xc + y, yc - x, thickness);
  addThickPoint(strokePixels, xc - y, yc - x, thickness);
}

// TODO note that if the stroke is fully opaque, then it can be drawn with a single pass
// rather than the current two-pass approach (collect all stroke pixels, then draw them).
function drawCircleBresenham(xc, yc, radius, r, g, b, a, fill = false, thickness = 1) {

  // tweaks to make the sw render more closely match the canvas render
  if (thickness > 1)
    thickness *= 0.75;
  xc-= 1;
  yc-= 1;
  //radius *= 1.015;

  if (fill) {
    const radiusSquared = (radius - 0.5) * (radius - 0.5);
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radiusSquared) {
          setPixel(Math.round(xc + x), Math.round(yc + y), Math.round(r), g, b, a);
        }
      }
    }
  }

  if (!fill || thickness > 0) {
    // Collect all stroke pixels first
    const strokePixels = new Set();
    let x = 0;
    let y = radius;
    let d = 3 - 2 * radius;

    while (y >= x) {
      circlePlotPoints(strokePixels, xc, yc, x, y, thickness);
      x++;

      if (d > 0) {
        y--;
        d = d + 4 * (x - y) + 10;
      } else {
        d = d + 4 * x + 6;
      }
    }

    // Now render each pixel exactly once
    for (let pixel of strokePixels) {
        const [x, y] = pixel.split(',').map(Number);
        setPixel(x, y, r, g, b, a);
    }
  }
}

function drawCircleHQ(xc, yc, radius, r, g, b, a, fill = false, thickness = 1) {
  drawArcHQ(xc, yc, radius, 0, 360, r, g, b, a, fill, thickness);
}

// Add a high-quality arc drawing function
function drawArcHQ(xc, yc, radius, startAngle, endAngle, r, g, b, a, fill = false, thickness = 1) {
  // Convert angles to radians
  startAngle = (startAngle % 360) * Math.PI / 180;
  endAngle = (endAngle % 360) * Math.PI / 180;
  
  if (endAngle < startAngle) {
      endAngle += 2 * Math.PI;
  }

  // Apply the same adjustments as original HQ circle
  thickness *= 0.5;
  xc -= 0.5;
  yc -= 0.5;
  radius = Math.floor(radius) + 0.5;
  
  xc = Math.round(xc);
  yc = Math.round(yc);
  
  const minX = Math.floor(xc - radius - thickness);
  const maxX = Math.ceil(xc + radius + thickness);
  const minY = Math.floor(yc - radius - thickness);
  const maxY = Math.ceil(yc + radius + thickness);
  
  function isAngleInRange(px, py) {
      let angle = Math.atan2(py, px);
      if (angle < 0) angle += 2 * Math.PI;
      if (angle < startAngle) angle += 2 * Math.PI;
      return angle >= startAngle && angle <= endAngle;
  }
  
  const radiusSquared = radius * radius;
  
  if (fill) {
      for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
              const dx = x - xc;
              const dy = y - yc;
              const distSquared = dx * dx + dy * dy;
              
              if (distSquared <= radiusSquared && isAngleInRange(dx, dy)) {
                  setPixel(x, y, r, g, b, a);
              }
          }
      }
  }
  
  if (thickness > 0) {
      for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
              const dx = x - xc;
              const dy = y - yc;
              const distSquared = dx * dx + dy * dy;
              
              const distFromPath = Math.abs(Math.sqrt(distSquared) - radius);
              if (distFromPath <= thickness && isAngleInRange(dx, dy)) {
                  setPixel(x, y, r, g, b, a);
              }
          }
      }
  }
}