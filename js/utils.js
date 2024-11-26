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

function getBitsPerChannel(numberOfPartitions) {
  const bitsNeeded = Math.ceil(Math.log2(numberOfPartitions));
  
  // try to spread bits evenly across R, G, B channels
  const bitsPerChannel = [
      Math.floor(bitsNeeded / 3),  // R
      Math.floor(bitsNeeded / 3),  // G
      Math.floor(bitsNeeded / 3)   // B
  ];
  
  const remainingBits = bitsNeeded - (bitsPerChannel[0] + bitsPerChannel[1] + bitsPerChannel[2]);
  for(let i = 0; i < remainingBits; i++) {
      bitsPerChannel[i % 3]++;
  }
  
  return bitsPerChannel;
}

// this function allows for generating random colors with a specific alpha range
// ...AND also allows for partitioning the color space into a number of partitions
// and selecting a specific partition. This is useful for basically generating
// random colors guaranteed to be distinct from each other.
//
// Note that whichPartition is 0-indexed. E.g. if numberOfPartitions is 4, whichPartition
// should be in the range [0, 3].
function getRandomColor(minAlpha = 0, maxAlpha = 255, whichPartition = null, numberOfPartitions = null) {
  // Clamp alpha values to valid range
  minAlpha = Math.max(0, Math.min(255, minAlpha));
  maxAlpha = Math.max(0, Math.min(255, maxAlpha));

  // Ensure minAlpha <= maxAlpha
  if (minAlpha > maxAlpha) {
      [minAlpha, maxAlpha] = [maxAlpha, minAlpha];
  }

  // Generate random alpha value between minAlpha and maxAlpha (inclusive)
  const alpha = Math.floor(minAlpha + Math.random() * (maxAlpha - minAlpha + 1));

  // If numberOfPartitions is null or whichPartition is null and numberOfPartitions is 1,
  // generate completely random RGB values
  if (numberOfPartitions == null || (whichPartition == null && numberOfPartitions === 1)) {
      return {
          r: Math.floor(Math.random() * 256),
          g: Math.floor(Math.random() * 256),
          b: Math.floor(Math.random() * 256),
          a: alpha
      };
  }

  // Ensure numberOfPartitions is at least 1
  numberOfPartitions = Math.max(1, numberOfPartitions);

  // If whichPartition is null, choose random partition
  if (whichPartition == null) {
      whichPartition = Math.floor(Math.random() * numberOfPartitions);
  }

  const bitsPerChannel = getBitsPerChannel(numberOfPartitions);
  
  // Validate partition number
  const totalBits = bitsPerChannel.reduce((a, b) => a + b, 0);
  const maxPartition = 1 << totalBits;
  if (whichPartition >= maxPartition) {
      throw new Error(`Partition ${whichPartition} is invalid. Max partition for ${numberOfPartitions} partitions is ${maxPartition - 1}`);
  }
  
  // Extract bits for each channel from the partition number
  let remainingPartitionBits = whichPartition;
  let channels = [0, 0, 0]; // R, G, B
  let bitsRead = 0;
  
  // Place partition bits in the most significant positions of each channel
  for(let i = 2; i >= 0; i--) {
      const mask = (1 << bitsPerChannel[i]) - 1;
      const channelBits = (remainingPartitionBits >> bitsRead) & mask;
      channels[i] = channelBits << (8 - bitsPerChannel[i]);
      bitsRead += bitsPerChannel[i];
  }
  
  // Fill remaining bits with random values
  for(let i = 0; i < 3; i++) {
      const remainingBits = 8 - bitsPerChannel[i];
      const randomBits = Math.floor(Math.random() * (1 << remainingBits));
      channels[i] |= randomBits;
  }
  
  return {
      r: channels[0],
      g: channels[1],
      b: channels[2],
      a: alpha
  };
}

function getAlignedPosition(centerX, centerY, width, height, strokeWidth) {
  const offset = strokeWidth % 2 ? 0.5 : 0;
  const x = Math.floor(centerX - width/2) + offset;
  const y = Math.floor(centerY - height/2) + offset;
  return { x, y, w: Math.floor(width), h: Math.floor(height) };
}