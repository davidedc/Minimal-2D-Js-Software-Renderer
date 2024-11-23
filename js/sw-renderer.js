// Shape drawing functions with standardized signatures
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

function drawRectSW(shape) {
  const {
    center, width, height, rotation,
    strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
    fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  if (rotation === 0) {
    drawAxisAlignedRectSW(center.x, center.y, width, height,
      strokeWidth, strokeR, strokeG, strokeB, strokeA,
      fillR, fillG, fillB, fillA);
  } else {
    drawRotatedRectSW(center.x, center.y, width, height, rotation,
      strokeWidth, strokeR, strokeG, strokeB, strokeA,
      fillR, fillG, fillB, fillA);
  }
}

function drawRotatedRectSW(centerX, centerY, width, height, rotation, strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const points = [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2]
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
        drawLineSW1px(
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

        drawLineSWThick(
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

        drawLineSWThick(
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
  strokeWidth, strokeR, strokeG, strokeB, strokeA,
  fillR, fillG, fillB, fillA) {
  
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

function drawCircleSW(shape) {
  const {
    center, radius,
    strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
    fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  if (fillA > 0) {
    drawCircleSWHelper(center.x, center.y, radius,
      fillR, fillG, fillB, fillA, true);
  }
  if (strokeA > 0 && strokeWidth > 0) {
    drawCircleSWHelper(center.x, center.y, radius,
      strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
  }
}

function drawCircleSWHelper(centerX, centerY, radius, r, g, b, a, fill = false, thickness = 1) {

  // tweaks to make the sw render more closely match the canvas render
  if (thickness > 1)
    thickness *= 0.75;
  centerX-= 1;
  centerY-= 1;
  //radius *= 1.015;

  if (fill) {
    const radiusSquared = (radius - 0.5) * (radius - 0.5);
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radiusSquared) {
          setPixel(Math.round(centerX + x), Math.round(centerY + y), Math.round(r), g, b, a);
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
      circlePlotPoints(strokePixels, centerX, centerY, x, y, thickness);
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

function drawCircleSWHQ(xc, yc, radius, r, g, b, a, fill = false, thickness = 1) {
  drawArcSWHQ(xc, yc, radius, 0, 360, r, g, b, a, fill, thickness);
}

function drawArcSW(shape) {
  const {
    center, radius, startAngle, endAngle,
    strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
    fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  if (fillA > 0) {
    drawArcSWHelper(center.x, center.y, radius, startAngle, endAngle,
      fillR, fillG, fillB, fillA, true);
  }
  if (strokeA > 0 && strokeWidth > 0) {
    drawArcSWHelper(center.x, center.y, radius, startAngle, endAngle,
      strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
  }
}

function drawArcSWHelper(centerX, centerY, radius, startAngle, endAngle, r, g, b, a, fill = false, thickness = 1) {
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
  centerX -= 1;
  centerY -= 1;
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
                  setPixel(Math.round(centerX + x), Math.round(centerY + y), Math.round(r), g, b, a);
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
                  addThickArcPoint(strokePixels, centerX, centerY, centerX + px, centerY + py, thickness, startAngle, endAngle);
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

// TODO note that if the stroke is fully opaque, then it can be drawn with a single pass
// rather than the current two-pass approach (collect all stroke pixels, then draw them).

// Advantages -----------------------------------
// 
// O(r) complexity for unfilled circles, where r is radius
// Integer-only arithmetic is faster per operation
// Minimal overdraw due to Set-based pixel collection
// Efficient memory use for unfilled circles
//
// Disadvantages --------------------------------
// Two-pass approach requires extra memory
// Square-based thickness can cause irregular appearance
// O(r²) complexity when filling

// Add a high-quality arc drawing function
//
// High-quality arc drawing function
//
// Advantages -----------------------------------
// Single pass - no intermediate storage
// More accurate anti-aliasing potential
// Better handling of sub-pixel positioning
// Uniform thickness appearance
//
// Disadvantages --------------------------------
// O(r²) complexity always (scans full bounding box)
// Floating-point arithmetic is slower per operation
// More complex distance and angle calculations
// Higher memory bandwidth due to potential overdraw
function drawArcSWHQ(shape) {
  const {
    center, radius, startAngle, endAngle,
    strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
    fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  // tweaks to make the sw render more closely match the canvas render
  center.x -= 0.5;
  center.y -= 0.5;

  
  if (fillA > 0) {
    drawArcSWHQHelper(center.x, center.y, radius, startAngle, endAngle,
      fillR, fillG, fillB, fillA, true);
  }
  if (strokeA > 0 && strokeWidth > 0) {
    drawArcSWHQHelper(center.x, center.y, radius, startAngle, endAngle,
      strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
  }
}

function drawArcSWHQHelper(xc, yc, radius, startAngle, endAngle, r, g, b, a, fill = false, thickness = 1) {
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

function drawRoundedRectSW(shape) {
  const {
    center, width, height, radius, rotation,
    strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
    fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  if (rotation === 0) {
    // if the stroke is thin and opaque then use drawAxisAlignedRoundedRectThinOpaqueStrokeSW
    // otherwise use drawAxisAlignedRoundedRectThickTrasparentStrokeSW
    const correctedRadius = radius > 2 ? radius - 1 : radius;
    if (strokeWidth < 5 && strokeA === 255) {
      drawAxisAlignedRoundedRectThinOpaqueStrokeSW(center.x, center.y, width, height, correctedRadius,
        strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA);
    } else {
      drawAxisAlignedRoundedRectThickTrasparentStrokeSW(center.x, center.y, width, height, correctedRadius,
        strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA);
    }
  } else {
    drawRotatedRoundedRectSW(center.x, center.y, width, height, radius, rotation,
      strokeWidth, strokeR, strokeG, strokeB, strokeA,
      fillR, fillG, fillB, fillA);
  }
}

function getAlignedPosition(centerX, centerY, width, height, strokeWidth) {
  const offset = strokeWidth % 2 ? 0.5 : 0;
  const x = Math.floor(centerX - width/2) + offset;
  const y = Math.floor(centerY - height/2) + offset;
  return { x, y, w: Math.floor(width), h: Math.floor(height) };
}


function drawAxisAlignedRoundedRectThinOpaqueStrokeSW(centerX, centerY, rectWidth, rectHeight, cornerRadius,
  strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {
  
  const pos = getAlignedPosition(centerX, centerY, rectWidth, rectHeight, strokeWidth);
  const r = Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2);
  const halfStroke = strokeWidth / 2;

  function isInsideRoundedRect(px, py) {
    // Test if point is inside main rectangle
    if (px >= pos.x + r && px <= pos.x + pos.w - r && 
        py >= pos.y && py <= pos.y + pos.h) {
      return true;
    }
    if (px >= pos.x && px <= pos.x + pos.w && 
        py >= pos.y + r && py <= pos.y + pos.h - r) {
      return true;
    }

    // Test corners
    const corners = [
      { x: pos.x + r, y: pos.y + r },
      { x: pos.x + pos.w - r, y: pos.y + r },
      { x: pos.x + pos.w - r, y: pos.y + pos.h - r },
      { x: pos.x + r, y: pos.y + pos.h - r }
    ];
    
    for (const corner of corners) {
      const dx = px - corner.x;
      const dy = py - corner.y;
      if (dx * dx + dy * dy <= r * r) {
        return true;
      }
    }
    
    return false;
  }

  if (fillA > 0) {
    for (let yy = Math.floor(pos.y); yy <= Math.ceil(pos.y + pos.h); yy++) {
      for (let xx = Math.floor(pos.x); xx <= Math.ceil(pos.x + pos.w); xx++) {
        if (isInsideRoundedRect(xx, yy)) {
          setPixel(xx, yy, fillR, fillG, fillB, fillA);
        }
      }
    }
  }

  if (strokeA > 0) {
    // Horizontal strokes
    for (let xx = Math.floor(pos.x + r); xx < pos.x + pos.w - r; xx++)
      for (let t = -halfStroke; t < halfStroke; t++) {
        setPixel(xx, pos.y + t, strokeR, strokeG, strokeB, strokeA);
        setPixel(xx, pos.y + pos.h + t, strokeR, strokeG, strokeB, strokeA);
      }
    
    // Vertical strokes
    for (let yy = Math.floor(pos.y + r); yy < pos.y + pos.h - r; yy++)
      for (let t = -halfStroke; t < halfStroke; t++) {
        setPixel(pos.x + t, yy, strokeR, strokeG, strokeB, strokeA);
        setPixel(pos.x + pos.w + t, yy, strokeR, strokeG, strokeB, strokeA);
      }

    // Draw corner strokes
    const drawCorner = (cx, cy, startAngle, endAngle) => {
      for (let angle = startAngle; angle <= endAngle; angle += Math.PI/180) {
        for (let t = -halfStroke; t < halfStroke; t++) {
          const sr = r + t;
          const px = cx + sr * Math.cos(angle);
          const py = cy + sr * Math.sin(angle);
          setPixel(Math.round(px), Math.round(py), strokeR, strokeG, strokeB, strokeA);
        }
      }
    };

    drawCorner(pos.x + r, pos.y + r, Math.PI, Math.PI * 3/2);
    drawCorner(pos.x + pos.w - r, pos.y + r, Math.PI * 3/2, Math.PI * 2);
    drawCorner(pos.x + pos.w - r, pos.y + pos.h - r, 0, Math.PI/2);
    drawCorner(pos.x + r, pos.y + pos.h - r, Math.PI/2, Math.PI);
  }
}


// this function is rather more complicated. This is because the version for thin/opaque stroke can ignore the
// overdraw that happens when drawing the stroke at the corners. Simply, if the stoke is thin or opaque, then
// you don't see the overdraw. However, if the stroke is thick and/or transparent, then you do see the overdraw,
// so there is a complex system where the pixels of the stroke are first collected in a set, and then drawn to the
// screen. Not only that, but the stoke of the corners is actually kept in a set of scanlines, this is to avoid
// internal gaps that one can see using the current algorithm. Using scanlines, the internal gaps are filled in.
function drawAxisAlignedRoundedRectThickTrasparentStrokeSW(centerX, centerY, rectWidth, rectHeight, cornerRadius, 
                                    strokeWidth, strokeR, strokeG, strokeB, strokeA, 
                                    fillR, fillG, fillB, fillA) {
  const pos = getAlignedPosition(centerX, centerY, rectWidth, rectHeight, strokeWidth);
  const r = Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2);
  const halfStroke = strokeWidth / 2;

  function isInsideRoundedRect(px, py) {
    if (px >= pos.x + r && px <= pos.x + pos.w - r && py >= pos.y && py <= pos.y + pos.h) {
      return true;
    }
    if (px >= pos.x && px <= pos.x + pos.w && py >= pos.y + r && py <= pos.y + pos.h - r) {
      return true;
    }
    
    const corners = [
      { x: pos.x + r, y: pos.y + r },
      { x: pos.x + pos.w - r, y: pos.y + r },
      { x: pos.x + pos.w - r, y: pos.y + pos.h - r },
      { x: pos.x + r, y: pos.y + pos.h - r }
    ];
    
    for (const corner of corners) {
      const dx = px - corner.x;
      const dy = py - corner.y;
      if (dx * dx + dy * dy <= r * r) {
        return true;
      }
    }
    return false;
  }

  // Fill - direct to buffer
  if (fillA > 0) {
    for (let yy = Math.floor(pos.y); yy <= Math.ceil(pos.y + pos.h); yy++) {
      for (let xx = Math.floor(pos.x); xx <= Math.ceil(pos.x + pos.w); xx++) {
        if (isInsideRoundedRect(xx, yy)) {
          setPixel(xx, yy, fillR, fillG, fillB, fillA);
        }
      }
    }
  }

  // Stroke - using PixelSet to handle overdraw
  if (strokeA > 0) {
    const strokePixels = new PixelSet();
    
    // Horizontal strokes
    const horizontalStrokes = new ScanlineSpans();
    for (let y = pos.y - halfStroke; y < pos.y + halfStroke; y++) {
      //for (let x = pos.x + r; x <= pos.x + pos.w - r; x++) {
      //  horizontalStrokes.addPixel(x, y);
      //}
      // instead of using addPixel, use addSpan as it's quicker
      horizontalStrokes.addSpan(y, pos.x + r, pos.x + pos.w - r);
    }
    for (let y = pos.y + pos.h - halfStroke; y < pos.y + pos.h + halfStroke; y++) {
      //for (let x = pos.x + r; x <= pos.x + pos.w - r; x++) {
      //  horizontalStrokes.addPixel(x, y);
      //}
      // instead of using addPixel, use addSpan as it's quicker
      horizontalStrokes.addSpan(y, pos.x + r, pos.x + pos.w - r);
    }
    horizontalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);

    // Vertical strokes - separate ScanlineSpans for left and right
    const leftVerticalStrokes = new ScanlineSpans();
    const rightVerticalStrokes = new ScanlineSpans();
    
    for (let y = pos.y + r; y < pos.y + pos.h - r; y++) {
      // Left vertical stroke
      for (let x = pos.x - halfStroke; x < pos.x + halfStroke; x++) {
        leftVerticalStrokes.addPixel(x, y);
      }
      // Right vertical stroke
      for (let x = pos.x + pos.w - halfStroke; x < pos.x + pos.w + halfStroke; x++) {
        rightVerticalStrokes.addPixel(x, y);
      }
    }
    leftVerticalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);
    rightVerticalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);

    // Corner strokes
    const drawCornerSpans = (cx, cy, startAngle, endAngle) => {
      const cornerSpans = new ScanlineSpans();
      const innerRadius = r - halfStroke;

      // Use small enough angle step. Note that any internal gaps will be filled by how
      // we keep the scanlines in the ScanlineSpans object.
      // However you could still see jagged borders of the stroke if the angle step is too large.
      const angleStep = Math.PI / 180;     
      for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
        // Sample points across stroke width
        for (let t = -halfStroke; t < halfStroke; t ++) {
          const sr = r + t;
          const px = cx + sr * Math.cos(angle);
          const py = cy + sr * Math.sin(angle);
          cornerSpans.addPixel(px, py);
        }
      }
      cornerSpans.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);
    };

    // Draw all corners
    drawCornerSpans(pos.x + r, pos.y + r, Math.PI , Math.PI * 3/2 );
    drawCornerSpans(pos.x + pos.w - r, pos.y + r, Math.PI * 3/2 , Math.PI * 2);
    drawCornerSpans(pos.x + pos.w - r, pos.y + pos.h - r, 0 , Math.PI/2 );
    drawCornerSpans(pos.x + r, pos.y + pos.h - r, Math.PI/2 , Math.PI );

    // Paint all stroke pixels after collecting them
    strokePixels.paint();
  }
}

// Doesn't really work very well yet, some artifacts remaining.
function drawRotatedRoundedRectSW(centerX, centerY, width, height, radius, rotation,
  strokeWidth, strokeR, strokeG, strokeB, strokeA,
  fillR, fillG, fillB, fillA) {
  
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Calculate corner centers (these stay fixed)
  const cornerCenters = [
      [-halfWidth + radius, -halfHeight + radius], // Top-left
      [halfWidth - radius, -halfHeight + radius],  // Top-right
      [halfWidth - radius, halfHeight - radius],   // Bottom-right
      [-halfWidth + radius, halfHeight - radius]   // Bottom-left
  ].map(([x, y]) => ({
      x: centerX + x * cos - y * sin,
      y: centerY + x * sin + y * cos
  }));

  // Calculate edge directions
  const edges = cornerCenters.map((start, i) => {
      const end = cornerCenters[(i + 1) % 4];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      return {
          dx: dx / len,
          dy: dy / len
      };
  });

  // Calculate stroke endpoints with proper perpendicular offset
  const strokePoints = cornerCenters.map((center, i) => {
      const prevEdge = edges[(i + 3) % 4];
      const nextEdge = edges[i];
      
      // Perpendicular vectors to edges
      const prev = { x: -prevEdge.dy, y: prevEdge.dx };
      const next = { x: -nextEdge.dy, y: nextEdge.dx };
      
      return {
          start: {
              x: center.x - radius * prev.x,
              y: center.y - radius * prev.y
          },
          end: {
              x: center.x - radius * next.x,
              y: center.y - radius * next.y
          }
      };
  });

  // Draw fill if needed with the new approach
  if (fillA > 0) {
      // 1. Draw the central rectangle
      const centralPoints = [
          [-halfWidth + radius, -halfHeight + radius], // Top-left
          [halfWidth - radius, -halfHeight + radius],  // Top-right
          [halfWidth - radius, halfHeight - radius],   // Bottom-right
          [-halfWidth + radius, halfHeight - radius]   // Bottom-left
      ].map(([x, y]) => ({
          x: centerX + x * cos - y * sin,
          y: centerY + x * sin + y * cos
      }));

      fillPolygon(centralPoints, fillR, fillG, fillB, fillA);

      // 2. Draw the four side rectangles
      const sideRects = [
          // Top rectangle
          [
              [-halfWidth + radius, -halfHeight],
              [halfWidth - radius, -halfHeight],
              [halfWidth - radius, -halfHeight + radius],
              [-halfWidth + radius, -halfHeight + radius]
          ],
          // Right rectangle
          [
              [halfWidth - radius, -halfHeight + radius],
              [halfWidth, -halfHeight + radius],
              [halfWidth, halfHeight - radius],
              [halfWidth - radius, halfHeight - radius]
          ],
          // Bottom rectangle
          [
              [-halfWidth + radius, halfHeight - radius],
              [halfWidth - radius, halfHeight - radius],
              [halfWidth - radius, halfHeight],
              [-halfWidth + radius, halfHeight]
          ],
          // Left rectangle
          [
              [-halfWidth, -halfHeight + radius],
              [-halfWidth + radius, -halfHeight + radius],
              [-halfWidth + radius, halfHeight - radius],
              [-halfWidth, halfHeight - radius]
          ]
      ];

      // Draw each side rectangle
      sideRects.forEach(points => {
          const transformedPoints = points.map(([x, y]) => ({
              x: centerX + x * cos - y * sin,
              y: centerY + x * sin + y * cos
          }));
          fillPolygon(transformedPoints, fillR, fillG, fillB, fillA);
      });

      // 3. Fill corner arcs
      const rotationDegrees = rotation * 180 / Math.PI;
      cornerCenters.forEach((center, i) => {
          const baseAngles = [
              [180, 270], // Top-left
              [270, 360], // Top-right
              [0, 90],    // Bottom-right
              [90, 180]   // Bottom-left
          ][i];
          
          const startAngle = (baseAngles[0] + rotationDegrees) % 360;
          const endAngle = (baseAngles[1] + rotationDegrees) % 360;
          
          drawArcSWHelper(center.x, center.y, radius,
              startAngle, endAngle,
              fillR, fillG, fillB, fillA, true);
      });
  }

  // Draw stroke if needed (stroke implementation remains unchanged)
  if (strokeA > 0) {
      // Draw straight edges between the correct points
      for (let i = 0; i < 4; i++) {
          const currentPoint = strokePoints[i];
          const nextPoint = strokePoints[(i + 1) % 4];
          
          drawLineSWThick(
              currentPoint.end.x, currentPoint.end.y,
              nextPoint.start.x, nextPoint.start.y,
              strokeWidth, strokeR, strokeG, strokeB, strokeA
          );
      }

      // Draw corner arcs
      const rotationDegrees = rotation * 180 / Math.PI;
      cornerCenters.forEach((center, i) => {
          const baseAngles = [
              [180, 270], // Top-left
              [270, 360], // Top-right
              [0, 90],    // Bottom-right
              [90, 180]   // Bottom-left
          ][i];
          
          const startAngle = (baseAngles[0] + rotationDegrees) % 360;
          const endAngle = (baseAngles[1] + rotationDegrees) % 360;
          
          drawArcSWHelper(center.x, center.y, radius,
              startAngle, endAngle,
              strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
      });
  }
}

// Helper function to fill a polygon
function fillPolygon(points, r, g, b, a) {
    const minX = Math.floor(Math.min(...points.map(p => p.x)));
    const maxX = Math.ceil(Math.max(...points.map(p => p.x)));
    const minY = Math.floor(Math.min(...points.map(p => p.y)));
    const maxY = Math.ceil(Math.max(...points.map(p => p.y)));

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (pointInPolygon(x, y, points)) {
                setPixel(x, y, r, g, b, a);
            }
        }
    }
}

