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

class ScanlineSpans {
  constructor() {
    // Map y-coordinate to [min_x, max_x]
    this.spans = new Map();
  }

  addSpan(y, x1, x2) {
    if (x1 > x2) {
      [x1, x2] = [x2, x1];
    }
    
    if (!this.spans.has(y)) {
      this.spans.set(y, [x1, x2]);
    } else {
      const span = this.spans.get(y);
      span[0] = Math.min(span[0], x1);
      span[1] = Math.max(span[1], x2);
    }
  }

  addPixel(x, y) {
    y = Math.round(y);
    x = Math.round(x);
    
    if (!this.spans.has(y)) {
      this.spans.set(y, [x, x]); // Initialize with same min/max
    } else {
      const span = this.spans.get(y);
      span[0] = Math.min(span[0], x); // Update min if needed
      span[1] = Math.max(span[1], x); // Update max if needed
    }
  }

  addToPixelSet(pixelSet, r, g, b, a) {
    for (const [y, [minX, maxX]] of this.spans) {
      for (let x = minX; x <= maxX; x++) {
        pixelSet.addPixel(x, y, r, g, b, a);
      }
    }
  }
}

class PixelSet {
  constructor() {
    this.pixels = new Map();
  }

  addPixel(x, y, r, g, b, a) {
    const key = `${Math.round(x)},${Math.round(y)}`;
    this.pixels.set(key, { x: Math.round(x), y: Math.round(y), r, g, b, a });
  }

  paint() {
    for (const pixel of this.pixels.values()) {
      setPixel(pixel.x, pixel.y, pixel.r, pixel.g, pixel.b, pixel.a);
    }
  }
}

// currently unused
function alignToPixelBoundary(point) {
  return {
    x: Math.round(point.x) + 0.5,
    y: Math.round(point.y) + 0.5
  };
}


function toIntegerPoint(point) {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}

function roundPoint(x, y) {
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}


function getRandomPoint() {
  const margin = 100;
  return {
    x: margin + Math.random() * (width - 2 * margin),
    y: margin + Math.random() * (height - 2 * margin)
  };
}

function getRandomColor(minAlpha = 100, maxAlpha = 255) {
  return {
    r: Math.random() * 255,
    g: Math.random() * 255,
    b: Math.random() * 255,
    a: Math.random() * (maxAlpha - minAlpha) + minAlpha
  };
}