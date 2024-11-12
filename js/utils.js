// Utility functions for pixel manipulation and math operations
const width = 600;
const height = 600;
const frameBuffer = new Uint8ClampedArray(width * height * 4);

function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = (y * width + x) * 4;
  
  const alpha = a / 255;
  const oldAlpha = frameBuffer[index + 3] / 255;
  const newAlpha = alpha + oldAlpha * (1 - alpha);
  
  if (newAlpha > 0) {
    frameBuffer[index] = (r * alpha + frameBuffer[index] * oldAlpha * (1 - alpha)) / newAlpha;
    frameBuffer[index + 1] = (g * alpha + frameBuffer[index + 1] * oldAlpha * (1 - alpha)) / newAlpha;
    frameBuffer[index + 2] = (b * alpha + frameBuffer[index + 2] * oldAlpha * (1 - alpha)) / newAlpha;
    frameBuffer[index + 3] = newAlpha * 255;
  }
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function extendLine(p1, p2, amount) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return { start: p1, end: p2 };
  
  const dirX = dx / len;
  const dirY = dy / len;
  
  return {
    start: {
      x: p1.x - dirX * amount,
      y: p1.y - dirY * amount
    },
    end: {
      x: p2.x + dirX * amount,
      y: p2.y + dirY * amount
    }
  };
}

function shortenLine(p1, p2, amount) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return { start: p1, end: p2 };
  
  const dirX = dx / len;
  const dirY = dy / len;
  
  return {
    start: {
      x: p1.x + dirX * amount,
      y: p1.y + dirY * amount
    },
    end: {
      x: p2.x - dirX * amount,
      y: p2.y - dirY * amount
    }
  };
}