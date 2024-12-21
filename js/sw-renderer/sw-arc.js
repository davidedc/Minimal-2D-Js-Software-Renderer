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

// TODO note that if the stroke is fully opaque, then it can be drawn with a single pass
// rather than the current two-pass approach (collect all stroke pixels, then draw them).

function addStrokePixel(strokePixels, x, y) {
  strokePixels.add(`${x},${y}`);
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
