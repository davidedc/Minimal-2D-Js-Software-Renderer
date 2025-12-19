console.log('[High-Level Runner Build] Script execution started (inside JS).');
/**
 * Polyfills for Node.js environment
 * 
 * This file provides browser-like classes and functions needed to run the
 * software renderer in a Node.js environment without a browser.
 */

/**
 * ImageData polyfill for Node.js
 * Mimics the browser's ImageData class used in Canvas operations
 * https://developer.mozilla.org/en-US/docs/Web/API/ImageData
 */
class ImageData {
  /**
   * Creates a new ImageData object
   * @param {Uint8ClampedArray|number[]} data - Array containing RGBA pixel data or width if creating empty
   * @param {number} width - Width of the image data in pixels
   * @param {number} [height] - Height of the image data (only needed when first param is width)
   */
  constructor(data, width, height) {
    // Handle both constructor signatures:
    // 1. new ImageData(width, height)
    // 2. new ImageData(Uint8ClampedArray, width, height?)
    if (typeof data === 'number') {
      // First signature: new ImageData(width, height)
      const w = data;
      const h = width;
      
      if (w <= 0 || h <= 0) {
        throw new RangeError('Width and height must be positive numbers');
      }
      
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    } else {
      // Second signature: new ImageData(data, width, height?)
      if (!(data instanceof Uint8ClampedArray)) {
        data = new Uint8ClampedArray(data);
      }
      
      if (width <= 0) {
        throw new RangeError('Width must be a positive number');
      }
      
      const expectedLength = width * (height || (data.length / (4 * width))) * 4;
      
      if (data.length !== expectedLength) {
        throw new Error(`Data length (${data.length}) doesn't match dimensions (${width}x${height || (data.length / (4 * width))})`);
      }
      
      this.width = width;
      this.height = height || (data.length / (4 * width));
      this.data = data;
    }
  }

  /**
   * Converts the ImageData to a BMP file format Buffer
   * BMP doesn't support transparency, so transparent pixels are blended with white
   * @returns {Buffer} Buffer containing BMP file data
   */
  toBMP() {
    if (typeof Buffer === 'undefined') {
      throw new Error('toBMP is only available in Node.js environment');
    }
    
    const width = this.width;
    const height = this.height;
    const fileSize = 54 + 3 * width * height;
    const buf = Buffer.alloc(fileSize);
    
    // BMP header
    buf.write('BM', 0);
    buf.writeUInt32LE(fileSize, 2);
    buf.writeUInt32LE(0, 6);
    buf.writeUInt32LE(54, 10);
    
    // DIB header
    buf.writeUInt32LE(40, 14);
    buf.writeInt32LE(width, 18);
    buf.writeInt32LE(-height, 22); // Negative for top-down
    buf.writeUInt16LE(1, 26);
    buf.writeUInt16LE(24, 28); // 24 bits per pixel
    buf.writeUInt32LE(0, 30);
    buf.writeUInt32LE(0, 34);
    buf.writeInt32LE(0, 38);
    buf.writeInt32LE(0, 42);
    buf.writeUInt32LE(0, 46);
    buf.writeUInt32LE(0, 50);
    
    // Write pixel data (BGR format, row padding to 4 bytes)
    let offset = 54;
    const padding = (4 - ((width * 3) % 4)) % 4;
    
    // Background color (white) for blending with transparent pixels
    const bgR = 255, bgG = 255, bgB = 255;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const alpha = this.data[i + 3] / 255; // Normalize alpha to 0-1
        
        // Alpha blending: result = (source * alpha) + (background * (1 - alpha))
        const r = Math.round((this.data[i] * alpha) + (bgR * (1 - alpha)));
        const g = Math.round((this.data[i + 1] * alpha) + (bgG * (1 - alpha)));
        const b = Math.round((this.data[i + 2] * alpha) + (bgB * (1 - alpha)));
        
        buf[offset++] = b; // Blue
        buf[offset++] = g; // Green
        buf[offset++] = r; // Red
      }
      offset += padding; // Add padding
    }
    
    return buf;
  }
}

/**
 * Checks if code is running in Node.js environment
 * @returns {boolean} True if running in Node.js
 */
function isNodeEnvironment() {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

/**
 * Make polyfills available globally in node
 */
if (isNodeEnvironment()) {
  // Make polyfills available globally in node, mimicking browser globals
  global.ImageData = ImageData;
}function addBlackLines(shapes, log, currentIterationNumber, lineWidth, count) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const start = getRandomPoint(1);
    const end = getRandomPoint(1);
    shapes.push({
      type: 'line',
      start,
      end,
      thickness: lineWidth,
      color: new Color(0, 0, 0, 255)
    });
    log.innerHTML += `&#x2500; Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y}) thickness: ${lineWidth}<br>`;
  }
}

function addRandomLines(shapes, log, currentIterationNumber, count = 15) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const start = getRandomPoint(1);
    const end = getRandomPoint(1);
    const thickness = Math.floor(SeededRandom.getRandom() * 10) + 1;
    const color = getRandomColor("mixed");
    shapes.push({
      type: 'line',
      start,
      end,
      thickness,
      color
    });
    log.innerHTML += `&#x2500; Random line from (${start.x}, ${start.y}) to (${end.x}, ${end.y}) thickness: ${thickness} color: ${color.toCSS()}<br>`;
  }
}

function add2PxVerticalLine(centerX, centerY, height, shapes, log) {
  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height;

  let startY = topY;
  let endY = bottomY;

  if (SeededRandom.getRandom() < 0.5) {
    startY = bottomY;
    endY = topY;
  }
  
  const leftX = Math.floor(centerX - 1);
  const rightX = leftX + 1;
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: startY },
    end: { x: centerX, y: endY },
    thickness: 2,
    color: new Color(255, 0, 0, 255)
  });

  log.innerHTML += `&#x2500; 2px vertical line from (${centerX}, ${startY}) to (${centerX}, ${endY}) height: ${height}<br>`;

  return { leftX, rightX, topY, bottomY: bottomY - 1};
}

function add2PxVerticalLineCenteredAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);
  
  const result = add2PxVerticalLine(centerX, centerY, lineHeight, shapes, log);
  
  log.innerHTML += (`2px vertical line from (${centerX}, ${result.topY}) to (${centerX}, ${result.bottomY}) of height ${lineHeight}`);
  
  return result;
}

function add1PxVerticalLine(centerX, centerY, height, shapes, log) {
  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height;

  let startY = topY;
  let endY = bottomY;

  if (SeededRandom.getRandom() < 0.5) {
    startY = bottomY;
    endY = topY;
  }
  
  const pixelX = Math.floor(centerX);
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: startY },
    end: { x: centerX, y: endY },
    thickness: 1,
    color: new Color(255, 0, 0, 255)
  });

  log.innerHTML += `&#x2500; 1px vertical line from (${centerX}, ${startY}) to (${centerX}, ${endY}) height: ${height}<br>`;

  return { leftX: pixelX, rightX: pixelX, topY, bottomY: bottomY - 1};
}

function add1PxVerticalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
  const centerX = Math.floor(renderTestWidth / 2) + 0.5;
  const centerY = Math.floor(renderTestHeight / 2);
  
  return add1PxVerticalLine(centerX, centerY, lineHeight, shapes, log);
}

function add1PxHorizontalLine(centerX, centerY, width, shapes, log) {
  const leftX = Math.floor(centerX - width/2);
  const rightX = leftX + width;

  let startX = leftX;
  let endX = rightX;

  if (SeededRandom.getRandom() < 0.5) {
    startX = rightX;
    endX = leftX;
  }
  
  const pixelY = Math.floor(centerY);
  
  shapes.push({
    type: 'line',
    start: { x: startX, y: centerY },
    end: { x: endX, y: centerY },
    thickness: 1,
    color: new Color(255, 0, 0, 255)
  });

  log.innerHTML += `&#x2500; 1px horizontal line from (${startX}, ${centerY}) to (${endX}, ${centerY}) width: ${width}<br>`;

  return { topY: pixelY, bottomY: pixelY, leftX, rightX: rightX - 1};
}

function add1PxHorizontalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  const centerX = Math.floor(renderTestWidth / 2);
  const centerY = Math.floor(renderTestHeight / 2) + 0.5;
  
  return add1PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
}

function add2PxHorizontalLine(centerX, centerY, width, shapes, log) {
  const topY = Math.floor(centerY - 1);
  const bottomY = topY + 1;

  const leftX = Math.floor(centerX - width/2);
  const rightX = leftX + width;

  let startX = leftX;
  let endX = rightX;

  if (SeededRandom.getRandom() < 0.5) {
    startX = rightX;
    endX = leftX;
  }
  
  shapes.push({
    type: 'line',
    start: { x: startX, y: centerY },
    end: { x: endX, y: centerY },
    thickness: 2,
    color: new Color(255, 0, 0, 255)
  });

  log.innerHTML += `&#x2500; 2px horizontal line from (${startX}, ${centerY}) to (${endX}, ${centerY}) width: ${width}<br>`;

  return { topY, bottomY, leftX, rightX: rightX - 1};
}

function add2PxHorizontalLineCenteredAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);
  
  return add2PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
}
function addAxisAlignedRectangles(shapes, log, currentIterationNumber, count = 5) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    var { center, adjustedDimensions, strokeWidth } = placeRoundedRectWithFillAndStrokeBothCrisp(10);

    const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
    const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;

    center = {
      x: center.x + xOffset,
      y: center.y + yOffset
    };

    const strokeColor = getRandomColor("mixed");
    const fillColor = getRandomColor("semitransparent");

    shapes.push({
      type: 'rect',
      center: center,
      width: adjustedDimensions.width,
      height: adjustedDimensions.height,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A1; Axis-aligned rect at (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} strokeWidth: ${strokeWidth} strokeColor: ${strokeColor.toCSS()} fillColor: ${fillColor.toCSS()}<br>`;
  }
}

function addRotatedRectangles(shapes, log, currentIterationNumber, count = 5) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const center = getRandomPoint(1);
    const width = 30 + SeededRandom.getRandom() * 100;
    const height = 30 + SeededRandom.getRandom() * 100;
    const rotation = SeededRandom.getRandom() * Math.PI * 2;
    const strokeWidth = SeededRandom.getRandom() * 10 + 1;
    const strokeColor = getRandomColor("mixed");
    const fillColor = getRandomColor("semitransparent");

    shapes.push({
      type: 'rect',
      center,
      width,
      height,
      rotation,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A1; Rotated rect at (${center.x}, ${center.y}) width: ${width.toFixed(1)} height: ${height.toFixed(1)} rotation: ${(rotation * 180 / Math.PI).toFixed(1)}&deg; strokeWidth: ${strokeWidth.toFixed(1)} strokeColor: ${strokeColor.toCSS()} fillColor: ${fillColor.toCSS()}<br>`;
  }
}

function add1PxStrokeCenteredRectAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, { x: centerX, y: centerY });

  return add1PxStrokeCenteredRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRectAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, { x: centerX, y: centerY });

  return add1PxStrokeCenteredRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  const leftX = Math.floor(centerX - rectWidth / 2);
  const rightX = leftX + rectWidth;
  const topY = Math.floor(centerY - rectHeight / 2);
  const bottomY = topY + rectHeight;

  shapes.push({
    type: 'rect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    rotation: 0,
    strokeWidth: 1,
    strokeColor: new Color(255, 0, 0, 255),
    fillColor: Color.transparent
  });

  log.innerHTML += `&#x25A1; 1px stroke centered rect at (${centerX}, ${centerY}) width: ${rectWidth} height: ${rectHeight}<br>`;

  return { leftX, rightX, topY, bottomY };
}
function addAxisAlignedRoundedRectangles(shapes, log, currentIterationNumber, count = 10) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    // Use placeRoundedRectWithFillAndStrokeBothCrisp to get a properly positioned rectangle
    var { center, adjustedDimensions, strokeWidth } = placeRoundedRectWithFillAndStrokeBothCrisp(10);

    // Move the center randomly by an integer amount in both x and y
    const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50; // Random integer between -50 and 49
    const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50; // Random integer between -50 and 49

    center = {
      x: center.x + xOffset,
      y: center.y + yOffset
    };

    const radius = Math.round(SeededRandom.getRandom() * Math.min(adjustedDimensions.width, adjustedDimensions.height) * 0.2);
    const strokeColor = getRandomColor("mixed");
    const fillColor = getRandomColor("semitransparent");

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: adjustedDimensions.width,
      height: adjustedDimensions.height,
      radius,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A2; Axis-aligned rounded rect at: (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} radius: ${radius} strokeWidth: ${strokeWidth} strokeColor: ${strokeColor.toCSS()} fillColor: ${fillColor.toCSS()}<br>`;
  }
}

function addThinOpaqueStrokeRoundedRectangles(shapes, log, currentIterationNumber, count = 10) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + SeededRandom.getRandom() * 100);
    const height = Math.round(50 + SeededRandom.getRandom() * 100);

    // the starting initialisation of center is a random point at a grid crossing
    const center = roundPoint(getRandomPoint(1));

    const adjustedCenter = adjustCenterForCrispStrokeRendering(center.x, center.y, width, height, 1);

    shapes.push({
      type: 'roundedRect',
      center: adjustedCenter,
      width,
      height,
      radius: Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2),
      rotation: 0,
      strokeWidth: 1,
      strokeColor: getRandomColor("opaque"),
      fillColor: getRandomColor("semitransparent")
    });

    log.innerHTML += `&#x25A2; Thin opaque stroke rounded rect at: (${adjustedCenter.x}, ${adjustedCenter.y}) width: ${width} height: ${height} radius: ${Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2)}<br>`;
  }
}

function addLargeTransparentRoundedRectangles(shapes, log, currentIterationNumber, count = 10) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    // Use placeRoundedRectWithFillAndStrokeBothCrisp to get a properly positioned rectangle
    var { center, adjustedDimensions, strokeWidth } = placeRoundedRectWithFillAndStrokeBothCrisp(40);

    // Move the center randomly by an integer amount in both x and y
    const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50; // Random integer between -50 and 49
    const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50; // Random integer between -50 and 49

    center = {
      x: center.x + xOffset,
      y: center.y + yOffset
    };

    const strokeColor = new Color(0, 0, 0, 50);
    const fillColor = getRandomColor("semitransparent");

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: adjustedDimensions.width,
      height: adjustedDimensions.height,
      radius: 40,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A2; Large transparent rounded rect at: (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} radius: 40 strokeWidth: ${strokeWidth} strokeColor: ${strokeColor.toCSS()} fillColor: ${fillColor.toCSS()}<br>`;
  }
}

function addNoStrokeRoundedRectangles(shapes, log, currentIterationNumber, count = 10) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const center = roundPoint(getRandomPoint(1));
    shapes.push({
      type: 'roundedRect',
      center,
      width: 200,
      height: 200,
      radius: 40,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: Color.transparent,
      fillColor: getRandomColor("semitransparent")
    });

    log.innerHTML += `&#x25A2; No-stroke rounded rect at: (${center.x}, ${center.y}) width: 200 height: 200 radius: 40<br>`;
  }
}

function addRotatedRoundedRectangles(shapes, log, currentIterationNumber, count = 3) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const width = 50 + SeededRandom.getRandom() * 100;
    const height = 50 + SeededRandom.getRandom() * 100;
    const center = getRandomPoint(1);
    const radius = Math.min(width, height) * 0.2;
    const rotation = SeededRandom.getRandom() * Math.PI * 2;
    const strokeWidth = SeededRandom.getRandom() * 10 + 1;

    shapes.push({
      type: 'roundedRect',
      center,
      width,
      height,
      radius,
      rotation,
      strokeWidth,
      strokeColor: getRandomColor("mixed"),
      fillColor: getRandomColor("semitransparent")
    });

    log.innerHTML += `&#x25A2; Rotated rounded rect at: (${center.x}, ${center.y}) width: ${width.toFixed(1)} height: ${height.toFixed(1)} radius: ${radius.toFixed(1)} rotation: ${(rotation * 180 / Math.PI).toFixed(1)}&deg; strokeWidth: ${strokeWidth.toFixed(1)}<br>`;
  }
}

function addCenteredRoundedRectOpaqueStrokesRandomStrokeWidth(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);

  const maxWidth = renderTestWidth * 0.6;
  const maxHeight = renderTestHeight * 0.6;

  const strokeWidth = Math.round(SeededRandom.getRandom() * 10 + 1);

  // center is an even number divided by 2, so it's an integer,
  // so the center is at a grid crossing.
  const center = { x: renderTestWidth / 2, y: renderTestHeight / 2 };


  let rectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
  let rectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, center);
  const radius = Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2);
  const strokeColor = getRandomColor("opaque", 0, 2);
  const fillColor = getRandomColor("semitransparent", 1, 2);

  shapes.push({
    type: 'roundedRect',
    center,
    width: adjustedDimensions.width,
    height: adjustedDimensions.height,
    radius,
    rotation: 0,
    strokeWidth,
    strokeColor,
    fillColor
  });

  log.innerHTML += `&#x25A2; Centered rounded rect with opaque stroke at: (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} radius: ${radius} strokeWidth: ${strokeWidth} strokeColor: ${strokeColor.toCSS()} fillColor: ${fillColor.toCSS()}`;
}

// TODO to work out exactly when the main features of the rounded rect
// are identical in the sw renderer and the canvas renderer. 
function addCenteredRoundedRectTransparentStrokesRandomStrokeWidth(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);

  var { center, adjustedDimensions, strokeWidth } = placeRoundedRectWithFillAndStrokeBothCrisp(40);

  const strokeColor = getRandomColor("semitransparent-light");
  const fillColor = getRandomColor("semitransparent-light");
  const radius = Math.round(SeededRandom.getRandom() * Math.min(adjustedDimensions.width, adjustedDimensions.height) * 0.2);

  shapes.push({
    type: 'roundedRect',
    center,
    width: adjustedDimensions.width,
    height: adjustedDimensions.height,
    radius,
    rotation: 0,
    strokeWidth,
    strokeColor,
    fillColor
  });

  log.innerHTML += `&#x25A2; Centered rounded rect with transparent stroke at: (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} radius: ${radius} strokeWidth: ${strokeWidth} strokeColor: ${strokeColor.toCSS()} fillColor: ${fillColor.toCSS()}`;
}


// The case of fill PLUS a semi-transparent stroke is actually slightly trickier because
// both the stroke and fill are entirely visible, so they have to be
// BOTH drawn crisply, and using one path only for both. This means that
//  1) the fill needs to have its edges on the grid (hence width and height need to be adjusted depending on whether the center is at a grid crossing or not)
//  2) the stroke has to be of even width,
function placeRoundedRectWithFillAndStrokeBothCrisp(maxStrokeWidth = 40) {
  const maxWidth = renderTestWidth * 0.6;
  const maxHeight = renderTestHeight * 0.6;

  let strokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidth + 1);

  // the only way to make both the fill and the stroke crisp with the same path
  // is if the fill path runs all around grid lines, and the stroke falls half on one side
  // of the path and the other half on the other side. I.e. the strokeWidth must be even.
  strokeWidth = strokeWidth % 2 === 0 ? strokeWidth : strokeWidth + 1;

  // center is an even number divided by 2, so it's an integer,
  // so the center is at a grid crossing.
  let center = { x: renderTestWidth / 2, y: renderTestHeight / 2 };

  // 50% of the times, move the center by half pixel so we also test the case where the
  // center is not at a grid crossing.
  if (SeededRandom.getRandom() < 0.5) {
    center = { x: center.x + 0.5, y: center.y + 0.5 };
  }

  // get a random starting dimension, we'll adjust it soon after
  let rectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
  let rectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, center);
  return { center, adjustedDimensions, strokeWidth };
}

function add1PxStrokeCenteredRoundedRectAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);

  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, { x: centerX, y: centerY });

  return add1PxStrokeCenteredRoundedRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRoundedRectAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);

  const { centerX, centerY } = placeCloseToCenterAtPixel(renderTestWidth, renderTestHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, { x: centerX, y: centerY });

  return add1PxStrokeCenteredRoundedRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  const leftX = Math.floor(centerX - rectWidth / 2);
  const rightX = leftX + rectWidth;
  const topY = Math.floor(centerY - rectHeight / 2);
  const bottomY = topY + rectHeight;

  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    radius: Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: new Color(255, 0, 0, 255),
    fillColor: Color.transparent
  });

  log.innerHTML += `&#x25A2; 1px stroke centered rounded rect at: (${centerX}, ${centerY}) width: ${rectWidth} height: ${rectHeight} radius: ${Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2)}`;

  return { leftX, rightX, topY, bottomY };
}
function getRandomArc() {
  const center = getRandomPoint(1);
  const radius = 15 + SeededRandom.getRandom() * 50;
  const startAngle = SeededRandom.getRandom() * 360;
  const endAngle = startAngle + SeededRandom.getRandom() * 270 + 90;
  const strokeWidth = SeededRandom.getRandom() * 10 + 1;
  const strokeColor = getRandomColor("mixed");
  const fillColor = getRandomColor("semitransparent");

  return {
    type: 'arc',
    center,
    radius,
    startAngle,
    endAngle,
    strokeWidth,
    strokeColor,
    fillColor
  };
}

function addNinetyDegreeArcs(shapes, log, currentIterationNumber) {
  // Not strictly needed as there is nothing random here
  SeededRandom.seedWithInteger(currentIterationNumber);

  const strokeSizes = [1, 2, 3, 4];
  const radii = [20, 40, 60];
  let xOffset = 150;

  for (const strokeWidth of strokeSizes) {
    let yOffset = 150;
    for (const radius of radii) {
      shapes.push({
        type: 'arc',
        center: { x: xOffset, y: yOffset },
        radius,
        startAngle: 0,
        endAngle: 90,
        strokeWidth,
        strokeColor: new Color(200, 100, 100, 255),
        fillColor: Color.transparent
      });
      log.innerHTML += `&#x25DC; 90&deg; arc at (${xOffset}, ${yOffset}) radius: ${radius} strokeWidth: ${strokeWidth}<br>`;
      yOffset += radius * 2 + 20;
    }
    xOffset += 120;
  }
}

function addRandomArcs(shapes, log, currentIterationNumber, count = 3) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const arc = getRandomArc();
    shapes.push(arc);
    log.innerHTML += `&#x25DC; Arc at (${arc.center.x}, ${arc.center.y}) radius: ${arc.radius} angles: ${arc.startAngle}&deg; to ${arc.endAngle}&deg; strokeWidth: ${arc.strokeWidth} strokeColor: ${arc.strokeColor.toCSS()} fillColor: ${arc.fillColor.toCSS()}<br>`;
  }
}
function getRandomCircle() {
  return {
    ...getRandomArc(),
    type: 'circle',
    startAngle: 0,
    endAngle: 360
  };
}

/**
 * Helper function for creating circle test cases that share core parameters
 * @param {Array} shapes - Array to add shapes to
 * @param {HTMLElement} log - Log element to add descriptions
 * @param {number} currentIterationNumber - Current iteration number for seeding
 * @param {number} count - Number of circles to create
 * @param {string} description - Description prefix for logging
 * @returns {Object|null} Extremes coordinates for the circle (if count is 1) or null (if count > 1)
 */
function createRandomCircleTest(shapes, log, currentIterationNumber, count, description) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  let extremes = null;

  for (let i = 0; i < count; i++) {
    const circle = getRandomCircle();
    shapes.push(circle);
    log.innerHTML += `&#x20DD; ${description} circle at (${circle.center.x}, ${circle.center.y}) radius: ${circle.radius} strokeWidth: ${circle.strokeWidth} strokeColor: ${circle.strokeColor.toCSS()} fillColor: ${circle.fillColor.toCSS()}<br>`;

    // Calculate extremes, but only for the single circle case
    if (count === 1) {
      const effectiveRadius = circle.radius + circle.strokeWidth / 2;
      extremes = {
        leftX: Math.floor(circle.center.x - effectiveRadius),
        rightX: Math.ceil(circle.center.x - effectiveRadius + effectiveRadius * 2 - 1),
        topY: Math.floor(circle.center.y - effectiveRadius),
        bottomY: Math.ceil(circle.center.y - effectiveRadius + effectiveRadius * 2 - 1)
      };
    }
  }

  return extremes;
}

function addRandomCircles(shapes, log, currentIterationNumber, count = 5) {
  createRandomCircleTest(shapes, log, currentIterationNumber, count, "Random");
}

function addOneRandomCircle(shapes, log, currentIterationNumber) {
  return createRandomCircleTest(shapes, log, currentIterationNumber, 1, "Single random");
}

/**
 * Utility function to calculate circle parameters with proper positioning and dimensions
 * @param {Object} options - Configuration options for circle creation
 * @param {number} options.minRadius - Minimum radius for the circle
 * @param {number} options.maxRadius - Maximum radius for the circle
 * @param {boolean} options.hasStroke - Whether the circle has a stroke
 * @param {number} options.minStrokeWidth - Minimum stroke width (if hasStroke is true)
 * @param {number} options.maxStrokeWidth - Maximum stroke width (if hasStroke is true)
 * @param {boolean} options.randomPosition - Whether to use random positioning
 * @param {number} options.marginX - Horizontal margin from canvas edges
 * @param {number} options.marginY - Vertical margin from canvas edges
 * @returns {Object} Calculated circle parameters
 */
function calculateCircleParameters(options) {
  const {
    minRadius = 8,
    maxRadius = 225,
    hasStroke = true,
    minStrokeWidth = 1,
    maxStrokeWidth = 30,
    randomPosition = false,
    marginX = 10,
    marginY = 10
  } = options;

  // Randomly choose between grid-centered and pixel-centered
  const atPixel = SeededRandom.getRandom() < 0.5;

  // Get initial center point
  let { centerX, centerY } = atPixel
    ? placeCloseToCenterAtPixel(renderTestWidth, renderTestHeight)
    : placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  // Calculate base diameter
  const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
  const baseRadius = diameter / 2;

  // Calculate stroke width
  const maxAllowedStrokeWidth = Math.floor(baseRadius / 1);
  const strokeWidth = hasStroke
    ? (minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeWidth)))
    : 0;

  // Handle random positioning if requested
  if (randomPosition) {
    const totalRadius = baseRadius + (strokeWidth / 2);

    // Calculate safe bounds
    const minX = Math.ceil(totalRadius + marginX);
    const maxX = Math.floor(renderTestWidth - totalRadius - marginX);
    const minY = Math.ceil(totalRadius + marginY);
    const maxY = Math.floor(renderTestHeight - totalRadius - marginY);

    // Adjust diameter if circle is too large
    let adjustedDiameter = diameter;
    if (maxX <= minX || maxY <= minY) {
      // Circle is too large, reduce diameter to 1/4 of canvas size
      adjustedDiameter = Math.min(
        Math.floor(renderTestWidth / 4),
        Math.floor(renderTestHeight / 4)
      );

      // Recalculate bounds with reduced diameter
      const newTotalRadius = (adjustedDiameter / 2) + (strokeWidth / 2);
      const newMinX = Math.ceil(newTotalRadius + marginX);
      const newMaxX = Math.floor(renderTestWidth - newTotalRadius - marginX);
      const newMinY = Math.ceil(newTotalRadius + marginY);
      const newMaxY = Math.floor(renderTestHeight - newTotalRadius - marginY);

      // Generate random position within new safe bounds
      centerX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
      centerY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
    } else {
      // Generate random position within original safe bounds
      centerX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
      centerY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
    }
  }

  // Adjust dimensions for crisp rendering
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(
    diameter, diameter, strokeWidth, { x: centerX, y: centerY }
  );
  const adjustedDiameter = adjustedDimensions.width;
  const radius = adjustedDiameter / 2;

  return {
    centerX,
    centerY,
    radius,
    strokeWidth,
    adjustedDiameter,
    atPixel
  };
}

function createTestCircle(currentIterationNumber, hasStroke = true, randomPosition = false) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  checkCanvasHasEvenDimensions();

  const params = calculateCircleParameters({
    minRadius: 10,
    maxRadius: 225,
    hasStroke,
    minStrokeWidth: 1,
    maxStrokeWidth: 30,
    randomPosition,
    marginX: 10,
    marginY: 10
  });

  const { centerX, centerY, radius, strokeWidth, adjustedDiameter, atPixel } = params;

  const circle = {
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth,
    strokeColor: hasStroke ? getRandomColor("semitransparent") : Color.transparent,
    fillColor: getRandomColor("semitransparent"),
    startAngle: 0,
    endAngle: 360
  };

  // Calculate extremes for the circle
  const effectiveRadius = hasStroke ? (radius + strokeWidth / 2) : radius;

  const extremes = {
    leftX: Math.floor(circle.center.x - effectiveRadius),
    rightX: Math.floor(circle.center.x - effectiveRadius) + effectiveRadius * 2 - 1,
    topY: Math.floor(circle.center.y - effectiveRadius),
    bottomY: Math.floor(circle.center.y - effectiveRadius) + effectiveRadius * 2 - 1
  };

  return {
    circle,
    extremes,
    centerX,
    centerY,
    radius,
    strokeWidth,
    adjustedDiameter,
    atPixel
  };
}

function addSingleRandomCircle(shapes, log, currentIterationNumber) {
  const result = createTestCircle(currentIterationNumber, true, false);
  const { circle, extremes, centerX, centerY, radius, strokeWidth, adjustedDiameter, atPixel } = result;

  // Add the circle to shapes
  shapes.push(circle);

  // Log the circle details
  log.innerHTML += `&#x20DD; Single random circle at (${centerX}, ${centerY}) radius: ${radius} ` +
    `diameter: ${adjustedDiameter} strokeWidth: ${strokeWidth} ` +
    `centered at: ${atPixel ? 'pixel' : 'grid'} ` +
    `strokeColor: ${circle.strokeColor.toCSS()} ` +
    `fillColor: ${circle.fillColor.toCSS()}<br>`;

  return extremes;
}

function addSingleNoStrokeCircle(shapes, log, currentIterationNumber) {
  const result = createTestCircle(currentIterationNumber, false, false);
  const { circle, extremes, centerX, centerY, radius, adjustedDiameter, atPixel } = result;

  // Add the circle to shapes
  shapes.push(circle);

  // Log the circle details
  log.innerHTML += `&#x20DD; Single circle with no stroke at (${centerX}, ${centerY}) radius: ${radius} ` +
    `diameter: ${adjustedDiameter} ` +
    `centered at: ${atPixel ? 'pixel' : 'grid'} ` +
    `fillColor: ${circle.fillColor.toCSS()}<br>`;

  return extremes;
}

function addRandomPositionCircle(shapes, log, currentIterationNumber) {
  const result = createTestCircle(currentIterationNumber, true, true);
  const { circle, extremes, centerX, centerY, radius, strokeWidth, adjustedDiameter, atPixel } = result;

  // Add the circle to shapes
  shapes.push(circle);

  // Log the circle details
  log.innerHTML += `&#x20DD; Random position circle at (${centerX}, ${centerY}) radius: ${radius} ` +
    `diameter: ${adjustedDiameter} strokeWidth: ${strokeWidth} ` +
    `centered at: ${atPixel ? 'pixel' : 'grid'} ` +
    `strokeColor: ${circle.strokeColor.toCSS()} ` +
    `fillColor: ${circle.fillColor.toCSS()}<br>`;

  return extremes;
}

function addRandomPositionNoStrokeCircle(shapes, log, currentIterationNumber) {
  const result = createTestCircle(currentIterationNumber, false, true);
  const { circle, extremes, centerX, centerY, radius, adjustedDiameter, atPixel } = result;

  // Add the circle to shapes
  shapes.push(circle);

  // Log the circle details
  log.innerHTML += `&#x20DD; Random position circle with no stroke at (${centerX}, ${centerY}) radius: ${radius} ` +
    `diameter: ${adjustedDiameter} ` +
    `centered at: ${atPixel ? 'pixel' : 'grid'} ` +
    `fillColor: ${circle.fillColor.toCSS()}<br>`;

  return extremes;
}

/**
 * Helper function to generate multiple circles with simple random placement
 * @param {Array} shapes - Array to add shapes to
 * @param {HTMLElement} log - Log element to add descriptions
 * @param {number} count - Number of circles to create
 * @param {boolean} includeStrokes - Whether to include strokes on circles
 * @param {string} description - Description to log
 * @returns {void}
 */
function generateMultiplePreciseCircles(shapes, log, currentIterationNumber, count, includeStrokes, description) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  checkCanvasHasEvenDimensions();

  log.innerHTML += `${description} (${count} circles)<br>`;

  for (let i = 0; i < count; i++) {
    const params = calculateCircleParameters({
      minRadius: 8,
      maxRadius: 42,
      hasStroke: includeStrokes,
      minStrokeWidth: 1,
      maxStrokeWidth: 4,
      randomPosition: true,
      marginX: 60,
      marginY: 60
    });

    const { centerX, centerY, radius, strokeWidth, atPixel } = params;

    // Create the circle with distinct colors (using partitioning to ensure variety)
    const circle = {
      type: 'circle',
      center: { x: centerX, y: centerY },
      radius,
      strokeWidth,
      // If not including strokes, use transparent stroke color
      strokeColor: includeStrokes ?
        getRandomColor("mixed", i, count) :
        Color.transparent,
      // Use more opaque fills if no stroke to make them more visible
      fillColor: getRandomColor(includeStrokes ? "semitransparent" : "mixed",
        count - i - 1, count),
      startAngle: 0,
      endAngle: 360
    };

    // Add the circle to shapes
    shapes.push(circle);

    // Log only the first few circles to avoid cluttering the log
    if (i < 3) {
      log.innerHTML += `&#x20DD; Circle ${i} at (${centerX}, ${centerY}) radius: ${radius} ` +
        (includeStrokes ? `strokeWidth: ${strokeWidth} ` : `no stroke `) +
        `center type: ${atPixel ? 'pixel' : 'grid'} ` +
        (includeStrokes ? `strokeColor: ${circle.strokeColor.toCSS()} ` : ``) +
        `fillColor: ${circle.fillColor.toCSS()}<br>`;
    }
  }

  // Log message if we truncated the output
  if (count > 3) {
    log.innerHTML += `... and ${count - 3} more circles<br>`;
  }
}

/**
 * Add multiple precise random circles with strokes
 */
function addMultiplePreciseRandomCircles(shapes, log, currentIterationNumber, count = 10) {
  generateMultiplePreciseCircles(
    shapes,
    log,
    currentIterationNumber,
    count,
    true,
    "Adding multiple precise random circles with strokes"
  );
}

/**
 * Add multiple precise random circles without strokes (fill only)
 */
function addMultiplePreciseNoStrokeCircles(shapes, log, currentIterationNumber, count = 10) {
  generateMultiplePreciseCircles(
    shapes,
    log,
    currentIterationNumber,
    count,
    false,
    "Adding multiple precise random circles without strokes (fill only)"
  );
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at grid
function add1PxStrokeCenteredCircleAtGrid(shapes, log, currentIterationNumber) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  // Ensure canvas dimensions are even for proper grid alignment
  checkCanvasHasEvenDimensions();

  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  // Generate a random diameter (similar range as the rectangle dimensions)
  let diameter = Math.floor(20 + SeededRandom.getRandom() * 130);
  // Adjust the diameter for crisp stroke rendering (both width and height are the same)
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, 1, { x: centerX, y: centerY });
  const adjustedDiameter = adjustedDimensions.width; // (equals height)
  const radius = adjustedDiameter / 2;

  // Create the circle shape with a 1px stroke (red stroke, transparent fill)
  shapes.push({
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth: 1,
    strokeColor: new Color(255, 0, 0, 255),
    fillColor: Color.transparent,
    startAngle: 0,
    endAngle: 360
  });

  log.innerHTML += `&#x20DD; 1px stroke centered circle at: (${centerX}, ${centerY}) diameter: ${adjustedDiameter} radius: ${radius}`;

  const leftX = centerX - radius - 0.5;
  const rightX = centerX + radius - 0.5;
  const topY = centerY - radius - 0.5;
  const bottomY = centerY + radius - 0.5;

  return { leftX, rightX, topY, bottomY };
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at pixel
function add1PxStrokeCenteredCircleAtPixel(shapes, log, currentIterationNumber) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  // Ensure canvas dimensions are even for proper pixel alignment
  checkCanvasHasEvenDimensions();

  // Replace direct calculation with new function
  const { centerX, centerY } = placeCloseToCenterAtPixel(renderTestWidth, renderTestHeight);

  // Generate a random diameter (similar range as the rectangle dimensions)
  let diameter = Math.floor(20 + SeededRandom.getRandom() * 130);
  // Adjust the diameter for crisp stroke rendering (both width and height are the same)
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, 1, { x: centerX, y: centerY });
  const adjustedDiameter = adjustedDimensions.width; // (width equals height)
  const radius = adjustedDiameter / 2;

  // Create the circle shape with a 1px stroke (red stroke, transparent fill)
  shapes.push({
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth: 1,
    strokeColor: new Color(255, 0, 0, 255),
    fillColor: Color.transparent,
    startAngle: 0,
    endAngle: 360
  });

  log.innerHTML += `&#x20DD; 1px stroke centered circle at: (${centerX}, ${centerY}) diameter: ${adjustedDiameter} radius: ${radius}`;

  const leftX = centerX - radius - 0.5;
  const rightX = centerX + radius - 0.5;
  const topY = centerY - radius - 0.5;
  const bottomY = centerY + radius - 0.5;

  return { leftX, rightX, topY, bottomY };
}
function roundPoint({x, y}) {
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

function placeCloseToCenterAtPixel(width, height) {
  return {
    centerX: Math.floor(width / 2) + 0.5,
    centerY: Math.floor(height / 2) + 0.5
  };
}

function placeCloseToCenterAtGrid(width, height) {
  return {
    centerX: Math.floor(width / 2),
    centerY: Math.floor(height / 2)
  };
}// See https://stackoverflow.com/a/47593316
class SeededRandom {
    static #currentRandom = null;

    static seedWithInteger(seed) {
        // XOR the seed with a constant value
        seed = seed ^ 0xDEADBEEF;

        // Pad seed with Phi, Pi and E.
        this.#currentRandom = this.#sfc32(0x9E3779B9, 0x243F6A88, 0xB7E15162, seed);

        // Warm up the generator
        for (let i = 0; i < 15; i++) {
            this.#currentRandom();
        }
    }

    static getRandom() {
        if (!this.#currentRandom) {
            throw new Error('SeededRandom must be initialized with seedWithInteger before use');
        }
        return this.#currentRandom();
    }

    // Small Fast Counter (SFC) 32-bit implementation
    static #sfc32(a, b, c, d) {
        return function() {
            a |= 0; b |= 0; c |= 0; d |= 0;
            let t = (a + b | 0) + d | 0;
            d = d + 1 | 0;
            a = b ^ b >>> 9;
            b = c + (c << 3) | 0;
            c = (c << 21 | c >>> 11);
            c = c + t | 0;
            return (t >>> 0) / 4294967296;
        }
    }
}
// THIS IS NOT USED SO FAR BECAUSE WE FILL (ROTATED) RECTANGLES SO FAR, FOR WHICH WE
// USE THE Edge Function Method (Half-Space Method), WHICH SHOULD BE FASTER.
// --------------------------------------------------------------------------
// Ray Casting algorithm (also known as the Even-Odd Rule algorithm) for
// determining if a point lies inside a polygon
// conceptually draws a ray from the test point (x,y) extending infinitely
// in one direction (in this case, horizontally to the right) and counts
// how many times this ray intersects the polygon's edges.
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




// currently unused
function alignToPixelBoundary(point) {
  return {
    x: Math.round(point.x) + 0.5,
    y: Math.round(point.y) + 0.5
  };
}


// currently unused
function toIntegerPoint(point) {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}


function roundCornerOfRectangularGeometry(rectGeometry) {
  const {x, y, w, h} = rectGeometry;
  // round x, y , while leaving w and h as they are
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: w,
    h: h
  };
}

function roundCornerOfRectangularGeometryWithWarning(rectGeometry) {
  const rounded = roundCornerOfRectangularGeometry(rectGeometry);
  if (rounded.x !== rectGeometry.x || rounded.y !== rectGeometry.y) {
    console.warn('Rectangular geometry is not at a grid point, rounding to nearest grid point. When this happens, HTML5 Canvas would do a non-crisp fill, while the SW renderer will do a crisp fill.');
  }
  return rounded;
}

// The intent here is to draw a *crisp* shape.
// If the user knows what they are doing, they pass centerX and width such that
// they produce a whole origin x.
function getRectangularFillGeometry(centerX, centerY, width, height) {
  const x = centerX - width/2;
  const y = centerY - height/2;
  return { x, y, w: width, h: height };
}

// The intent here is to draw a *crisp* stroke that is aligned with the fill, with
// some overlap (at least half of the stroke width is made to overlap the fill).
// As you can see the code is the same as getRectangularFillGeometry, however,
// it is kept separate to keep the clearer separate semantics of the use.
var getRectangularStrokeGeometry = getRectangularFillGeometry;


// Not used anywhere yet.
function checkBasicConditionsForCrispRendering(centerX, centerY, width, height, strokeWidth) {
  // For *both* fill and stroke to have a chance to be crisp, there are a number of
  // things that must be true (necessary conditions, but not sufficient):
  //   1. width and height must be integers
  //   2. strokeWidth must be an integer
  //   3. centerX and centerY coordinates must be either integers or *.5

  // So here we check that the inputs satisfy those conditions and emit a warning
  // if they don't.

  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    console.warn("Width and height must be integers for crisp rendering");
  }
  if (!Number.isInteger(strokeWidth)) {
    console.warn("Stroke width must be an integer for crisp rendering");
  }
  if (!Number.isInteger(centerX) && centerX % 1 !== 0.5) {
    console.warn("Center X must be an integer or *.5 for crisp rendering");
  }
  if (!Number.isInteger(centerY) && centerY % 1 !== 0.5) {
    console.warn("Center Y must be an integer or *.5 for crisp rendering ");
  }
}
function getRandomPoint(decimalPlaces = null, canvasWidth = null, canvasHeight = null, margin = 100) {
  const width = canvasWidth || renderTestWidth;
  const height = canvasHeight || renderTestHeight;
  const x = margin + SeededRandom.getRandom() * (width - 2 * margin);
  const y = margin + SeededRandom.getRandom() * (height - 2 * margin);
  
  if (decimalPlaces === null) {
    return { x, y };
  }
  
  return {
    x: Number(x.toFixed(decimalPlaces)),
    y: Number(y.toFixed(decimalPlaces))
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
//
// alphaMode: "opaque" (255), "semitransparent" (100-200), "semitransparent-light" (50-150), or "mixed" (50% opaque, 50% semitransparent)
function getRandomColor(alphaMode, whichPartition = null, numberOfPartitions = null) {
  // Validate alphaMode
  const validModes = ["opaque", "semitransparent", "semitransparent-light", "mixed"];
  if (!validModes.includes(alphaMode)) {
    throw new Error(`Invalid alpha mode: ${alphaMode}. Valid modes: ${validModes.join(", ")}`);
  }
  
  let minAlpha, maxAlpha;
  
  switch(alphaMode) {
    case "opaque":
      minAlpha = maxAlpha = 255;
      break;
    case "semitransparent": 
      minAlpha = 100; 
      maxAlpha = 200;
      break;
    case "semitransparent-light":
      minAlpha = 50;
      maxAlpha = 150;
      break;
    case "mixed":
      // 50% chance opaque, 50% chance semitransparent
      if (SeededRandom.getRandom() < 0.5) {
        minAlpha = maxAlpha = 255;
      } else {
        minAlpha = 100; 
        maxAlpha = 200;
      }
      break;
  }

  // Generate random alpha value between minAlpha and maxAlpha (inclusive)
  const alpha = Math.floor(minAlpha + SeededRandom.getRandom() * (maxAlpha - minAlpha + 1));

  // If numberOfPartitions is null or whichPartition is null and numberOfPartitions is 1,
  // generate completely random RGB values
  if (numberOfPartitions == null || (whichPartition == null && numberOfPartitions === 1)) {
      return new Color(
          Math.floor(SeededRandom.getRandom() * 256),
          Math.floor(SeededRandom.getRandom() * 256),
          Math.floor(SeededRandom.getRandom() * 256),
          alpha
      );
  }

  // Ensure numberOfPartitions is at least 1
  numberOfPartitions = Math.max(1, numberOfPartitions);

  // If whichPartition is null, choose random partition
  if (whichPartition == null) {
      whichPartition = Math.floor(SeededRandom.getRandom() * numberOfPartitions);
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
      const randomBits = Math.floor(SeededRandom.getRandom() * (1 << remainingBits));
      channels[i] |= randomBits;
  }
  
  return new Color(channels[0], channels[1], channels[2], alpha);
}
class PixelSet {
  constructor(pixelRenderer) {
    this.pixels = new Map();
    this.pixelRenderer = pixelRenderer;
  }

  addPixel(x, y, r, g, b, a) {
    const key = `${Math.round(x)},${Math.round(y)}`;
    this.pixels.set(key, { x: Math.round(x), y: Math.round(y), r, g, b, a });
  }

  paint() {
    for (const pixel of this.pixels.values()) {
      this.pixelRenderer.setPixel(pixel.x, pixel.y, pixel.r, pixel.g, pixel.b, pixel.a);
    }
  }
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

/**
 * BitBuffer class for SWCanvas
 *
 * A utility class for managing 1-bit per pixel data structures.
 * Used as a composition component by ClipMask and SourceMask to eliminate
 * code duplication while maintaining clear separation of concerns.
 *
 * Following Joshua Bloch's principle: "Favor composition over inheritance" (Item 18)
 *
 * Memory Layout:
 * - Each pixel is represented by 1 bit
 * - Bits are packed into Uint8Array (8 pixels per byte)
 * - Memory usage: width × height ÷ 8 bytes
 */
class BitBuffer {
    /**
     * Create a BitBuffer
     * @param {number} width - Buffer width in pixels
     * @param {number} height - Buffer height in pixels
     * @param {number} defaultValue - Default bit value (0 or 1)
     */
    constructor(width, height, defaultValue = 0) {
        // Validate parameters
        if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) {
            throw new Error('BitBuffer width must be a positive integer');
        }

        if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) {
            throw new Error('BitBuffer height must be a positive integer');
        }

        if (defaultValue !== 0 && defaultValue !== 1) {
            throw new Error('BitBuffer defaultValue must be 0 or 1');
        }

        this._width = width;
        this._height = height;
        this._numPixels = width * height;
        this._numBytes = Math.ceil(this._numPixels / 8);
        this._defaultValue = defaultValue;

        // Create buffer and initialize to default value
        this._buffer = new Uint8Array(this._numBytes);
        this._initializeToDefault();

        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
    }

    /**
     * Initialize buffer to default value
     * @private
     */
    _initializeToDefault() {
        if (this._defaultValue === 1) {
            // Initialize to all 1s
            this._buffer.fill(0xFF);

            // Handle partial last byte if width*height is not divisible by 8
            const remainderBits = this._numPixels % 8;
            if (remainderBits !== 0) {
                const lastByteIndex = this._numBytes - 1;
                const lastByteMask = (1 << remainderBits) - 1;
                this._buffer[lastByteIndex] = lastByteMask;
            }
        } else {
            // Initialize to all 0s (default for Uint8Array)
            this._buffer.fill(0);
        }
    }

    /**
     * Get bit value for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if bit is 1, false if bit is 0
     */
    getPixel(x, y) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return false; // Out of bounds pixels return 0
        }

        const pixelIndex = y * this._width + x;
        return this._getBit(pixelIndex) === 1;
    }

    /**
     * Set bit value for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} value - True to set bit to 1, false to set to 0
     */
    setPixel(x, y, value) {
        // Bounds checking
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return; // Ignore out of bounds
        }

        const pixelIndex = y * this._width + x;
        this._setBit(pixelIndex, value ? 1 : 0);
    }

    /**
     * Clear all bits (set to 0)
     */
    clear() {
        this._buffer.fill(0);
    }

    /**
     * Fill all bits (set to 1)
     */
    fill() {
        this._buffer.fill(0xFF);

        // Handle partial last byte
        const remainderBits = this._numPixels % 8;
        if (remainderBits !== 0) {
            const lastByteIndex = this._numBytes - 1;
            const lastByteMask = (1 << remainderBits) - 1;
            this._buffer[lastByteIndex] = lastByteMask;
        }
    }

    /**
     * Reset buffer to its default value
     */
    reset() {
        this._initializeToDefault();
    }

    /**
     * Perform bitwise AND with another BitBuffer
     * @param {BitBuffer} other - Other BitBuffer to AND with
     */
    and(other) {
        if (!(other instanceof BitBuffer)) {
            throw new Error('Argument must be a BitBuffer instance');
        }

        if (other._width !== this._width || other._height !== this._height) {
            throw new Error('BitBuffer dimensions must match for AND operation');
        }

        // Perform bitwise AND on each byte
        for (let i = 0; i < this._numBytes; i++) {
            this._buffer[i] &= other._buffer[i];
        }
    }

    /**
     * Copy data from another BitBuffer
     * @param {BitBuffer} other - Source BitBuffer to copy from
     */
    copyFrom(other) {
        if (!(other instanceof BitBuffer)) {
            throw new Error('Argument must be a BitBuffer instance');
        }

        if (other._width !== this._width || other._height !== this._height) {
            throw new Error('BitBuffer dimensions must match for copy operation');
        }

        this._buffer.set(other._buffer);
    }

    /**
     * Check if buffer is completely filled (all 1s)
     * @returns {boolean} True if all bits are 1
     */
    isFull() {
        // Quick check: if all bytes are 0xFF except possibly the last one
        for (let i = 0; i < this._numBytes - 1; i++) {
            if (this._buffer[i] !== 0xFF) {
                return false;
            }
        }

        // Check last byte accounting for partial bits
        const remainderBits = this._numPixels % 8;
        if (remainderBits === 0) {
            return this._buffer[this._numBytes - 1] === 0xFF;
        } else {
            const lastByteMask = (1 << remainderBits) - 1;
            return this._buffer[this._numBytes - 1] === lastByteMask;
        }
    }

    /**
     * Check if buffer is completely empty (all 0s)
     * @returns {boolean} True if all bits are 0
     */
    isEmpty() {
        for (let i = 0; i < this._numBytes; i++) {
            if (this._buffer[i] !== 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage of the buffer
     */
    getMemoryUsage() {
        return this._buffer.byteLength;
    }

    /**
     * Get bit value at linear pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @returns {number} 0 or 1
     * @private
     */
    _getBit(pixelIndex) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;

        if (byteIndex >= this._buffer.length) {
            return 0; // Out of bounds pixels return 0
        }

        return (this._buffer[byteIndex] & (1 << bitIndex)) !== 0 ? 1 : 0;
    }

    /**
     * Set bit value at linear pixel index
     * @param {number} pixelIndex - Linear pixel index
     * @param {number} value - 0 or 1
     * @private
     */
    _setBit(pixelIndex, value) {
        const byteIndex = Math.floor(pixelIndex / 8);
        const bitIndex = pixelIndex % 8;

        if (byteIndex >= this._buffer.length) {
            return; // Ignore out of bounds
        }

        if (value) {
            this._buffer[byteIndex] |= (1 << bitIndex);
        } else {
            this._buffer[byteIndex] &= ~(1 << bitIndex);
        }
    }

    /**
     * String representation for debugging
     * @returns {string} BitBuffer description
     */
    toString() {
        const memoryKB = (this.getMemoryUsage() / 1024).toFixed(2);
        const state = this.isEmpty() ? 'empty' : this.isFull() ? 'full' : 'mixed';
        return `BitBuffer(${this._width}×${this._height}, ${memoryKB}KB, ${state})`;
    }

    /**
     * Check equality with another BitBuffer
     * @param {BitBuffer} other - Other BitBuffer to compare
     * @returns {boolean} True if buffers are identical
     */
    equals(other) {
        if (!(other instanceof BitBuffer)) {
            return false;
        }

        if (other._width !== this._width || other._height !== this._height) {
            return false;
        }

        // Compare buffer contents
        for (let i = 0; i < this._numBytes; i++) {
            if (this._buffer[i] !== other._buffer[i]) {
                return false;
            }
        }

        return true;
    }
}
/**
 * ClipMask class for SWCanvas
 *
 * Represents a 1-bit stencil buffer for memory-efficient clipping operations.
 * Uses composition with BitBuffer to eliminate code duplication while maintaining
 * clear separation of concerns (Joshua Bloch Item 18: Favor composition over inheritance).
 *
 * Memory Layout:
 * - Each pixel is represented by 1 bit (1 = visible, 0 = clipped)
 * - Bits are packed into Uint8Array (8 pixels per byte)
 * - Memory usage: width × height ÷ 8 bytes (87.5% reduction vs full coverage)
 */
class ClipMask {
    /**
     * Create a ClipMask
     * @param {number} width - Surface width in pixels
     * @param {number} height - Surface height in pixels
     */
    constructor(width, height) {
        // BitBuffer validates parameters and handles bit manipulation
        // Default to 1 (no clipping by default)
        this._bitBuffer = new BitBuffer(width, height, 1);

        // Make dimensions immutable
        Object.defineProperty(this, 'width', { value: width, writable: false });
        Object.defineProperty(this, 'height', { value: height, writable: false });
    }

    /**
     * Direct buffer access for hot-loop optimizations (dual-access pattern).
     * Use this for performance-critical code that needs direct bitwise operations.
     * @returns {Uint8Array} The raw bit buffer
     */
    get buffer() {
        return this._bitBuffer._buffer;
    }

    /**
     * Get clip state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if pixel is visible (not clipped)
     */
    getPixel(x, y) {
        return this._bitBuffer.getPixel(x, y);
    }

    /**
     * Set clip state for a pixel
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {boolean} visible - True if pixel should be visible
     */
    setPixel(x, y, visible) {
        this._bitBuffer.setPixel(x, y, visible);
    }

    /**
     * Check if a pixel is clipped (convenience method)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if pixel is clipped out
     */
    isPixelClipped(x, y) {
        return !this.getPixel(x, y);
    }

    /**
     * Clear all clipping (set all pixels to visible)
     */
    clear() {
        this._bitBuffer.fill(); // Fill with 1s (visible)
    }

    /**
     * Set all pixels to clipped state
     */
    clipAll() {
        this._bitBuffer.clear(); // Clear to 0s (clipped)
    }

    /**
     * Intersect this clip mask with another (AND operation)
     * Only pixels visible in BOTH masks will remain visible
     * @param {ClipMask} other - Other clip mask to intersect with
     */
    intersectWith(other) {
        if (!(other instanceof ClipMask)) {
            throw new Error('Argument must be a ClipMask instance');
        }

        this._bitBuffer.and(other._bitBuffer);
    }

    /**
     * Create a deep copy of this clip mask
     * @returns {ClipMask} New ClipMask with copied data
     */
    clone() {
        const clone = new ClipMask(this.width, this.height);
        clone._bitBuffer.copyFrom(this._bitBuffer);
        return clone;
    }

    /**
     * Create a clip pixel writer function for path rendering
     * @returns {Function} clipPixel function for coverage-based rendering
     */
    createPixelWriter() {
        return (x, y, coverage) => {
            // Bounds checking
            if (x < 0 || x >= this._width || y < 0 || y >= this._height) return;

            // Convert coverage to binary: >0.5 means inside, <=0.5 means outside
            const isInside = coverage > 0.5;
            this.setPixel(x, y, isInside);
        };
    }

    /**
     * Get memory usage in bytes
     * @returns {number} Memory usage of the clip mask
     */
    getMemoryUsage() {
        return this._bitBuffer.getMemoryUsage();
    }

    /**
     * Check if mask has any clipping (optimization)
     * @returns {boolean} True if any pixels are clipped
     */
    hasClipping() {
        return !this._bitBuffer.isFull();
    }

    /**
     * String representation for debugging
     * @returns {string} ClipMask description
     */
    toString() {
        const memoryKB = (this.getMemoryUsage() / 1024).toFixed(2);
        const clippingStatus = this.hasClipping() ? 'with clipping' : 'no clipping';
        return `ClipMask(${this.width}×${this.height}, ${memoryKB}KB, ${clippingStatus})`;
    }

    /**
     * Check equality with another ClipMask
     * @param {ClipMask} other - Other ClipMask to compare
     * @returns {boolean} True if masks are identical
     */
    equals(other) {
        if (!(other instanceof ClipMask)) {
            return false;
        }

        return this._bitBuffer.equals(other._bitBuffer);
    }
}
/**
 * Transform2D class for SWCanvas
 *
 * Represents a 2D affine transformation matrix using homogeneous coordinates.
 * Immutable value object following Joshua Bloch's effective design principles.
 *
 * Transform2D format (2x3 affine transformation):
 * | a  c  e |   | x |   | ax + cy + e |
 * | b  d  f | × | y | = | bx + dy + f |
 * | 0  0  1 |   | 1 |   |      1      |
 */
class Transform2D {
    /**
     * Create a Transform2D matrix
     * @param {number[]|undefined} init - Optional [a, b, c, d, e, f] array
     */
    constructor(init) {
        if (init && Array.isArray(init) && init.length === 6) {
            // Validate input values
            for (let i = 0; i < 6; i++) {
                if (typeof init[i] !== 'number' || !isFinite(init[i])) {
                    throw new Error(`Transform2D component ${i} must be a finite number`);
                }
            }

            this.a = init[0];
            this.b = init[1];
            this.c = init[2];
            this.d = init[3];
            this.e = init[4];
            this.f = init[5];
        } else if (init && init.length !== undefined) {
            throw new Error('Transform2D initialization array must have exactly 6 elements');
        } else {
            // Identity transformation
            this.a = 1; this.b = 0;
            this.c = 0; this.d = 1;
            this.e = 0; this.f = 0;
        }

        // Make transformation immutable
        Object.freeze(this);
    }


    /**
     * Create translation transform
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @returns {Transform2D} Translation transformation
     */
    static translation(x, y) {
        return new Transform2D([1, 0, 0, 1, x, y]);
    }

    /**
     * Create scaling transform
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Transform2D} Scaling transformation
     */
    static scaling(sx, sy) {
        return new Transform2D([sx, 0, 0, sy, 0, 0]);
    }

    /**
     * Create rotation transform
     * @param {number} angleInRadians - Rotation angle in radians
     * @returns {Transform2D} Rotation transformation
     */
    static rotation(angleInRadians) {
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        return new Transform2D([cos, sin, -sin, cos, 0, 0]);
    }

    /**
     * Multiply this transform with another (immutable)
     * @param {Transform2D} other - Transform to multiply with
     * @returns {Transform2D} Result of multiplication
     */
    multiply(other) {
        if (!(other instanceof Transform2D)) {
            throw new Error('Can only multiply with another Transform2D');
        }

        return new Transform2D([
            this.a * other.a + this.c * other.b,
            this.b * other.a + this.d * other.b,
            this.a * other.c + this.c * other.d,
            this.b * other.c + this.d * other.d,
            this.a * other.e + this.c * other.f + this.e,
            this.b * other.e + this.d * other.f + this.f
        ]);
    }

    /**
     * Apply translation to this transform (immutable)
     * @param {number} x - X translation
     * @param {number} y - Y translation
     * @returns {Transform2D} New transformed matrix
     */
    translate(x, y) {
        const t = Transform2D.translation(x, y);
        return this.multiply(t);
    }

    /**
     * Apply scaling to this transform (immutable)
     * @param {number} sx - X scale factor
     * @param {number} sy - Y scale factor
     * @returns {Transform2D} New transformed matrix
     */
    scale(sx, sy) {
        const s = Transform2D.scaling(sx, sy);
        return this.multiply(s);
    }

    /**
     * Apply rotation to this transform (immutable)
     * @param {number} angleInRadians - Rotation angle in radians
     * @returns {Transform2D} New transformed matrix
     */
    rotate(angleInRadians) {
        const r = Transform2D.rotation(angleInRadians);
        return this.multiply(r);
    }

    /**
     * Calculate inverse transformation (immutable)
     * @returns {Transform2D} Inverse transformation
     */
    invert() {
        const det = this.a * this.d - this.b * this.c;

        if (Math.abs(det) < 1e-10) {
            throw new Error('Transform2D matrix is not invertible (determinant ≈ 0)');
        }

        return new Transform2D([
            this.d / det,
            -this.b / det,
            -this.c / det,
            this.a / det,
            (this.c * this.f - this.d * this.e) / det,
            (this.b * this.e - this.a * this.f) / det
        ]);
    }

    /**
     * Transform a point using this matrix
     * @param {Object|Point} point - Point with x,y properties
     * @returns {Object} Transformed point {x, y}
     */
    transformPoint(point) {
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
            throw new Error('Point must have numeric x and y properties');
        }

        return {
            x: this.a * point.x + this.c * point.y + this.e,
            y: this.b * point.x + this.d * point.y + this.f
        };
    }

    /**
     * Transform multiple points efficiently
     * @param {Array} points - Array of points to transform
     * @returns {Array} Array of transformed points
     */
    transformPoints(points) {
        return points.map(point => this.transformPoint(point));
    }

    /**
     * Get transformation as array
     * @returns {number[]} [a, b, c, d, e, f] array
     */
    toArray() {
        return [this.a, this.b, this.c, this.d, this.e, this.f];
    }

    /**
     * Check if this is the identity transformation
     * @returns {boolean} True if identity
     */
    get isIdentity() {
        return this.a === 1 && this.b === 0 && this.c === 0 &&
               this.d === 1 && this.e === 0 && this.f === 0;
    }

    /**
     * Get transformation determinant
     * @returns {number} Transform2D determinant
     */
    get determinant() {
        return this.a * this.d - this.b * this.c;
    }

    /**
     * Get the rotation angle from the transformation matrix
     * @returns {number} Rotation angle in radians
     */
    get rotationAngle() {
        return Math.atan2(-this.c, this.a);
    }

    /**
     * Get the X scale factor from the transformation matrix
     * @returns {number} Scale factor along X axis
     */
    get scaleX() {
        return Math.sqrt(this.a * this.a + this.b * this.b);
    }

    /**
     * Get the Y scale factor from the transformation matrix
     * @returns {number} Scale factor along Y axis
     */
    get scaleY() {
        return Math.sqrt(this.c * this.c + this.d * this.d);
    }

    /**
     * Calculate the scaled line width based on the current transformation
     * Uses the geometric mean of scale factors, clamped to avoid zero
     * @param {number} baseWidth - The base line width before transformation
     * @returns {number} The scaled line width
     */
    getScaledLineWidth(baseWidth) {
        const scale = Math.max(Math.sqrt(this.scaleX * this.scaleY), 0.0001);
        return baseWidth * scale;
    }

    /**
     * Check equality with another transform
     * @param {Transform2D} other - Transform to compare
     * @param {number} tolerance - Floating point tolerance
     * @returns {boolean} True if transforms are equal within tolerance
     */
    equals(other, tolerance = 1e-10) {
        return other instanceof Transform2D &&
               Math.abs(this.a - other.a) < tolerance &&
               Math.abs(this.b - other.b) < tolerance &&
               Math.abs(this.c - other.c) < tolerance &&
               Math.abs(this.d - other.d) < tolerance &&
               Math.abs(this.e - other.e) < tolerance &&
               Math.abs(this.f - other.f) < tolerance;
    }

    /**
     * String representation for debugging
     * @returns {string} Transform2D description
     */
    toString() {
        return `Transform2D([${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f}])`;
    }
}
/**
 * Color class for SWCanvas
 *
 * Encapsulates color operations, conversions, and alpha blending math.
 * Follows Joshua Bloch's principle of making classes immutable where practical.
 *
 * Internally uses premultiplied sRGB for consistency with HTML5 Canvas behavior.
 * Provides methods for converting between premultiplied and non-premultiplied forms.
 */
class Color {
    /**
     * Create a Color instance
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @param {number} a - Alpha component (0-255)
     * @param {boolean} isPremultiplied - Whether values are already premultiplied
     */
    constructor(r, g, b, a = 255, isPremultiplied = false) {
        // Validate input ranges
        if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || a < 0 || a > 255) {
            throw new Error('Color components must be in range 0-255');
        }

        if (isPremultiplied) {
            this._r = Math.round(r);
            this._g = Math.round(g);
            this._b = Math.round(b);
            this._a = Math.round(a);
        } else {
            // Convert to premultiplied form
            const alpha = a / 255;
            this._r = Math.round(r * alpha);
            this._g = Math.round(g * alpha);
            this._b = Math.round(b * alpha);
            this._a = Math.round(a);
        }
    }

    // Getters for premultiplied components (internal storage format)
    get premultipliedR() { return this._r; }
    get premultipliedG() { return this._g; }
    get premultipliedB() { return this._b; }
    get premultipliedA() { return this._a; }

    // Getters for non-premultiplied components (API-friendly)
    get r() {
        if (this._a === 0) return 0;
        if (this._a === 255) return this._r;
        return Math.round((this._r * 255) / this._a);
    }

    get g() {
        if (this._a === 0) return 0;
        if (this._a === 255) return this._g;
        return Math.round((this._g * 255) / this._a);
    }

    get b() {
        if (this._a === 0) return 0;
        if (this._a === 255) return this._b;
        return Math.round((this._b * 255) / this._a);
    }

    get a() {
        return this._a;
    }

    /**
     * Get non-premultiplied RGBA array
     * @returns {number[]} [r, g, b, a] array
     */
    toRGBA() {
        return [this.r, this.g, this.b, this.a];
    }

    /**
     * Get premultiplied RGBA array (internal storage format)
     * @returns {number[]} [r, g, b, a] array with RGB premultiplied
     */
    toPremultipliedRGBA() {
        return [this._r, this._g, this._b, this._a];
    }

    /**
     * Get alpha as normalized value (0-1)
     * @returns {number} Alpha in 0-1 range
     */
    get normalizedAlpha() {
        return this._a / 255;
    }

    /**
     * Check if color is fully transparent
     * @returns {boolean} True if alpha is 0
     */
    get isTransparent() {
        return this._a === 0;
    }

    /**
     * Check if color is fully opaque
     * @returns {boolean} True if alpha is 255
     */
    get isOpaque() {
        return this._a === 255;
    }

    /**
     * Apply global alpha to this color (immutable operation)
     * @param {number} globalAlpha - Alpha multiplier (0-1)
     * @returns {Color} New Color with applied global alpha
     */
    withGlobalAlpha(globalAlpha) {
        if (globalAlpha < 0 || globalAlpha > 1) {
            throw new Error('Global alpha must be in range 0-1');
        }

        // Work with non-premultiplied values to apply global alpha correctly
        const nonPremultR = this.r;
        const nonPremultG = this.g;
        const nonPremultB = this.b;
        const nonPremultA = this.a;

        const newAlpha = Math.round(nonPremultA * globalAlpha);
        return new Color(nonPremultR, nonPremultG, nonPremultB, newAlpha, false);
    }

    /**
     * Blend this color over another color using source-over composition
     * @param {Color} background - Background color to blend over
     * @returns {Color} New Color representing the blended result
     */
    blendOver(background) {
        if (this._a === 255) {
            // Source is opaque - return source
            return this;
        }

        if (this._a === 0) {
            // Source is transparent - return background
            return background;
        }

        // Standard premultiplied alpha blending
        const srcAlpha = this.normalizedAlpha;
        const invSrcAlpha = 1 - srcAlpha;

        const newR = Math.round(this._r + background._r * invSrcAlpha);
        const newG = Math.round(this._g + background._g * invSrcAlpha);
        const newB = Math.round(this._b + background._b * invSrcAlpha);
        const newA = Math.round(this._a + background._a * invSrcAlpha);

        return new Color(newR, newG, newB, newA, true);
    }

    /**
     * Convert color for BMP output (non-premultiplied RGB)
     * @returns {Object} {r, g, b} object for BMP encoding
     */
    toBMP() {
        return {
            r: this.r,
            g: this.g,
            b: this.b
        };
    }

    /**
     * Convert to CSS rgba() string
     * @returns {string} CSS rgba() format string
     */
    toCSS() {
        const alpha = (this.a / 255).toFixed(3).replace(/\.?0+$/, '');
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`;
    }

    /**
     * String representation for debugging
     * @returns {string} Color description
     */
    toString() {
        return `Color(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    /**
     * Check equality with another Color
     * @param {Color} other - Color to compare with
     * @returns {boolean} True if colors are equal
     */
    equals(other) {
        return other instanceof Color &&
            this._r === other._r &&
            this._g === other._g &&
            this._b === other._b &&
            this._a === other._a;
    }
}

// Static constant: transparent black
Color.transparent = new Color(0, 0, 0, 0);

// Static constant: opaque black
Color.black = new Color(0, 0, 0, 255);

/**
 * Create Color from CSS string using provided parser
 * @param {string} cssString - CSS color string
 * @param {ColorParser} parser - ColorParser instance
 * @returns {Color} New Color instance
 */
Color.fromCSS = function (cssString, parser) {
    if (!cssString || typeof cssString !== 'string') {
        throw new Error("Invalid color format: must be a string");
    }
    const parsed = parser.parse(cssString);
    return new Color(parsed.r, parsed.g, parsed.b, parsed.a, false);
};
/**
 * ColorParser for SWCanvas
 *
 * Parses CSS color strings into RGBA values for use with Core API.
 * Supports hex, RGB/RGBA functions, and named colors.
 * Includes caching for performance optimization.
 */
class ColorParser {
    constructor() {
        this._cache = new Map();

        // CSS Color names to RGB mapping - Complete MDN specification
        this._namedColors = {
            // CSS Level 1 colors
            black: { r: 0, g: 0, b: 0 },
            silver: { r: 192, g: 192, b: 192 },
            gray: { r: 128, g: 128, b: 128 },
            white: { r: 255, g: 255, b: 255 },
            maroon: { r: 128, g: 0, b: 0 },
            red: { r: 255, g: 0, b: 0 },
            purple: { r: 128, g: 0, b: 128 },
            fuchsia: { r: 255, g: 0, b: 255 },
            green: { r: 0, g: 128, b: 0 },
            lime: { r: 0, g: 255, b: 0 },
            olive: { r: 128, g: 128, b: 0 },
            yellow: { r: 255, g: 255, b: 0 },
            navy: { r: 0, g: 0, b: 128 },
            blue: { r: 0, g: 0, b: 255 },
            teal: { r: 0, g: 128, b: 128 },
            aqua: { r: 0, g: 255, b: 255 },

            // CSS Level 2 (X11) colors
            aliceblue: { r: 240, g: 248, b: 255 },
            antiquewhite: { r: 250, g: 235, b: 215 },
            aquamarine: { r: 127, g: 255, b: 212 },
            azure: { r: 240, g: 255, b: 255 },
            beige: { r: 245, g: 245, b: 220 },
            bisque: { r: 255, g: 228, b: 196 },
            blanchedalmond: { r: 255, g: 235, b: 205 },
            blueviolet: { r: 138, g: 43, b: 226 },
            brown: { r: 165, g: 42, b: 42 },
            burlywood: { r: 222, g: 184, b: 135 },
            cadetblue: { r: 95, g: 158, b: 160 },
            chartreuse: { r: 127, g: 255, b: 0 },
            chocolate: { r: 210, g: 105, b: 30 },
            coral: { r: 255, g: 127, b: 80 },
            cornflowerblue: { r: 100, g: 149, b: 237 },
            cornsilk: { r: 255, g: 248, b: 220 },
            crimson: { r: 220, g: 20, b: 60 },
            cyan: { r: 0, g: 255, b: 255 }, // synonym of aqua
            darkblue: { r: 0, g: 0, b: 139 },
            darkcyan: { r: 0, g: 139, b: 139 },
            darkgoldenrod: { r: 184, g: 134, b: 11 },
            darkgray: { r: 169, g: 169, b: 169 },
            darkgreen: { r: 0, g: 100, b: 0 },
            darkgrey: { r: 169, g: 169, b: 169 }, // synonym of darkgray
            darkkhaki: { r: 189, g: 183, b: 107 },
            darkmagenta: { r: 139, g: 0, b: 139 },
            darkolivegreen: { r: 85, g: 107, b: 47 },
            darkorange: { r: 255, g: 140, b: 0 },
            darkorchid: { r: 153, g: 50, b: 204 },
            darkred: { r: 139, g: 0, b: 0 },
            darksalmon: { r: 233, g: 150, b: 122 },
            darkseagreen: { r: 143, g: 188, b: 143 },
            darkslateblue: { r: 72, g: 61, b: 139 },
            darkslategray: { r: 47, g: 79, b: 79 },
            darkslategrey: { r: 47, g: 79, b: 79 }, // synonym of darkslategray
            darkturquoise: { r: 0, g: 206, b: 209 },
            darkviolet: { r: 148, g: 0, b: 211 },
            deeppink: { r: 255, g: 20, b: 147 },
            deepskyblue: { r: 0, g: 191, b: 255 },
            dimgray: { r: 105, g: 105, b: 105 },
            dimgrey: { r: 105, g: 105, b: 105 }, // synonym of dimgray
            dodgerblue: { r: 30, g: 144, b: 255 },
            firebrick: { r: 178, g: 34, b: 34 },
            floralwhite: { r: 255, g: 250, b: 240 },
            forestgreen: { r: 34, g: 139, b: 34 },
            gainsboro: { r: 220, g: 220, b: 220 },
            ghostwhite: { r: 248, g: 248, b: 255 },
            gold: { r: 255, g: 215, b: 0 },
            goldenrod: { r: 218, g: 165, b: 32 },
            grey: { r: 128, g: 128, b: 128 }, // synonym of gray
            greenyellow: { r: 173, g: 255, b: 47 },
            honeydew: { r: 240, g: 255, b: 240 },
            hotpink: { r: 255, g: 105, b: 180 },
            indianred: { r: 205, g: 92, b: 92 },
            indigo: { r: 75, g: 0, b: 130 },
            ivory: { r: 255, g: 255, b: 240 },
            khaki: { r: 240, g: 230, b: 140 },
            lavender: { r: 230, g: 230, b: 250 },
            lavenderblush: { r: 255, g: 240, b: 245 },
            lawngreen: { r: 124, g: 252, b: 0 },
            lemonchiffon: { r: 255, g: 250, b: 205 },
            lightblue: { r: 173, g: 216, b: 230 },
            lightcoral: { r: 240, g: 128, b: 128 },
            lightcyan: { r: 224, g: 255, b: 255 },
            lightgoldenrodyellow: { r: 250, g: 250, b: 210 },
            lightgray: { r: 211, g: 211, b: 211 },
            lightgreen: { r: 144, g: 238, b: 144 },
            lightgrey: { r: 211, g: 211, b: 211 }, // synonym of lightgray
            lightpink: { r: 255, g: 182, b: 193 },
            lightsalmon: { r: 255, g: 160, b: 122 },
            lightseagreen: { r: 32, g: 178, b: 170 },
            lightskyblue: { r: 135, g: 206, b: 250 },
            lightslategray: { r: 119, g: 136, b: 153 },
            lightslategrey: { r: 119, g: 136, b: 153 }, // synonym of lightslategray
            lightsteelblue: { r: 176, g: 196, b: 222 },
            lightyellow: { r: 255, g: 255, b: 224 },
            limegreen: { r: 50, g: 205, b: 50 },
            linen: { r: 250, g: 240, b: 230 },
            magenta: { r: 255, g: 0, b: 255 }, // synonym of fuchsia
            mediumaquamarine: { r: 102, g: 205, b: 170 },
            mediumblue: { r: 0, g: 0, b: 205 },
            mediumorchid: { r: 186, g: 85, b: 211 },
            mediumpurple: { r: 147, g: 112, b: 219 },
            mediumseagreen: { r: 60, g: 179, b: 113 },
            mediumslateblue: { r: 123, g: 104, b: 238 },
            mediumspringgreen: { r: 0, g: 250, b: 154 },
            mediumturquoise: { r: 72, g: 209, b: 204 },
            mediumvioletred: { r: 199, g: 21, b: 133 },
            midnightblue: { r: 25, g: 25, b: 112 },
            mintcream: { r: 245, g: 255, b: 250 },
            mistyrose: { r: 255, g: 228, b: 225 },
            moccasin: { r: 255, g: 228, b: 181 },
            navajowhite: { r: 255, g: 222, b: 173 },
            oldlace: { r: 253, g: 245, b: 230 },
            olivedrab: { r: 107, g: 142, b: 35 },
            orange: { r: 255, g: 165, b: 0 },
            orangered: { r: 255, g: 69, b: 0 },
            orchid: { r: 218, g: 112, b: 214 },
            palegoldenrod: { r: 238, g: 232, b: 170 },
            palegreen: { r: 152, g: 251, b: 152 },
            paleturquoise: { r: 175, g: 238, b: 238 },
            palevioletred: { r: 219, g: 112, b: 147 },
            papayawhip: { r: 255, g: 239, b: 213 },
            peachpuff: { r: 255, g: 218, b: 185 },
            peru: { r: 205, g: 133, b: 63 },
            pink: { r: 255, g: 192, b: 203 },
            plum: { r: 221, g: 160, b: 221 },
            powderblue: { r: 176, g: 224, b: 230 },
            rebeccapurple: { r: 102, g: 51, b: 153 }, // CSS Level 4
            rosybrown: { r: 188, g: 143, b: 143 },
            royalblue: { r: 65, g: 105, b: 225 },
            saddlebrown: { r: 139, g: 69, b: 19 },
            salmon: { r: 250, g: 128, b: 114 },
            sandybrown: { r: 244, g: 164, b: 96 },
            seagreen: { r: 46, g: 139, b: 87 },
            seashell: { r: 255, g: 245, b: 238 },
            sienna: { r: 160, g: 82, b: 45 },
            skyblue: { r: 135, g: 206, b: 235 },
            slateblue: { r: 106, g: 90, b: 205 },
            slategray: { r: 112, g: 128, b: 144 },
            slategrey: { r: 112, g: 128, b: 144 }, // synonym of slategray
            snow: { r: 255, g: 250, b: 250 },
            springgreen: { r: 0, g: 255, b: 127 },
            steelblue: { r: 70, g: 130, b: 180 },
            tan: { r: 210, g: 180, b: 140 },
            thistle: { r: 216, g: 191, b: 216 },
            tomato: { r: 255, g: 99, b: 71 },
            turquoise: { r: 64, g: 224, b: 208 },
            violet: { r: 238, g: 130, b: 238 },
            wheat: { r: 245, g: 222, b: 179 },
            whitesmoke: { r: 245, g: 245, b: 245 },
            yellowgreen: { r: 154, g: 205, b: 50 }
        };
    }

    /**
     * Parse a CSS color string to RGBA values
     * @param {string} color - CSS color string
     * @returns {Object} {r, g, b, a} with values 0-255
     */
    parse(color) {
        // Check cache first
        if (this._cache.has(color)) {
            return this._cache.get(color);
        }

        let result;

        if (typeof color !== 'string') {
            result = { r: 0, g: 0, b: 0, a: 255 };
        } else {
            const trimmed = color.trim().toLowerCase();

            if (trimmed.startsWith('#')) {
                result = this._parseHex(trimmed);
            } else if (trimmed.startsWith('rgb')) {
                result = this._parseRGB(trimmed);
            } else if (this._namedColors[trimmed]) {
                const named = this._namedColors[trimmed];
                result = { r: named.r, g: named.g, b: named.b, a: 255 };
            } else {
                // Unknown color - default to black
                result = { r: 0, g: 0, b: 0, a: 255 };
            }
        }

        // Cache the result
        this._cache.set(color, result);
        return result;
    }

    /**
     * Parse hex color (#RGB, #RRGGBB, #RRGGBBAA)
     * @private
     */
    _parseHex(hex) {
        // Remove the #
        hex = hex.substring(1);

        if (hex.length === 3) {
            // #RGB -> #RRGGBB
            hex = hex.split('').map(c => c + c).join('');
        }

        if (hex.length === 6) {
            // #RRGGBB
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return { r, g, b, a: 255 };
        } else if (hex.length === 8) {
            // #RRGGBBAA
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const a = parseInt(hex.substring(6, 8), 16);
            return { r, g, b, a };
        }

        // Invalid hex - default to black
        return { r: 0, g: 0, b: 0, a: 255 };
    }

    /**
     * Parse RGB/RGBA function notation
     * @private
     */
    _parseRGB(rgb) {
        // Extract the content inside parentheses
        const match = rgb.match(/rgba?\s*\(\s*([^)]+)\s*\)/);
        if (!match) {
            return { r: 0, g: 0, b: 0, a: 255 };
        }

        const parts = match[1].split(',').map(s => s.trim());

        if (parts.length < 3) {
            return { r: 0, g: 0, b: 0, a: 255 };
        }

        const r = Math.max(0, Math.min(255, parseInt(parts[0]) || 0));
        const g = Math.max(0, Math.min(255, parseInt(parts[1]) || 0));
        const b = Math.max(0, Math.min(255, parseInt(parts[2]) || 0));

        let a = 255;
        if (parts.length >= 4) {
            const alpha = parseFloat(parts[3]);
            if (!isNaN(alpha)) {
                a = Math.max(0, Math.min(255, Math.round(alpha * 255)));
            }
        }

        return { r, g, b, a };
    }

    /**
     * Clear the color cache
     */
    clearCache() {
        this._cache.clear();
    }
}
/**
 * Represents the state of a CrispSwContext at a point in time.
 * Used for save() and restore() operations.
 */
class ContextState {
    constructor(canvasWidth, canvasHeight, lineWidth, transform, strokeColor, fillColor, globalAlpha, clippingMask) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.lineWidth = lineWidth || 1;
        this.transform = transform || new Transform2D();
        // Store Color instances (default: opaque black)
        this.strokeColor = strokeColor || Color.black;
        this.fillColor = fillColor || Color.black;
        this.globalAlpha = globalAlpha || 1.0;
        // ClipMask (defaults to all visible)
        this.clipMask = clippingMask || new ClipMask(canvasWidth, canvasHeight);
        // Direct buffer access for hot loops
        this.clippingMask = this.clipMask.buffer;
    }

    clone() {
        return new ContextState(
            this.canvasWidth, this.canvasHeight,
            this.lineWidth,
            this.transform,  // Transform2D is immutable - safe to share reference
            // Color is immutable - can reuse same instance
            this.strokeColor, this.fillColor,
            this.globalAlpha,
            this.clipMask.clone()
        );
    }
}
// Main CrispSwCanvas class
class CrispSwCanvas {
    static version = '1.0.2';

    constructor(width, height) {
        // Support both (width, height) and (canvas) constructor styles
        if (typeof width === 'object') {
            const canvas = width;
            this.width = canvas.width;
            this.height = canvas.height;
            this.title = canvas.title || '';
        } else {
            this.width = width;
            this.height = height;
            this.title = '';
        }
        
        // Create the context immediately and store it privately
        this._context = new CrispSwContext(this);
    }

    getContext(contextType) {
        if (contextType !== "2d") {
            throw new Error("Only '2d' context is supported");
        }
        return this._context;
    }
}
// Check for Node.js environment and load polyfills if needed
const isNode = typeof window === 'undefined' && typeof process !== 'undefined';

// Global ColorParser instance for parsing CSS color strings
const _colorParser = new ColorParser();

/**
 * Software-based Canvas 2D rendering context
 * This provides a subset of the CanvasRenderingContext2D API that runs
 * entirely in JavaScript without requiring the HTML5 Canvas API.
 */
class CrispSwContext {
    constructor(canvas) {
        // Store reference to the canvas element
        this.canvas = canvas;
        
        // Ensure canvas has all required properties
        if (!canvas.title) {
            canvas.title = '';
        }
        
        // Create additional compatibility properties for RenderChecks
        // Different parts of the code base might access these properties in different ways
        this.displayCanvas = {
            width: canvas.width,
            height: canvas.height,
            title: canvas.title
        };
        
        // Add title directly to context for maximum compatibility
        // Some code might expect ctx.title instead of ctx.canvas.title
        this.title = canvas.title;
        
        // Initialize the context state
        this.stateStack = [new ContextState(canvas.width, canvas.height)];
        
        // Create the frameBuffer and two views for it
        this.frameBufferUint8ClampedView = new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(0);
        // this view show optimise for when we deal with pixel values all together rather than r,g,b,a separately
        this.frameBufferUint32View = new Uint32Array(this.frameBufferUint8ClampedView.buffer);
        
        // Temporary clip mask for path recording (starts clipped)
        this.tempClipMask = new ClipMask(canvas.width, canvas.height);
        this.tempClipMask.clipAll();
        this.tempClippingMask = this.tempClipMask.buffer;
        
        // Initialize renderers
        this.pixelRenderer = new SWRendererPixel(this.frameBufferUint8ClampedView, this.frameBufferUint32View, canvas.width, canvas.height, this);
        this.lineRenderer = new SWRendererLine(this.pixelRenderer);
        this.rectRenderer = new SWRendererRect(this.frameBufferUint8ClampedView, this.frameBufferUint32View, canvas.width, canvas.height, this.lineRenderer, this.pixelRenderer);
        this.roundedRectRenderer = new SWRendererRoundedRect(this.frameBufferUint8ClampedView, this.frameBufferUint32View, canvas.width, canvas.height, this.lineRenderer, this.pixelRenderer, this.rectRenderer);
        this.circleRenderer = new SWRendererCircle(this.pixelRenderer);
        this.arcRenderer = new SWRendererArc(this.pixelRenderer);
    }

    get currentState() {
        return this.stateStack[this.stateStack.length - 1];
    }

    save() {
        this.stateStack.push(this.currentState.clone());
    }

    restore() {
        if (this.stateStack.length <= 1) {
            throw new Error("Cannot restore() - stack is empty");
        }
        this.stateStack.pop();
    }

    // Transform methods
    scale(x, y) {
        this.currentState.transform = this.currentState.transform.scale(x, y);
    }

    rotate(angle) {
        this.currentState.transform = this.currentState.transform.rotate(angle);
    }

    translate(x, y) {
        this.currentState.transform = this.currentState.transform.translate(x, y);
    }
    
    /**
     * Resets the current transformation matrix to the identity matrix
     */
    resetTransform() {
        this.currentState.transform = new Transform2D();
    }

    // Style setters and getters
    set fillStyle(style) {
        this.currentState.fillColor = Color.fromCSS(style, _colorParser);
    }

    get fillStyle() {
        return this.currentState.fillColor.toCSS();
    }

    set strokeStyle(style) {
        this.currentState.strokeColor = Color.fromCSS(style, _colorParser);
    }

    get strokeStyle() {
        return this.currentState.strokeColor.toCSS();
    }

    set lineWidth(width) {
        this.currentState.lineWidth = width;
    }

    // Add globalAlpha property
    set globalAlpha(value) {
        this.currentState.globalAlpha = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
    }

    get globalAlpha() {
        return this.currentState.globalAlpha;
    }

    // Drawing methods
    beginPath() {
        this.tempClipMask.clipAll();
    }

    fill() {
        throw new Error("fill() is not supported - use fillRect() instead");
    }

    stroke() {
        throw new Error("stroke() is not supported - use strokeRect() instead");
    }
    
    strokeLine(x1, y1, x2, y2) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);

        // Transform points according to current transformation matrix
        const start = state.transform.transformPoint({x: x1, y: y1});
        const end = state.transform.transformPoint({x: x2, y: y2});

        this.lineRenderer.drawLine({
            start: { x: start.x, y: start.y },
            end: { x: end.x, y: end.y },
            thickness: scaledLineWidth,
            color: state.strokeColor
        });
    }

    clearRect(x, y, width, height) {
        const state = this.currentState;
        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        this.rectRenderer.clearRect({
            center: { x: center.x, y: center.y },
            width: width,
            height: height,
            rotation: rotation
        });
    }

    // as the CrispSwCanvas does not support paths and fill() annd stroke() are not supported,
    // rect() is used for clipping only.
    rect(x, y, width, height) {
        const state = this.currentState;
        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        this.rectRenderer.drawRect({
            center: { x: center.x, y: center.y },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: true
        });
    }

    // The clip() function ANDs the current clippingMask with the tempClippingMask
    clip() {
        this.currentState.clipMask.intersectWith(this.tempClipMask);
        // clip() does not close the path, so we cannot clear the tempClipMask
    }


    fillRect(x, y, width, height) {
        const state = this.currentState;
        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        this.rectRenderer.drawRect({
            center: { x: center.x, y: center.y },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: 0,
            strokeColor: Color.transparent,
            fillColor: state.fillColor
        });
    }

    strokeRect(x, y, width, height) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);

        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        this.rectRenderer.drawRect({
            center: { x: center.x, y: center.y },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor,
            fillColor: Color.transparent
        });
    }

    blitToCanvas(canvas) {
        if (isNode) return;

        const imageData = new ImageData(this.frameBufferUint8ClampedView, this.canvas.width, this.canvas.height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Fill a circle with the specified color
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {Color} fillColor - Fill color as a Color instance
     */
    fillCircle(centerX, centerY, radius, fillColor) {
        const state = this.currentState;

        // Transform center point according to current transformation matrix
        const center = state.transform.transformPoint({x: centerX, y: centerY});

        // Apply scale factor to radius
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.max(scaleX, scaleY);

        // Create shape object for the circle
        const circleShape = {
            center: { x: center.x, y: center.y },
            radius: scaledRadius,
            strokeWidth: 0,
            strokeColor: Color.transparent,
            fillColor: fillColor
        };

        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }
    
    /**
     * Stroke a circle with the specified color and width
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {number} strokeWidth - Width of the stroke
     * @param {Color} strokeColor - Stroke color as a Color instance
     */
    strokeCircle(centerX, centerY, radius, strokeWidth, strokeColor) {
        const state = this.currentState;

        // Transform center point according to current transformation matrix
        const center = state.transform.transformPoint({x: centerX, y: centerY});

        // Apply scale factor to radius and stroke width
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = state.transform.getScaledLineWidth(strokeWidth);

        // Create shape object for the circle
        const circleShape = {
            center: { x: center.x, y: center.y },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: strokeColor,
            fillColor: Color.transparent
        };

        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }
    
    /**
     * Fill and stroke a circle with specified colors and stroke width
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {Color} fillColor - Fill color as a Color instance
     * @param {number} strokeWidth - Width of the stroke
     * @param {Color} strokeColor - Stroke color as a Color instance
     */
    fillAndStrokeCircle(centerX, centerY, radius, fillColor, strokeWidth, strokeColor) {
        const state = this.currentState;

        // Transform center point according to current transformation matrix
        const center = state.transform.transformPoint({x: centerX, y: centerY});

        // Apply scale factor to radius and stroke width
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = state.transform.getScaledLineWidth(strokeWidth);

        // Create shape object for the circle
        const circleShape = {
            center: { x: center.x, y: center.y },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: strokeColor,
            fillColor: fillColor
        };

        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }

    /**
     * Returns an ImageData object representing the pixel data for the specified rectangle.
     * Compatible with HTML5 Canvas getImageData method.
     * @param {number} sx - The x-coordinate of the top-left corner of the rectangle from which the data will be extracted
     * @param {number} sy - The y-coordinate of the top-left corner of the rectangle from which the data will be extracted
     * @param {number} sw - The width of the rectangle from which the data will be extracted
     * @param {number} sh - The height of the rectangle from which the data will be extracted
     * @returns {ImageData} An ImageData object containing the image data for the specified rectangle
     */
    getImageData(sx, sy, sw, sh) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Ensure parameters are within bounds
        sx = Math.max(0, Math.min(Math.floor(sx), canvasWidth));
        sy = Math.max(0, Math.min(Math.floor(sy), canvasHeight));
        sw = Math.max(0, Math.min(Math.floor(sw), canvasWidth - sx));
        sh = Math.max(0, Math.min(Math.floor(sh), canvasHeight - sy));
        
        // Create a new buffer for the extracted data
        const extractedData = new Uint8ClampedArray(sw * sh * 4);
        
        // If the requested area is the entire canvas, we can just return a copy of the frameBufferUint8ClampedView
        if (sx === 0 && sy === 0 && sw === canvasWidth && sh === canvasHeight) {
            extractedData.set(this.frameBufferUint8ClampedView);
        } else {
            // Copy pixel data from the frameBufferUint8ClampedView to the new buffer
            for (let y = 0; y < sh; y++) {
                for (let x = 0; x < sw; x++) {
                    const srcIdx = ((sy + y) * canvasWidth + (sx + x)) * 4;
                    const destIdx = (y * sw + x) * 4;
                    
                    extractedData[destIdx] = this.frameBufferUint8ClampedView[srcIdx];         // R
                    extractedData[destIdx + 1] = this.frameBufferUint8ClampedView[srcIdx + 1]; // G
                    extractedData[destIdx + 2] = this.frameBufferUint8ClampedView[srcIdx + 2]; // B
                    extractedData[destIdx + 3] = this.frameBufferUint8ClampedView[srcIdx + 3]; // A
                }
            }
        }
        
        // Return a new ImageData object with canvas info for RenderChecks compatibility
        const imageData = new ImageData(extractedData, sw, sh);
        
        // Add extra properties that some check routines might expect
        if (typeof imageData.canvasTitle === 'undefined') {
            Object.defineProperty(imageData, 'canvasTitle', {
                get: () => this.canvas.title || this.title || '',
                configurable: true
            });
        }
        
        return imageData;
    }
    
    // --- Rounded Rectangle Methods ---

    /**
     * Defines a rounded rectangle path.
     * NOTE: In this software renderer, direct path definition for later fill/stroke is complex
     * due to current fill()/stroke() limitations. This method currently does not build a path
     * in the same way as native canvas. For drawing, use fillRoundRect or strokeRoundRect.
     * It could be used for clipping if the renderer supports it.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    roundRect(x, y, width, height, radius) {
        // TODO: Implement path definition for clipping or general path store if fill()/stroke() are enhanced.
        // For now, this method might not do much or could be used for clipping.
        // console.warn("CrispSwContext.roundRect() for path definition is not fully implemented for fill/stroke. Use fillRoundRect/strokeRoundRect for drawing.");
        // Placeholder for potential clipping path definition:
        const state = this.currentState;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = state.transform.transformPoint({x: cx, y: cy});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        // This is a guess, SWRendererRoundedRect might not support clippingOnly directly
        // or might need a different shape structure for it.
        /*
        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            width: width * scaleX,
            height: height * scaleY,
            radius: radius * Math.min(scaleX, scaleY), // Simplistic radius scaling
            rotation: rotation,
            clippingOnly: true, // Hypothetical
            strokeWidth: 0,
            fillColor: {r:0,g:0,b:0,a:0},
            strokeColor: {r:0,g:0,b:0,a:0}
        });
        */
        // As rect() is used for clipping, this could be an extension point if SWRendererRoundedRect supports it.
         throw new Error("CrispSwContext.roundRect() for path definition / clipping is not yet implemented.");
    }

    /**
     * Draws a filled rounded rectangle.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    fillRoundRect(x, y, width, height, radius) {
        const state = this.currentState;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = state.transform.transformPoint({x: cx, y: cy});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: state.fillColor,
            strokeWidth: 0,
            strokeColor: Color.transparent
        });
    }

    /**
     * Draws the stroke of a rounded rectangle.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    strokeRoundRect(x, y, width, height, radius) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = state.transform.transformPoint({x: cx, y: cy});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: Color.transparent,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    // --- End Rounded Rectangle Methods ---

    // --- Arc Methods ---

    /**
     * Adds an arc to the current path (for potential clipping or future path system).
     * Angles are in radians.
     * NOTE: Currently, this method is a stub and does not build a persistent path for fill/stroke
     * due to limitations in the generic fill()/stroke() methods of CrispSwContext.
     * For drawing, use fillArc, outerStrokeArc, or fillAndOuterStrokeArc.
     */
    arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        // TODO: Implement path definition for clipping if SWRendererArc supports it,
        // or for a general path store if fill()/stroke() are enhanced.
        // For now, only full circles are supported for clipping.
        const isFullCircle = Math.abs(Math.abs(endAngle - startAngle) - (2 * Math.PI)) < 1e-9; // Check for 2PI difference

        if (isFullCircle) {
            const state = this.currentState;
            const centerTransformed = state.transform.transformPoint({x, y});
            const scaleX = state.transform.scaleX;
            const scaleY = state.transform.scaleY;
            // For circles, radius is scaled by the max of scaleX and scaleY to maintain circularity
            // as we don't support ellipses yet.
            const scaledRadius = radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));

            this.circleRenderer.drawCircle({
                center: { x: centerTransformed.x, y: centerTransformed.y },
                radius: scaledRadius,
                clippingOnly: true,
                // These are not used for clippingOnly, but provided for shape consistency
                strokeWidth: 0,
                strokeColor: Color.transparent,
                fillColor: Color.transparent
            });
        } else {
            throw new Error("CrispSwContext.arc() for path definition/clipping is only implemented for full circles. Use fillArc/outerStrokeArc for drawing partial arcs.");
        }
    }

    /**
     * Draws a filled arc (pie slice).
     * Angles are in radians.
     */
    fillArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const centerTransformed = state.transform.transformPoint({x, y});
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        // SWRendererArc.drawArc expects a shape with fillColor and strokeColor (alpha 0-255)
        // It internally handles fill and/or stroke based on these colors and strokeWidth.
        this.arcRenderer.drawArc({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: state.fillColor,
            strokeWidth: 0,
            strokeColor: Color.transparent
        });
    }

    /**
     * Draws the stroke of an arc.
     * Angles are in radians.
     */
    outerStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);
        const centerTransformed = state.transform.transformPoint({x, y});
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        this.arcRenderer.drawArc({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: Color.transparent,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    /**
     * Draws a filled and stroked arc.
     * Angles are in radians.
     */
    fillAndOuterStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);
        const centerTransformed = state.transform.transformPoint({x, y});
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        // SWRendererArc.drawArc handles both fill and stroke if both colors are opaque and strokeWidth > 0
        this.arcRenderer.drawArc({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: state.fillColor,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    // --- End Arc Methods ---
}
/**
 * Shared rendering functions that work in both browser and Node.js environments
 */

// Check if we're in Node.js or browser environment
const isNodeEnv = typeof window === 'undefined';

// In Node.js, define these as globals
// In browser, they're already defined in RenderTest.js
if (isNodeEnv) {
  // Node.js - define as global variables
  global.renderTestWidth = 600;
  global.renderTestHeight = 600;
} 
// In browser they'll be defined by RenderTest.js, so we don't need to do anything

/**
 * Draw shapes using either canvas or software renderer
 * This is defined as a variable to avoid duplicate function declarations when concatenating files
 * @param {Array} shapes - Array of shape objects to draw
 * @param {boolean} isCanvas - Whether to use canvas (true) or software renderer (false)
 * @param {CanvasRenderingContext2D} ctx - Canvas context (only used if isCanvas=true)
 * @param {Uint8ClampedArray} frameBufferUint8ClampedView - Frame buffer for SW rendering (only used if isCanvas=false)
 */
const drawShapesImplFn = function(shapes, isCanvas, ctx = null, frameBufferUint8ClampedView, frameBufferUint32View) {
  const pixelRenderer = new SWRendererPixel(frameBufferUint8ClampedView, frameBufferUint32View, renderTestWidth, renderTestHeight);
  const swLineRenderer = new SWRendererLine(pixelRenderer);
  const swRectRenderer = new SWRendererRect(frameBufferUint8ClampedView, frameBufferUint32View, renderTestWidth, renderTestHeight, swLineRenderer, pixelRenderer);
  const swRoundedRectRenderer = new SWRendererRoundedRect(frameBufferUint8ClampedView, frameBufferUint32View, renderTestWidth, renderTestHeight, swLineRenderer, pixelRenderer, swRectRenderer);
  const swCircleRenderer = new SWRendererCircle(pixelRenderer);
  const swArcRenderer = new SWRendererArc(pixelRenderer);
  
  for (let shape of shapes) {
    if (shape.type === 'line') {
      const draw = isCanvas ? drawLineCanvas : swLineRenderer.drawLine.bind(swLineRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'rect') {
      const draw = isCanvas ? drawRectCanvas : swRectRenderer.drawRect.bind(swRectRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'circle') {
      const draw = isCanvas ? drawCircleCanvas : swCircleRenderer.drawCircle.bind(swCircleRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'arc') {
      const draw = isCanvas ? drawArcCanvas : swArcRenderer.drawArc.bind(swArcRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'roundedRect') {
      const draw = isCanvas ? drawRoundedRectCanvas : swRoundedRectRenderer.drawRoundedRect.bind(swRoundedRectRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    }
  }
}

// Color instances have toCSS() method for CSS rgba() string conversion

// Assign the function to the global name expected by the codebase
const drawShapesImpl = drawShapesImplFn;

// Handle different module systems
// In browser, make sure functions are explicitly added to window
// In Node.js, export the functions
if (isNodeEnv && typeof module !== 'undefined' && module.exports) {
  // Node.js - use module.exports
  module.exports = {
    drawShapesImpl: drawShapesImplFn  // Export the function with the expected name
  };

  // Also assign to global for Node.js
  global.drawShapesImpl = drawShapesImplFn;

  // Make sure renderers are available globally in Node
  // Note: These are needed for add-tests.js to work correctly
  global.SWRendererPixel = global.SWRendererPixel || {};
  global.SWRendererLine = global.SWRendererLine || {};
  global.SWRendererRect = global.SWRendererRect || {};
  global.SWRendererRoundedRect = global.SWRendererRoundedRect || {};
  global.SWRendererCircle = global.SWRendererCircle || {};
  global.SWRendererArc = global.SWRendererArc || {};

  global.drawLineCanvas = global.drawLineCanvas || function() {};
  global.drawRectCanvas = global.drawRectCanvas || function() {};
  global.drawCircleCanvas = global.drawCircleCanvas || function() {};
  global.drawArcCanvas = global.drawArcCanvas || function() {};
  global.drawRoundedRectCanvas = global.drawRoundedRectCanvas || function() {};

  // In Node.js, we also need to define SeededRandom if it's not already available
  if (typeof global.SeededRandom === 'undefined') {
    global.SeededRandom = global.SeededRandom || {
      seedWithInteger: function(seed) {} // Dummy implementation
    };
  }
} else {
  // Browser - add to window explicitly
  window.drawShapesImpl = drawShapesImplFn;
}// Tolerance for considering an angle to be equivalent to a multiple of 90 degrees
const ANGLE_TOLERANCE = 0.001; // Radians (~0.057 degrees)

/**
 * Checks if an angle is very close to a multiple of 90 degrees
 * @param {number} angle - The angle in radians
 * @returns {boolean} True if the angle is close to 0, 90, 180, or 270 degrees
 */
function isNearMultipleOf90Degrees(angle) {
  // Normalize angle to [0, 2π)
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // Check if angle is close to 0, π/2, π, or 3π/2
  return (
    Math.abs(normalizedAngle) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - Math.PI/2) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - Math.PI) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - 3*Math.PI/2) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - 2*Math.PI) < ANGLE_TOLERANCE
  );
}

/**
 * Gets the appropriate width and height for a rotated rectangle
 * For angles near 90° or 270°, width and height are swapped
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} angle - Rotation angle in radians
 * @returns {Object} Object containing the adjusted width and height
 */
function getRotatedDimensionsIfTheCase(width, height, angle) {
  // Normalize angle to [0, 2π)
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // For angles near 90° or 270°, swap width and height
  if (
    Math.abs(normalizedAngle - Math.PI/2) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - 3*Math.PI/2) < ANGLE_TOLERANCE
  ) {
    return { adjustedWidth: height, adjustedHeight: width };
  }
  
  // For angles near 0° or 180°, keep original dimensions
  return { adjustedWidth: width, adjustedHeight: height };
}class SWRendererArc {
  constructor(pixelRenderer) {
    this.pixelRenderer = pixelRenderer;
  }

  drawArc(shape) {
    const {
      center, radius, startAngle, endAngle,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;
  
    if (fillA > 0) {
      this.drawArcHelper(center.x, center.y, radius, startAngle, endAngle,
        fillR, fillG, fillB, fillA, true);
    }
    if (strokeA > 0 && strokeWidth > 0) {
      this.drawArcHelper(center.x, center.y, radius, startAngle, endAngle,
        strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
    }
  }

  drawArcHelper(centerX, centerY, radius, startAngle, endAngle, r, g, b, a, fill = false, thickness = 1) {
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
                    this.pixelRenderer.setPixel(Math.round(centerX + x), Math.round(centerY + y), Math.round(r), g, b, a);
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
                    this.addThickArcPoint(strokePixels, centerX, centerY, centerX + px, centerY + py, thickness, startAngle, endAngle);
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
            this.pixelRenderer.setPixel(x, y, r, g, b, a);
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

  drawArcHQ(shape) {
    const {
      center, radius, startAngle, endAngle,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    // tweaks to make the sw render more closely match the canvas render
    center.x -= 0.5;
    center.y -= 0.5;

    
    if (fillA > 0) {
      this.drawArcHQHelper(center.x, center.y, radius, startAngle, endAngle,
        fillR, fillG, fillB, fillA, true);
    }
    if (strokeA > 0 && strokeWidth > 0) {
      this.drawArcHQHelper(center.x, center.y, radius, startAngle, endAngle,
        strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
    }
  }

  drawArcHQHelper(xc, yc, radius, startAngle, endAngle, r, g, b, a, fill = false, thickness = 1) {
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
                    this.pixelRenderer.setPixel(x, y, r, g, b, a);
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
                    this.pixelRenderer.setPixel(x, y, r, g, b, a);
                }
            }
        }
    }
  }

  // TODO note that if the stroke is fully opaque, then it can be drawn with a single pass
  // rather than the current two-pass approach (collect all stroke pixels, then draw them).
  addStrokePixel(strokePixels, x, y) {
    strokePixels.add(`${x},${y}`);
  }

  addThickPoint(strokePixels, x, y, thickness) {
    const halfThick = Math.floor(thickness / 2);
    for (let dy = -halfThick; dy < thickness - halfThick; dy++) {
      for (let dx = -halfThick; dx < thickness - halfThick; dx++) {
        this.addStrokePixel(strokePixels, Math.round(x + dx), Math.round(y + dy));
      }
    }
  }

  addThickArcPoint(strokePixels, xc, yc, x, y, thickness, startAngle, endAngle) {
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
}
class SWRendererCircle {
  constructor(pixelRenderer) {
    this.pixelRenderer = pixelRenderer;
  }

  drawCircle(shape) {
    const {
      center, radius,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA },
      clippingOnly
    } = shape;

    if (clippingOnly === true) {
      this._clipCircleShape(shape);
      return;
    }

    // Check for no fill and 1px stroke case - special optimization
    const hasFill = fillA > 0;
    const is1pxStroke = strokeWidth === 1 && strokeA > 0;

    if (!hasFill && is1pxStroke) {
      // Optimize for 1px stroke with no fill using Bresenham circle algorithm
      // Dispatch to either opaque or semi-transparent version based on alpha
      const isOpaque = strokeA === 255 && this.pixelRenderer.context.globalAlpha >= 1.0;
      
      if (isOpaque) {
        this.draw1PxStrokeFullCircleBresenhamOpaque(
          center.x, center.y, 
          radius,
          strokeR, strokeG, strokeB
        );
      } else {
        this.draw1PxStrokeFullCircleBresenhamAlpha(
          center.x, center.y, 
          radius,
          strokeR, strokeG, strokeB, strokeA
        );
      }
      return;
    }

    // Check for opaque fill with no stroke case - special optimization
    const hasStroke = strokeWidth > 0 && strokeA > 0;
    const isOpaqueFill = fillA === 255 && this.pixelRenderer.context.globalAlpha >= 1.0;
    
    
    if (hasFill && !hasStroke && isOpaqueFill) {
      // Optimize for opaque fill with no stroke using Bresenham circle algorithm
      this.drawOpaqueFillFullCircleBresenham(
        center.x, center.y,
        radius,
        fillR, fillG, fillB
      );
      return;
    }
    // Check for semi-transparent fill with no stroke case
    else if (hasFill && !hasStroke && !isOpaqueFill) {
       // Optimize for semi-transparent fill with no stroke using Bresenham circle algorithm
       this.drawSemiTransparentFillFullCircleBresenham(
         center.x, center.y,
         radius,
         fillR, fillG, fillB, fillA // Pass alpha
       );
       return;
     }

    // Fallback for cases not handled by optimized Bresenham methods:
    // 1. Circles with both fill and stroke.
    // 2. Stroke-only circles where strokeWidth > 1.
    const innerRadius = strokeWidth > 0 ? radius - strokeWidth / 2 : radius;
    const outerRadius = radius + strokeWidth / 2;

    // leaving this as a separate function for now because I think we might use
    // variants of this function to draw quarter-circles and arbitrary arcs in the
    // future.
    this.drawFullCircleFast(
      center.x, center.y, 
      innerRadius, outerRadius,
      fillR, fillG, fillB, fillA,
      strokeR, strokeG, strokeB, strokeA
    );
  }

  drawFullCircleSlow(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

    // This routine currently accepts and in fact "represents in the rendering" fractional coordinates.
    // Although it might seem surprising that an aliased renderer can meaningfully represent fractional coordinates,
    // it is indeed the case. Intuitively, imagine a circle that shifts slowly right by a very small fractional amount.
    // The effect is that, even if only "whole pixels" are drawn, if the circle barely touches the last column,
    // 1 pixel will be drawn on the last column, but if the circle moves just a bit further, 2 pixels will be drawn on the last column, etc.
    // Also note that this way the circle will not be perfectly simmetrical.


    // If instead you round to nearest half-integer, you'll snap the circle to discrete positions for a slightly different look
    // (which will be inevitably less similar to the canvas rendering).
    // The advantage of this snapping is that the circle will be perfectly simmetrical both vertically and horizontally.
    // In fact, it would be possible to draw thw whole circle by drawing 1/8th of the circle, and doing simple reflections
    // (however, this is not implemented yet).
    //
    //centerX = Math.round(centerX * 2) / 2;
    //centerY = Math.round(centerY * 2) / 2;    
    //innerRadius = Math.round(innerRadius * 2) / 2;
    //outerRadius = Math.round(outerRadius * 2) / 2;

    // Use exact integer centers to avoid extra pixels at edges
    const cX = centerX - 0.5;
    const cY = centerY - 0.5;
    
    // Calculate the bounds for processing with boundary checking
    const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
    const maxY = Math.min(this.pixelRenderer.height - 1, Math.ceil(cY + outerRadius + 1));
    const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
    const maxX = Math.min(this.pixelRenderer.width - 1, Math.ceil(cX + outerRadius + 1));
    
    // The path is the true mathematical circle (centered between innerRadius and outerRadius)
    const pathRadius = (innerRadius + outerRadius) / 2;
    // The fill should extend exactly to the path
    const fillRadius = pathRadius;
    const fillRadiusSquared = fillRadius * fillRadius;
    
    // Determine which rendering approach to use based on what we need to draw
    const hasFill = fillA > 0;
    const hasStroke = strokeA > 0 && outerRadius > innerRadius;
    
    // OPTIMIZATION: Choose the best rendering approach based on what's needed
    
    // Case 1: Fill only (no stroke)
    if (hasFill && !hasStroke) {
      // Fill the circle using row-by-row scanning with analytical edge detection
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        // Skip rows that don't intersect with the circle
        if (fillDistSquared < 0) continue;
        
        // Calculate horizontal span for this row using a single sqrt operation
        const fillXDist = Math.sqrt(fillDistSquared);
        
        // Calculate precise boundaries with small correction to prevent speckles
        const leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
        const rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        
        // Fill entire span without per-pixel distance check - much more efficient
        for (let x = leftFillX; x <= rightFillX; x++) {
          this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }
    
    // Case 2: Stroke only (no fill)
    else if (hasStroke && !hasFill) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
        
        // Calculate outer intersections
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Case: No inner intersection on this row
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // Draw the entire horizontal line
          for (let x = outerLeftX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Draw left segment (from outer left to inner left)
          for (let x = outerLeftX; x <= innerLeftX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
          
          // Draw right segment (from inner right to outer right)
          for (let x = innerRightX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        }
      }
    }
    
    // Case 3: Both fill and stroke - do them in a single scan for efficiency
    else if (hasFill && hasStroke) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
                
        // Calculate outer circle intersections for this row (for stroke)
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Calculate inner circle intersections if needed
        let innerLeftX = -1;
        let innerRightX = -1;
        
        if (innerRadius > 0 && dySquared <= innerRadiusSquared) {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
        }
        
        // Calculate fill circle intersections if this row passes through the fill area
        const fillDistSquared = fillRadiusSquared - dySquared;
        let leftFillX = -1;
        let rightFillX = -1;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
          rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        }
        
        // STEP 1: Draw the fill first (if this row intersects the fill circle)
        if (leftFillX >= 0) {
          for (let x = leftFillX; x <= rightFillX; x++) {
            this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
          }
        }
        
        // STEP 2: Draw the stroke on top
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // No inner circle intersection - draw the entire stroke span
          for (let x = outerLeftX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        } 
        else {
          // Intersects both inner and outer circles - draw two stroke spans
          
          // Draw left segment of stroke (from outer left to inner left)
          for (let x = outerLeftX; x <= innerLeftX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
          
          // Draw right segment of stroke (from inner right to outer right)
          for (let x = innerRightX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        }
      }
    }
  }

  drawFullCircleFast(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

    // This routine currently accepts and in fact "represents in the rendering" fractional coordinates.
    // Although it might seem surprising that an aliased renderer can meaningfully represent fractional coordinates,
    // it is indeed the case. Intuitively, imagine a circle that shifts slowly right by a very small fractional amount.
    // The effect is that, even if only "whole pixels" are drawn, if the circle barely touches the last column,
    // 1 pixel will be drawn on the last column, but if the circle moves just a bit further, 2 pixels will be drawn on the last column, etc.
    // Also note that this way the circle will not be perfectly simmetrical.


    // If instead you round to nearest half-integer, you'll snap the circle to discrete positions for a slightly different look
    // (which will be inevitably less similar to the canvas rendering).
    // The advantage of this snapping is that the circle will be perfectly simmetrical both vertically and horizontally.
    // In fact, it would be possible to draw thw whole circle by drawing 1/8th of the circle, and doing simple reflections
    // (however, this is not implemented yet).
    //
    //centerX = Math.round(centerX * 2) / 2;
    //centerY = Math.round(centerY * 2) / 2;    
    //innerRadius = Math.round(innerRadius * 2) / 2;
    //outerRadius = Math.round(outerRadius * 2) / 2;

    // Use exact integer centers to avoid extra pixels at edges
    const cX = centerX - 0.5;
    const cY = centerY - 0.5;
    
    // Calculate the bounds for processing with boundary checking
    const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
    const maxY = Math.min(this.pixelRenderer.height - 1, Math.ceil(cY + outerRadius + 1));
    const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
    const maxX = Math.min(this.pixelRenderer.width - 1, Math.ceil(cX + outerRadius + 1));
    
    // The path is the true mathematical circle (centered between innerRadius and outerRadius)
    const pathRadius = (innerRadius + outerRadius) / 2;
    // The fill should extend exactly to the path
    const fillRadius = pathRadius;
    const fillRadiusSquared = fillRadius * fillRadius;
    
    // Determine which rendering approach to use based on what we need to draw
    const hasFill = fillA > 0;
    const hasStroke = strokeA > 0 && outerRadius > innerRadius;
    
    // Arrays to collect pixel runs for batch rendering
    const fillRuns = [];
    const strokeRuns = [];
    
    // OPTIMIZATION: Choose the best rendering approach based on what's needed
    
    // Case 1: Fill only (no stroke)
    if (hasFill && !hasStroke) {
      // Fill the circle using row-by-row scanning with analytical edge detection
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        // Skip rows that don't intersect with the circle
        if (fillDistSquared < 0) continue;
        
        // Calculate horizontal span for this row using a single sqrt operation
        const fillXDist = Math.sqrt(fillDistSquared);
        
        // Calculate precise boundaries with small correction to prevent speckles
        const leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
        const rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        
        // Calculate the length of the run
        const length = rightFillX - leftFillX + 1;
        
        // Only add runs with positive length
        if (length > 0) {
          // Add the pixel run to the collection
          fillRuns.push(leftFillX, y, length);
        }
      }
      
      // Render all fill runs in a single batch operation
      if (fillRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(fillRuns, fillR, fillG, fillB, fillA);
      }
    }
    
    // Case 2: Stroke only (no fill)
    else if (hasStroke && !hasFill) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
        
        // Calculate outer intersections
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Case: No inner intersection on this row
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // Add the entire horizontal line as a single run
          const length = outerRightX - outerLeftX + 1;
          if (length > 0) {
            strokeRuns.push(outerLeftX, y, length);
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Add left segment (from outer left to inner left)
          const leftLength = innerLeftX - outerLeftX + 1;
          if (leftLength > 0) {
            strokeRuns.push(outerLeftX, y, leftLength);
          }
          
          // Add right segment (from inner right to outer right)
          const rightLength = outerRightX - innerRightX + 1;
          if (rightLength > 0) {
            strokeRuns.push(innerRightX, y, rightLength);
          }
        }
      }
      
      // Render all stroke runs in a single batch operation
      if (strokeRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(strokeRuns, strokeR, strokeG, strokeB, strokeA);
      }
    }
    
    // Case 3: Both fill and stroke - collect runs for both operations
    else if (hasFill && hasStroke) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
                
        // Calculate outer circle intersections for this row (for stroke)
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Calculate inner circle intersections if needed
        let innerLeftX = -1;
        let innerRightX = -1;
        
        if (innerRadius > 0 && dySquared <= innerRadiusSquared) {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
        }
        
        // Calculate fill circle intersections if this row passes through the fill area
        const fillDistSquared = fillRadiusSquared - dySquared;
        let leftFillX = -1;
        let rightFillX = -1;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
          rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        }
        
        // STEP 1: Collect fill runs if this row intersects the fill circle
        if (leftFillX >= 0) {
          const fillLength = rightFillX - leftFillX + 1;
          if (fillLength > 0) {
            fillRuns.push(leftFillX, y, fillLength);
          }
        }
        
        // STEP 2: Collect stroke runs
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // No inner circle intersection - collect the entire stroke span
          const strokeLength = outerRightX - outerLeftX + 1;
          if (strokeLength > 0) {
            strokeRuns.push(outerLeftX, y, strokeLength);
          }
        } 
        else {
          // Intersects both inner and outer circles - collect two stroke spans
          
          // Collect left segment of stroke (from outer left to inner left)
          const leftStrokeLength = innerLeftX - outerLeftX + 1;
          if (leftStrokeLength > 0) {
            strokeRuns.push(outerLeftX, y, leftStrokeLength);
          }
          
          // Collect right segment of stroke (from inner right to outer right)
          const rightStrokeLength = outerRightX - innerRightX + 1;
          if (rightStrokeLength > 0) {
            strokeRuns.push(innerRightX, y, rightStrokeLength);
          }
        }
      }
      
      // Render all fill runs first (so stroke will be on top)
      if (fillRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(fillRuns, fillR, fillG, fillB, fillA);
      }
      
      // Render all stroke runs
      if (strokeRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(strokeRuns, strokeR, strokeG, strokeB, strokeA);
      }
    }
  }

  // Not used. The idea was that in tha case we have both a stroke and a fill,
  // we could collect the runs for both, and then render them in a single batch operation that
  // scans the rows from top to bottom only once, for each line drawing the fill and then stroke
  // The hope was that although the number of set pixels doesn't change, this would be more cache-friendly
  // as it scans the lines sequentially only once (instead of twice), and therefore faster.
  // However, this was not faster than the other approach of doing first a pass for the fill,
  // and then for the stroke.
  drawFullCircleFastest(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

    // This routine currently accepts and in fact "represents in the rendering" fractional coordinates.
    // Although it might seem surprising that an aliased renderer can meaningfully represent fractional coordinates,
    // it is indeed the case. Intuitively, imagine a circle that shifts slowly right by a very small fractional amount.
    // The effect is that, even if only "whole pixels" are drawn, if the circle barely touches the last column,
    // 1 pixel will be drawn on the last column, but if the circle moves just a bit further, 2 pixels will be drawn on the last column, etc.
    // Also note that this way the circle will not be perfectly simmetrical.


    // If instead you round to nearest half-integer, you'll snap the circle to discrete positions for a slightly different look
    // (which will be inevitably less similar to the canvas rendering).
    // The advantage of this snapping is that the circle will be perfectly simmetrical both vertically and horizontally.
    // In fact, it would be possible to draw thw whole circle by drawing 1/8th of the circle, and doing simple reflections
    // (however, this is not implemented yet).
    //
    //centerX = Math.round(centerX * 2) / 2;
    //centerY = Math.round(centerY * 2) / 2;    
    //innerRadius = Math.round(innerRadius * 2) / 2;
    //outerRadius = Math.round(outerRadius * 2) / 2;

    // Use exact integer centers to avoid extra pixels at edges
    const cX = centerX - 0.5;
    const cY = centerY - 0.5;
    
    // Calculate the bounds for processing with boundary checking
    const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
    const maxY = Math.min(this.pixelRenderer.height - 1, Math.ceil(cY + outerRadius + 1));
    const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
    const maxX = Math.min(this.pixelRenderer.width - 1, Math.ceil(cX + outerRadius + 1));
    
    // The path is the true mathematical circle (centered between innerRadius and outerRadius)
    const pathRadius = (innerRadius + outerRadius) / 2;
    // The fill should extend exactly to the path
    const fillRadius = pathRadius;
    const fillRadiusSquared = fillRadius * fillRadius;
    
    // Determine which rendering approach to use based on what we need to draw
    const hasFill = fillA > 0;
    const hasStroke = strokeA > 0 && outerRadius > innerRadius;
    
    // Arrays to collect pixel runs for batch rendering
    const fillRuns = [];
    const strokeRuns = [];
    const combinedRuns = [];
    
    // OPTIMIZATION: Choose the best rendering approach based on what's needed
    
    // Case 1: Fill only (no stroke)
    if (hasFill && !hasStroke) {
      // Fill the circle using row-by-row scanning with analytical edge detection
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        // Skip rows that don't intersect with the circle
        if (fillDistSquared < 0) continue;
        
        // Calculate horizontal span for this row using a single sqrt operation
        const fillXDist = Math.sqrt(fillDistSquared);
        
        // Calculate precise boundaries with small correction to prevent speckles
        const leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
        const rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        
        // Calculate the length of the run
        const length = rightFillX - leftFillX + 1;
        
        // Only add runs with positive length
        if (length > 0) {
          // Add the pixel run to the collection
          fillRuns.push(leftFillX, y, length);
        }
      }
      
      // Render all fill runs in a single batch operation
      if (fillRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(fillRuns, fillR, fillG, fillB, fillA);
      }
    }
    
    // Case 2: Stroke only (no fill)
    else if (hasStroke && !hasFill) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
        
        // Calculate outer intersections
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Case: No inner intersection on this row
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // Add the entire horizontal line as a single run
          const length = outerRightX - outerLeftX + 1;
          if (length > 0) {
            strokeRuns.push(outerLeftX, y, length);
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Add left segment (from outer left to inner left)
          const leftLength = innerLeftX - outerLeftX + 1;
          if (leftLength > 0) {
            strokeRuns.push(outerLeftX, y, leftLength);
          }
          
          // Add right segment (from inner right to outer right)
          const rightLength = outerRightX - innerRightX + 1;
          if (rightLength > 0) {
            strokeRuns.push(innerRightX, y, rightLength);
          }
        }
      }
      
      // Render all stroke runs in a single batch operation
      if (strokeRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(strokeRuns, strokeR, strokeG, strokeB, strokeA);
      }
    }
    
    // Case 3: Both fill and stroke - use the optimized combined method
    else if (hasFill && hasStroke) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
                
        // Calculate outer circle intersections for this row (for stroke)
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Calculate inner circle intersections if needed
        let innerLeftX = -1;
        let innerRightX = -1;
        
        if (innerRadius > 0 && dySquared <= innerRadiusSquared) {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
        }
        
        // Calculate fill circle intersections if this row passes through the fill area
        const fillDistSquared = fillRadiusSquared - dySquared;
        let leftFillX = -1;
        let rightFillX = -1;
        let fillLength = 0;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
          rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
          fillLength = rightFillX - leftFillX + 1;
        }
        
        // Collect stroke segments
        let leftStrokeX = -1;
        let leftStrokeLength = 0;
        let rightStrokeX = -1;
        let rightStrokeLength = 0;
        
        if (innerRadius < 0 || dySquared > innerRadiusSquared) {
          // No inner circle intersection - collect the entire stroke span
          leftStrokeX = outerLeftX;
          leftStrokeLength = outerRightX - outerLeftX + 1;
          // No right stroke in this case
        } 
        else {
          // Intersects both inner and outer circles - collect two stroke spans
          
          // Left segment of stroke (from outer left to inner left)
          leftStrokeX = outerLeftX;
          leftStrokeLength = innerLeftX - outerLeftX + 1;
          
          // Right segment of stroke (from inner right to outer right)
          rightStrokeX = innerRightX;
          rightStrokeLength = outerRightX - innerRightX + 1;
        }
        
        // Add entry to combined runs array: [xFill, fillLen, xStroke1, stroke1Len, xStroke2, stroke2Len]
        // If a segment doesn't exist, use -1 for both x and length
        combinedRuns.push(
          fillLength > 0 ? leftFillX : -1,
          fillLength > 0 ? fillLength : -1,
          leftStrokeLength > 0 ? leftStrokeX : -1,
          leftStrokeLength > 0 ? leftStrokeLength : -1,
          rightStrokeLength > 0 ? rightStrokeX : -1,
          rightStrokeLength > 0 ? rightStrokeLength : -1
        );
      }
      
      // Render all runs in a single combined batch operation
      if (combinedRuns.length > 0) {
        this.pixelRenderer.setPixelFillAndStrokeRuns(minY, combinedRuns, 
          fillR, fillG, fillB, fillA, 
          strokeR, strokeG, strokeB, strokeA);
      }
    }
  }

  /**
   * Optimized method for drawing a circle with 1px opaque stroke and no fill using Bresenham's algorithm.
   * If the original radius has a fractional part of exactly 0.5, the top half is shifted
   * down 1px and the left half is shifted right 1px relative to the standard rounded rendering.
   * setPixel logic is inlined for maximum performance with fully opaque colors.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of stroke color (0-255)
   * @param {Number} g - Green component of stroke color (0-255)
   * @param {Number} b - Blue component of stroke color (0-255)
   */
  draw1PxStrokeFullCircleBresenhamOpaque(centerX, centerY, radius, r, g, b) {
    const renderer = this.pixelRenderer;

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    const frameBuffer32 = renderer.frameBufferUint32View;
    const context = renderer.context;
    const clippingMask = context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate the packed 32-bit color (assuming ABGR format in memory for little-endian)
    // Format is typically RGBA in canvas, but ArrayBuffer/DataView are little-endian
    // Check system endianness if needed, but this order (ABGR) is common for canvas ImageData
    const packedColor = (255 << 24) | (b << 16) | (g << 8) | r;

    // --- Radius and Center Calculation ---
    const originalRadius = radius;
    const cX = Math.floor(centerX);
    const cY = Math.floor(centerY);
    const intRadius = Math.floor(originalRadius);

    if (intRadius < 0) return; // Cannot draw circle with negative integer radius

    // --- Handle Zero Radius Case (Single Pixel) ---
    if (intRadius === 0) {
      if (originalRadius >= 0) {
        const centerPx = Math.round(centerX);
        const centerPy = Math.round(centerY);
        renderer.setPixel(centerPx, centerPy, r, g, b, 255);
      }
      return; // Done if radius was zero
    }

    // --- Determine Offsets for .5 Radius Case ---
    let xOffset = 0;
    let yOffset = 0;
    if (originalRadius > 0 && (originalRadius * 2) % 2 === 1) {
      xOffset = 1;
      yOffset = 1;
    }

    // Skip if integer bounding box is completely outside canvas bounds (loose check)
    const minX = cX - intRadius - xOffset;
    const maxX = cX + intRadius;
    const minY = cY - intRadius - yOffset;
    const maxY = cY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Bresenham Initialization ---
    let x = 0;
    let y = intRadius;
    let d = 3 - 2 * intRadius;

    // Draw directly, no Set needed for opaque path
    while (x <= y) {
      // Calculate all 8 potential pixel coordinates
      const p1x = cX + x; const p1y = cY + y;
      const p2x = cX + y; const p2y = cY + x;
      const p3x = cX + y; const p3y = cY - x - yOffset;
      const p4x = cX + x; const p4y = cY - y - yOffset;
      const p5x = cX - x - xOffset; const p5y = cY - y - yOffset;
      const p6x = cX - y - xOffset; const p6y = cY - x - yOffset;
      const p7x = cX - y - xOffset; const p7y = cY + x;
      const p8x = cX - x - xOffset; const p8y = cY + y;

      // Plot 8 points directly with bounds and clipping checks
      // Point 1
      // 4th octant - lower-right quadrant
      if (p1x >= 0 && p1x < width && p1y >= 0 && p1y < height) {
        const pixelPos = p1y * width + p1x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 2 (Check needed for x == y)
      // 3rd octant - lower-right quadrant
      if (p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) {
        if (x !== y) { // Avoid plotting diagonal twice when x == y
          const pixelPos = p2y * width + p2x;
          if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
            frameBuffer32[pixelPos] = packedColor;
          }
        }
      }
      // Point 3
      // 2nd octant - upper-right quadrant
      if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) {
        const pixelPos = p3y * width + p3x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 4
      // 1st octant - upper-right quadrant
      if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) {
        const pixelPos = p4y * width + p4x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 5
      // 8th octant - upper-left quadrant
      if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) {
        const pixelPos = p5y * width + p5x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 6 (Check needed for x == y)
      // 7th octant - upper-left quadrant
      if (p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) {
        if (x !== y) { // Avoid plotting diagonal twice when x == y
          const pixelPos = p6y * width + p6x;
          if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
            frameBuffer32[pixelPos] = packedColor;
          }
        }
      }
      // Point 7
      // 6th octant - lower-left quadrant
      if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) {
        const pixelPos = p7y * width + p7x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 8
      // 5th octant - lower-left quadrant
      if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) {
        const pixelPos = p8y * width + p8x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }

      // Update Bresenham algorithm state
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--;
      }
      x++;
    }
  }

  /**
   * Optimized method for drawing a circle with 1px semi-transparent stroke and no fill using Bresenham's algorithm.
   * Uses a Set for uniqueness checking and performs alpha blending for each pixel.
   * If the original radius has a fractional part of exactly 0.5, the top half is shifted
   * down 1px and the left half is shifted right 1px relative to the standard rounded rendering.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of stroke color (0-255)
   * @param {Number} g - Green component of stroke color (0-255)
   * @param {Number} b - Blue component of stroke color (0-255)
   * @param {Number} a - Alpha component of stroke color (0-255)
   */
  draw1PxStrokeFullCircleBresenhamAlpha(centerX, centerY, radius, r, g, b, a) {
    const renderer = this.pixelRenderer;

    const globalAlpha = renderer.context.globalAlpha;
    if (a === 0 || globalAlpha <= 0) return; // Fully transparent

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    const context = renderer.context;
    const clippingMask = context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate alpha blending values
    const incomingAlpha = (a / 255) * globalAlpha;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    if (incomingAlpha <= 0) return; // Effective alpha is zero

    // --- Radius and Center Calculation ---
    const originalRadius = radius;
    const cX = Math.floor(centerX);
    const cY = Math.floor(centerY);
    const intRadius = Math.floor(originalRadius);

    if (intRadius < 0) return; // Cannot draw circle with negative integer radius

    // --- Handle Zero Radius Case (Single Pixel) ---
    if (intRadius === 0) {
      if (originalRadius >= 0) {
        const centerPx = Math.round(centerX);
        const centerPy = Math.round(centerY);
        renderer.setPixel(centerPx, centerPy, r, g, b, a);
      }
      return; // Done if radius was zero
    }

    // --- Determine Offsets for .5 Radius Case ---
    let xOffset = 0;
    let yOffset = 0;
    if (originalRadius > 0 && (originalRadius * 2) % 2 === 1) {
      xOffset = 1;
      yOffset = 1;
    }

    // Skip if integer bounding box is completely outside canvas bounds (loose check)
    const minX = cX - intRadius - xOffset;
    const maxX = cX + intRadius;
    const minY = cY - intRadius - yOffset;
    const maxY = cY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Bresenham Initialization ---
    let x = 0;
    let y = intRadius;
    let d = 3 - 2 * intRadius;

    // --- Use Set for uniqueness in semi-transparent path ---
    const uniquePixelKeys = new Set();

    while (x <= y) {
      // Calculate all 8 potential pixel coordinates
      const p1x = cX + x; const p1y = cY + y;
      const p2x = cX + y; const p2y = cY + x;
      const p3x = cX + y; const p3y = cY - x - yOffset;
      const p4x = cX + x; const p4y = cY - y - yOffset;
      const p5x = cX - x - xOffset; const p5y = cY - y - yOffset;
      const p6x = cX - y - xOffset; const p6y = cY - x - yOffset;
      const p7x = cX - y - xOffset; const p7y = cY + x;
      const p8x = cX - x - xOffset; const p8y = cY + y;

      // Add unique pixel keys, checking bounds inline
      if (p1x >= 0 && p1x < width && p1y >= 0 && p1y < height) uniquePixelKeys.add(p1y * width + p1x);
      if (p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) uniquePixelKeys.add(p2y * width + p2x);
      if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) uniquePixelKeys.add(p3y * width + p3x);
      if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) uniquePixelKeys.add(p4y * width + p4x);
      if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) uniquePixelKeys.add(p5y * width + p5x);
      if (p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) uniquePixelKeys.add(p6y * width + p6x);
      if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) uniquePixelKeys.add(p7y * width + p7x);
      if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) uniquePixelKeys.add(p8y * width + p8x);

      // Update Bresenham algorithm state
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--;
      }
      x++;
    }

    // Render pixels from the Set using blending
    if (uniquePixelKeys.size > 0) {
      for (const pixelPos of uniquePixelKeys) { // faster than a forEach
        const index = pixelPos * 4;

        // Clipping check
        let clipped = false;
        if (clippingMask) {
          const clippingMaskByteIndex = pixelPos >> 3;
          const bitIndex = pixelPos & 7;
          if (clippingMask[clippingMaskByteIndex] === 0 || (clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
            clipped = true;
          }
        }

        if (!clipped) {
          // Standard path with alpha blending
          const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
          const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
          const newAlpha = incomingAlpha + oldAlphaScaled;

          if (newAlpha > 0) { // Avoid division by zero/negative
            const blendFactor = 1 / newAlpha;
            frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
          }
        }
      }
    }
  }

  /**
   * Generates relative horizontal extents for a circle.
   * This data describes the shape of the circle relative to its integer center,
   * suitable for scanline filling.
   * @param {Number} radius - Radius of the circle (float)
   * @returns {Object|null} An object { relativeExtents, intRadius, xOffset, yOffset } or null for invalid radius.
   *          relativeExtents: Array where index is rel_y and value is max_rel_x.
   *          intRadius: Integer part of the radius.
   *          xOffset, yOffset: Offsets for handling radius with fractional part 0.5.
   */
  _generateRelativeHorizontalExtentsBresenham(radius) {
    const originalRadius = radius;
    const intRadius = Math.floor(originalRadius);

    if (intRadius < 0) return null; // Invalid radius

    // Determine offsets for .5 radius case (affects how filler uses the extents)
    let xOffset = 0;
    let yOffset = 0;
    // Check if fractional part is exactly 0.5
    if (originalRadius > 0 && (originalRadius * 2) % 2 === 1) {
      xOffset = 1;
      yOffset = 1;
    }

    // Handle zero radius separately (returns valid structure for consistency)
    if (intRadius === 0) {
        // Although no Bresenham runs, provide the structure expected by the filler
        return { relativeExtents: [0], intRadius: 0, xOffset: xOffset, yOffset: yOffset };
    }

    // --- Bresenham Initialization for Extents ---
    const relativeExtents = new Array(intRadius + 1).fill(0);
    let x = 0;
    let y = intRadius;
    let d = 3 - 2 * intRadius;

    // --- Bresenham Loop to Calculate Extents ---
    while (x <= y) {
      // Update extents based on the current (x, y) point and its symmetry
      // For rel_y = y, the horizontal extent is at least x
      relativeExtents[y] = Math.max(relativeExtents[y], x);
      // For rel_y = x, the horizontal extent is at least y
      relativeExtents[x] = Math.max(relativeExtents[x], y);

      // Update Bresenham algorithm state
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--; // Move closer to the horizontal axis
      }
      x++; // Move further from the vertical axis
    }

    return { relativeExtents, intRadius, xOffset, yOffset };
  }

  /**
   * Draws a filled opaque circle using scanline conversion based on Bresenham-derived extents.
   * Handles fractional radius of 0.5 by shifting pixels as described in the original function.
   * Pixel setting logic is inlined for performance with fully opaque colors.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of fill color (0-255)
   * @param {Number} g - Green component of fill color (0-255)
   * @param {Number} b - Blue component of fill color (0-255)
   */
  drawOpaqueFillFullCircleBresenham(centerX, centerY, radius, r, g, b) {
    const renderer = this.pixelRenderer;

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    const frameBuffer32 = renderer.frameBufferUint32View;
    const context = renderer.context; // Assuming context holds clippingMask if needed
    const clippingMask = context && context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate the packed 32-bit color (assuming ABGR format in memory for little-endian)
    // Format is typically RGBA in canvas, but ArrayBuffer/DataView are little-endian
    // Check system endianness if needed, but this order (ABGR) is common for canvas ImageData
    const packedColor = (255 << 24) | (b << 16) | (g << 8) | r;

    // --- Generate Relative Extents ---
    const extentData = this._generateRelativeHorizontalExtentsBresenham(radius);
    if (!extentData) return; // Invalid radius handled by generator

    const { relativeExtents, intRadius, xOffset, yOffset } = extentData;

    // --- Handle Zero Radius Case (Single Pixel) ---
    // Note: generator returns intRadius=0 even for 0 <= radius < 1
    if (intRadius === 0 && radius >= 0) {
        const centerPx = Math.round(centerX); // Use Math.round for single pixel placement
        const centerPy = Math.round(centerY);

        // Check bounds for the single pixel
        if (centerPx >= 0 && centerPx < width && centerPy >= 0 && centerPy < height) {
            const pixelPos = centerPy * width + centerPx;
            // Check clipping mask for the single pixel
             if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (pixelPos & 7))) !== 0))) {
                // Use the 32-bit write
                frameBuffer32[pixelPos] = packedColor;
            }
        }
        return; // Done if radius effectively zero
    }
    // Now we know intRadius > 0

    // --- Calculate Absolute Center and Bounds ---
    // ADJUSTMENT: Use center relative to pixel centers for scanline calculation
    const adjCenterX = Math.floor(centerX - 0.5);
    const adjCenterY = Math.floor(centerY - 0.5);
    // const cX = Math.floor(centerX); // Original center (keep for reference/debugging if needed)
    // const cY = Math.floor(centerY); // Original center

    // Optional: Loose bounding box check (can save loop iterations)
    // Use adjusted center for bounding box check for consistency
    const maxExt = relativeExtents[0]; // Widest extent is at rel_y = 0
    const minX = adjCenterX - maxExt - xOffset;
    const maxX = adjCenterX + maxExt;
    const minY = adjCenterY - intRadius - yOffset;
    const maxY = adjCenterY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Scanline Filling Loop ---
    // Hoist clipping check outside the main loop
    if (!clippingMask) {
      // --- Version WITHOUT Clipping Check ---
      for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
        const max_rel_x = relativeExtents[rel_y];
        // Use adjusted center and offsets, with +1 correction for min boundaries
        const abs_x_min = adjCenterX - max_rel_x - xOffset + 1; // Apply +1 correction
        const abs_x_max = adjCenterX + max_rel_x;
        const abs_y_bottom = adjCenterY + rel_y;
        const abs_y_top = adjCenterY - rel_y - yOffset + 1; // Apply +1 correction

        // --- Draw Bottom Scanline (No Clip) ---
        if (abs_y_bottom >= 0 && abs_y_bottom < height) {
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          let currentPixelPos = abs_y_bottom * width + startX;
          // Remove currentIndex, use currentPixelPos directly with frameBuffer32
          const endPixelPos = abs_y_bottom * width + endX;
          while (currentPixelPos <= endPixelPos) {
             frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
             // Remove currentIndex update
             currentPixelPos++;
          }
        }

        // --- Draw Top Scanline (No Clip) ---
        // Skip if rel_y is 0 OR if it's the specific case (rel_y=1, yOffset=0) that would redraw the middle line.
        const drawTopNoClip = rel_y > 0 && !(rel_y === 1 && yOffset === 0) && abs_y_top >= 0 && abs_y_top < height;
        if (drawTopNoClip) {
          // Use adjusted center and offsets
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          let currentPixelPos = abs_y_top * width + startX;
          // Remove currentIndex
          const endPixelPos = abs_y_top * width + endX;
          while (currentPixelPos <= endPixelPos) {
             frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
             // Remove currentIndex update
             currentPixelPos++;
          }
        }
      }
    } else {
      // --- Version WITH Clipping Check (Optimized) ---
      for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
        const max_rel_x = relativeExtents[rel_y];
        // Use adjusted center and offsets, with +1 correction for min boundaries
        const abs_x_min = adjCenterX - max_rel_x - xOffset + 1; // Apply +1 correction
        const abs_x_max = adjCenterX + max_rel_x;
        const abs_y_bottom = adjCenterY + rel_y;
        const abs_y_top = adjCenterY - rel_y - yOffset + 1; // Apply +1 correction

        // --- Draw Bottom Scanline (Optimized Clip Check) ---
        if (abs_y_bottom >= 0 && abs_y_bottom < height) {
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          const startPixelPos = abs_y_bottom * width + startX;
          const endPixelPos = abs_y_bottom * width + endX;
          let currentPixelPos = startPixelPos;
          // Remove currentIndex

          while (currentPixelPos <= endPixelPos) {
            const byteIndex = currentPixelPos >> 3;
            const bitInByte = currentPixelPos & 7;

            // Can we check a full byte?
            if (bitInByte === 0 && currentPixelPos + 7 <= endPixelPos) {
              const maskByte = clippingMask[byteIndex];
              if (maskByte === 0xFF) { // Fully opaque byte
                // Draw 8 pixels directly using 32-bit writes
                const loopEndPos = currentPixelPos + 7;
                while (currentPixelPos <= loopEndPos) {
                    frameBuffer32[currentPixelPos] = packedColor;
                    currentPixelPos++;
                }
                // Remove currentIndex update
                continue; // Next iteration of while loop
              } else if (maskByte === 0x00) { // Fully transparent byte
                // Skip 8 pixels
                currentPixelPos += 8;
                // Remove currentIndex update
                continue; // Next iteration of while loop
              } else {
                // Partial byte - fall through to per-pixel check below
              }
            }

            // Per-pixel check (for partial bytes or end of span)
            const bitMask = 1 << (7 - bitInByte);
            if ((clippingMask[byteIndex] & bitMask) !== 0) {
              frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
            }
            // Remove currentIndex update
            currentPixelPos++;
          }
        }

        // --- Draw Top Scanline (Optimized Clip Check) ---
        // Skip if rel_y is 0 OR if it's the specific case (rel_y=1, yOffset=0) that would redraw the middle line.
        const drawTopClip = rel_y > 0 && !(rel_y === 1 && yOffset === 0) && abs_y_top >= 0 && abs_y_top < height;
        if (drawTopClip) {
            // Use adjusted center and offsets
            const startX = Math.max(0, abs_x_min);
            const endX = Math.min(width - 1, abs_x_max);
            const startPixelPos = abs_y_top * width + startX;
            const endPixelPos = abs_y_top * width + endX;
            let currentPixelPos = startPixelPos;
            // Remove currentIndex

            while (currentPixelPos <= endPixelPos) {
              const byteIndex = currentPixelPos >> 3;
              const bitInByte = currentPixelPos & 7;

              // Can we check a full byte?
              if (bitInByte === 0 && currentPixelPos + 7 <= endPixelPos) {
                const maskByte = clippingMask[byteIndex];
                 if (maskByte === 0xFF) { // Fully opaque byte
                  const loopEndPos = currentPixelPos + 7;
                  while(currentPixelPos <= loopEndPos) {
                    frameBuffer32[currentPixelPos] = packedColor;
                    currentPixelPos++;
                  }
                  // Remove currentIndex update
                  continue;
                } else if (maskByte === 0x00) { // Fully transparent byte
                  currentPixelPos += 8;
                  // Remove currentIndex update
                  continue;
                } else {
                  // Partial byte - fall through
                }
              }

              // Per-pixel check
              const bitMask = 1 << (7 - bitInByte);
              if ((clippingMask[byteIndex] & bitMask) !== 0) {
                frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
              }
              // Remove currentIndex update
              currentPixelPos++;
            }
        }
      }
    } // End of if (!clippingMask) / else
  }

  /**
   * This is the same as the drawOpaqueFillFullCircleBresenham method, but with alpha blending.
   * Draws a filled semi-transparent circle using scanline conversion based on Bresenham-derived extents.
   * Handles fractional radius of 0.5 by shifting pixels as described in the original function.
   * Uses alpha blending for each pixel.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of fill color (0-255)
   * @param {Number} g - Green component of fill color (0-255)
   * @param {Number} b - Blue component of fill color (0-255)
   * @param {Number} a - Alpha component of fill color (0-255)
   */
  drawSemiTransparentFillFullCircleBresenham(centerX, centerY, radius, r, g, b, a) {
    const renderer = this.pixelRenderer;

    const globalAlpha = renderer.context.globalAlpha;
    if (a === 0 || globalAlpha <= 0) return; // Fully transparent

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    // const frameBuffer32 = renderer.frameBufferUint32View; // Not needed for blending
    const context = renderer.context; // Assuming context holds clippingMask if needed
    const clippingMask = context && context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate alpha blending values
    const incomingAlpha = (a / 255) * globalAlpha;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    if (incomingAlpha <= 0) return; // Effective alpha is zero

    // Remove packedColor calculation - not used for alpha blending
    // const packedColor = (255 << 24) | (b << 16) | (g << 8) | r;

    // --- Generate Relative Extents ---
    const extentData = this._generateRelativeHorizontalExtentsBresenham(radius);
    if (!extentData) return; // Invalid radius handled by generator

    const { relativeExtents, intRadius, xOffset, yOffset } = extentData;

    // --- Handle Zero Radius Case (Single Pixel) ---
    // Note: generator returns intRadius=0 even for 0 <= radius < 1
    if (intRadius === 0 && radius >= 0) {
        const centerPx = Math.round(centerX); // Use Math.round for single pixel placement
        const centerPy = Math.round(centerY);

        // Use setPixel which handles bounds, clipping, and alpha blending correctly
        renderer.setPixel(centerPx, centerPy, r, g, b, a);
        return; // Done if radius effectively zero
    }
    // Now we know intRadius > 0

    // --- Calculate Absolute Center and Bounds ---
    // ADJUSTMENT: Use center relative to pixel centers for scanline calculation
    const adjCenterX = Math.floor(centerX - 0.5);
    const adjCenterY = Math.floor(centerY - 0.5);
    // const cX = Math.floor(centerX); // Original center (keep for reference/debugging if needed)
    // const cY = Math.floor(centerY); // Original center

    // Optional: Loose bounding box check (can save loop iterations)
    // Use adjusted center for bounding box check for consistency
    const maxExt = relativeExtents[0]; // Widest extent is at rel_y = 0
    const minX = adjCenterX - maxExt - xOffset;
    const maxX = adjCenterX + maxExt;
    const minY = adjCenterY - intRadius - yOffset;
    const maxY = adjCenterY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Scanline Filling Loop ---
    // Function to perform alpha blending for a single pixel
    const blendPixel = (pixelPos) => {
        const index = pixelPos * 4;
        const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;

        if (newAlpha > 0) { // Avoid division by zero/negative
            const blendFactor = 1 / newAlpha;
            frameBufferUint8ClampedView[index]     = (r * incomingAlpha + frameBufferUint8ClampedView[index]     * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
        }
    };

    if (!clippingMask) {
      // --- Version WITHOUT Clipping Check ---
      for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
        const max_rel_x = relativeExtents[rel_y];
        // Use adjusted center and offsets, with +1 correction for min boundaries
        const abs_x_min = adjCenterX - max_rel_x - xOffset + 1; // Apply +1 correction
        const abs_x_max = adjCenterX + max_rel_x;
        const abs_y_bottom = adjCenterY + rel_y;
        const abs_y_top = adjCenterY - rel_y - yOffset + 1; // Apply +1 correction

        // --- Draw Bottom Scanline (No Clip) ---
        if (abs_y_bottom >= 0 && abs_y_bottom < height) {
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          let currentPixelPos = abs_y_bottom * width + startX;
          const endPixelPos = abs_y_bottom * width + endX;
          while (currentPixelPos <= endPixelPos) {
             blendPixel(currentPixelPos); // Use alpha blending
             currentPixelPos++;
          }
        }

        // --- Draw Top Scanline (No Clip) ---
        // Skip if rel_y is 0 OR if it's the specific case (rel_y=1, yOffset=0) that would redraw the middle line.
        const drawTopNoClip = rel_y > 0 && !(rel_y === 1 && yOffset === 0) && abs_y_top >= 0 && abs_y_top < height;
        if (drawTopNoClip) {
          // Use adjusted center and offsets
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          let currentPixelPos = abs_y_top * width + startX;
          const endPixelPos = abs_y_top * width + endX;
          while (currentPixelPos <= endPixelPos) {
             blendPixel(currentPixelPos); // Use alpha blending
             currentPixelPos++;
          }
        }
      }
    } else {
      // --- Version WITH Clipping Check (Optimized) ---
      for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
        const max_rel_x = relativeExtents[rel_y];
        // Use adjusted center and offsets, with +1 correction for min boundaries
        const abs_x_min = adjCenterX - max_rel_x - xOffset + 1; // Apply +1 correction
        const abs_x_max = adjCenterX + max_rel_x;
        const abs_y_bottom = adjCenterY + rel_y;
        const abs_y_top = adjCenterY - rel_y - yOffset + 1; // Apply +1 correction

        // --- Draw Bottom Scanline (Optimized Clip Check) ---
        if (abs_y_bottom >= 0 && abs_y_bottom < height) {
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          const startPixelPos = abs_y_bottom * width + startX;
          const endPixelPos = abs_y_bottom * width + endX;
          let currentPixelPos = startPixelPos;

          while (currentPixelPos <= endPixelPos) {
            const byteIndex = currentPixelPos >> 3;
            const bitInByte = currentPixelPos & 7;
            const bitMask = 1 << (7 - bitInByte);

            // Can we check a full byte? (Only optimize skip for fully transparent byte)
            if (bitInByte === 0 && currentPixelPos + 7 <= endPixelPos) {
              const maskByte = clippingMask[byteIndex];
               if (maskByte === 0x00) { // Fully transparent byte
                // Skip 8 pixels
                currentPixelPos += 8;
                continue; // Next iteration of while loop
              } else {
                // Partial byte or opaque byte - fall through to per-pixel check below
              }
            }

            // Per-pixel check (for partial bytes or end of span or opaque bytes)
            if ((clippingMask[byteIndex] & bitMask) !== 0) {
              blendPixel(currentPixelPos); // Use alpha blending
            }
            currentPixelPos++;
          }
        }

        // --- Draw Top Scanline (Optimized Clip Check) ---
        // Skip if rel_y is 0 OR if it's the specific case (rel_y=1, yOffset=0) that would redraw the middle line.
        const drawTopClip = rel_y > 0 && !(rel_y === 1 && yOffset === 0) && abs_y_top >= 0 && abs_y_top < height;
        if (drawTopClip) {
            // Use adjusted center and offsets
            const startX = Math.max(0, abs_x_min);
            const endX = Math.min(width - 1, abs_x_max);
            const startPixelPos = abs_y_top * width + startX;
            const endPixelPos = abs_y_top * width + endX;
            let currentPixelPos = startPixelPos;
            // Remove currentIndex

            while (currentPixelPos <= endPixelPos) {
              const byteIndex = currentPixelPos >> 3;
              const bitInByte = currentPixelPos & 7;
              const bitMask = 1 << (7 - bitInByte);

              // Can we check a full byte? (Optimize skip only)
              if (bitInByte === 0 && currentPixelPos + 7 <= endPixelPos) {
                const maskByte = clippingMask[byteIndex];
                 if (maskByte === 0x00) { // Fully transparent byte
                  currentPixelPos += 8;
                  continue;
                } else {
                  // Partial or opaque byte - fall through
                }
              }

              // Per-pixel check
              if ((clippingMask[byteIndex] & bitMask) !== 0) {
                blendPixel(currentPixelPos); // Use alpha blending
              }
              currentPixelPos++;
            }
        }
      }
    } // End of if (!clippingMask) / else
  }

  // TODO 1: can we re-use an existing circle filling routine for this?
  // TODO 2: this in the end causes very many calls to clipPixel, which seems slow,
  //         can we bake that routine?
  _clipCircleShape(shape) {
    const { center, radius } = shape;

    const renderer = this.pixelRenderer;

    // --- Generate Relative Extents ---
    const extentData = this._generateRelativeHorizontalExtentsBresenham(radius);
    if (!extentData) return; // Invalid radius handled by generator

    const { relativeExtents, intRadius, xOffset, yOffset } = extentData;

    // --- Handle Zero Radius Case (Single Pixel) ---
    if (intRadius === 0 && radius >= 0) {
        const centerPx = Math.round(center.x);
        const centerPy = Math.round(center.y);
        // Call clipPixel for the single pixel
        renderer.clipPixel(centerPx, centerPy);
        return; // Done if radius effectively zero
    }
    // Now we know intRadius > 0

    // --- Calculate Absolute Center ---
    const adjCenterX = Math.floor(center.x - 0.5);
    const adjCenterY = Math.floor(center.y - 0.5);
    
    // --- Scanline Clipping Loop ---
    for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
      const max_rel_x = relativeExtents[rel_y];
      const abs_x_min = adjCenterX - max_rel_x - xOffset + 1;
      const abs_x_max = adjCenterX + max_rel_x;
      const abs_y_bottom = adjCenterY + rel_y;
      const abs_y_top = adjCenterY - rel_y - yOffset + 1;

      // --- Clip Bottom Scanline ---
      if (abs_y_bottom >= 0 && abs_y_bottom < renderer.height) {
        const startX = Math.max(0, abs_x_min);
        const endX = Math.min(renderer.width - 1, abs_x_max);
        for (let x = startX; x <= endX; x++) {
          renderer.clipPixel(x, abs_y_bottom);
        }
      }

      // --- Clip Top Scanline ---
      const drawTop = rel_y > 0 && !(rel_y === 1 && yOffset === 0) && abs_y_top >= 0 && abs_y_top < renderer.height;
      if (drawTop) {
        const startX = Math.max(0, abs_x_min);
        const endX = Math.min(renderer.width - 1, abs_x_max);
        for (let x = startX; x <= endX; x++) {
          renderer.clipPixel(x, abs_y_top);
        }
      }
    }
  }

}class SWRendererLine {
  constructor(pixelRenderer) {
    this.pixelRenderer = pixelRenderer;
    
    // Pre-allocated arrays for the polygon scan algorithm
    this._corners = [
      { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }
    ];
    this._edges = [
      { p1: this._corners[0], p2: this._corners[1], invDeltaY: 0, deltaX: 0 },
      { p1: this._corners[1], p2: this._corners[2], invDeltaY: 0, deltaX: 0 },
      { p1: this._corners[2], p2: this._corners[3], invDeltaY: 0, deltaX: 0 },
      { p1: this._corners[3], p2: this._corners[0], invDeltaY: 0, deltaX: 0 }
    ];
    this._intersections = new Array(8); // Pre-allocate space for intersections
    this._pixelRuns = []; // This will grow as needed
  }

  drawLine(shape) {
    const {
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: strokeWidth,
      color: { r: strokeR, g: strokeG, b: strokeB, a: strokeA }
    } = shape;

    // Handle the thick line case
    if (strokeWidth !== 1) {
      this.drawLineThick(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA);
      return;
    }
    
    // 1px line path follows
    
    // Tweaks to make the sw render match more closely the canvas render.
    // -----------------------------------------------------------------
    // For an intuition about why this works, imagine a thin vertical line.
    // If the start point is at x1 = 0.5, y1 = 0.5, then it means that
    // in canvas we mean to draw it crisply (because the path line is centered in the
    // middle of the pixel and extends 0.5 pixels in each direction to perfectly cover
    // one column). In SW, we need to draw that case at x = 0, y = 0.
    // If the start point is at x1 = 1, y1 = 1, then it means that in canvas we
    // mean to draw it "blurry" (because the path line is centered in between
    // pixels and hence the line extends 0.5 pixels in each direction to cover half of two columns).
    // In SW, we still draw it crisply (this library doesn't support anti-aliasing / sub-pixel
    // rendering), so we have to pick one of the half-columns to be drawn fully.
    // We choose the right one, but in general the floor() means that
    // we pick the one that is closer to the center of the path (which should be the
    // darker one as it's the most covered by the path).
    let floorX1 = Math.floor(x1);
    let floorY1 = Math.floor(y1);
    let floorX2 = Math.floor(x2);
    let floorY2 = Math.floor(y2);
    
    // MOREOVER, in Canvas you reason in terms of grid lines, so
    // in case of a vertical line, where you want the two renders to be
    // identical, for example three grid lines actually cover the span
    // of 2 pixels.
    // However, in SW you reason in terms of pixels, so you can't cover
    // "three" as in Canvas, rather "two" because you actually want to
    // cover two pixels, not three.
    // Hence, in a nutshell, you have to tweak the received parameters
    // (which work in canvas) by shortening the line by 1 pixel if it's vertical.
    //
    // Note how always decreasing the bottom y coordinate is always correct:
    //
    //          Case y2 > y1            #          Case y1 > y2
    //       e.g. y1 = 1, y2 = 3        #       e.g. y1 = 3, y2 = 1
    //      (drawing going down)        #       (drawing going up)
    //  ------------------------------- # ---------------------------------
    //  Before adjustment:              #   Before adjustment:
    //    0                             #     0
    //    1 ● ↓                         #     1 ●
    //    2 ● ↓                         #     2 ● ↑
    //    3 ●                           #     3 ● ↑
    //  ------------------------------- # ---------------------------------
    //  After adjustment (i.e. y2--):   #   After adjustment (i.e. y1--):
    //    0                             #     0
    //    1 ● ↓                         #     1 ●
    //    2 ●                           #     2 ● ↑
    //    3                             #     3
    //
    // Note also that this "off by one" difference is always present also
    // in oblique lines, however a) you don't expect the renders to be
    // identical in those cases as sw render doesn't support anti-aliasing / sub-pixel
    // rendering anyways and b) the difference is barely noticeable in those cases.
    if (floorX1 === floorX2) floorY2 > floorY1 ? floorY2-- : floorY1--;
    if (floorY1 === floorY2) floorX2 > floorX1 ? floorX2-- : floorX1--;

    // Skip if fully transparent
    const globalAlpha = this.pixelRenderer.context.globalAlpha;
    if ((strokeA === 0) || (globalAlpha <= 0)) return;

    // Calculate absolute differences for orientation detection
    const dx = Math.abs(floorX2 - floorX1);
    const dy = Math.abs(floorY2 - floorY1);

    // Dispatch to specialized renderers based on line orientation
    if (dx === 0) {
      // Vertical line
      return this._drawLine1px_vertical(floorX1, floorY1, floorY2, strokeR, strokeG, strokeB, strokeA);
    } else if (dy === 0) {
      // Horizontal line
      return this._drawLine1px_horizontal(floorX1, floorX2, floorY1, strokeR, strokeG, strokeB, strokeA);
    } else if (dx === dy) {
      // Perfect 45-degree line
      return this._drawLine1px_45degrees(floorX1, floorY1, floorX2, floorY2, strokeR, strokeG, strokeB, strokeA);
    } else {
      // All other lines
      return this._drawLine1px_genericOrientations(floorX1, floorY1, floorX2, floorY2, dx, dy, strokeR, strokeG, strokeB, strokeA);
    }
  }

  // public function to draw a 1px line with orientation dispatch
  drawLine1px(x1, y1, x2, y2, r, g, b, a) {
    // first floor the values
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);
    x2 = Math.floor(x2);
    y2 = Math.floor(y2);

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    if (dx === 0) {
      return this._drawLine1px_vertical(x1, y1, y2, r, g, b, a);
    } else if (dy === 0) {
      return this._drawLine1px_horizontal(x1, x2, y1, r, g, b, a);
    } else if (dx === dy) {
      return this._drawLine1px_45degrees(x1, y1, x2, y2, r, g, b, a);
    } else {
      return this._drawLine1px_genericOrientations(x1, y1, x2, y2, dx, dy, r, g, b, a);
    }
  }

  _drawLine1px_horizontal(x1, x2, y, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBufferUint8ClampedView = this.pixelRenderer.frameBufferUint8ClampedView;
    const frameBufferUint32View = this.pixelRenderer.frameBufferUint32View;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Early bounds check
    if (y < 0 || y >= height) return;
    
    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    if (isOpaque) {
      packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Ensure x1 < x2 for simpler logic
    if (x1 > x2) {
      let temp = x1;
      x1 = x2;
      x2 = temp;
    }
    
    // Clip to canvas boundaries
    if (x1 < 0) x1 = 0;
    if (x2 >= width) x2 = width - 1;
    if (x1 > x2) return;
    
    // Calculate base index for the row
    const baseIndex = (y * width + x1) * 4;
    
    // Draw the horizontal line
    for (let x = x1; x <= x2; x++) {
      const index = baseIndex + (x - x1) * 4;
      const pixelPos = y * width + x;
      
      // Check clipping if needed
      if (hasClipping) {
        const clippingMaskByteIndex = pixelPos >> 3;
        const bitIndex = pixelPos & 7;
        
        if (clippingMask[clippingMaskByteIndex] === 0) continue;
        if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) continue;
      }
      
      if (isOpaque) {
        // Fast path for opaque pixels - Direct 32-bit write
        frameBufferUint32View[pixelPos] = packedColor;
      } else {
        // Alpha blending
        const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;
        
        if (newAlpha <= 0) continue;
        
        const blendFactor = 1 / newAlpha;
        frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
        frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
        frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
        frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
      }
    }
  }

  _drawLine1px_vertical(x, y1, y2, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBufferUint8ClampedView = this.pixelRenderer.frameBufferUint8ClampedView;
    const frameBufferUint32View = this.pixelRenderer.frameBufferUint32View;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Early bounds check
    if (x < 0 || x >= width) return;
    
    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    if (isOpaque) {
      packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Ensure y1 < y2 for simpler logic
    if (y1 > y2) {
      let temp = y1;
      y1 = y2;
      y2 = temp;
    }
    
    // Clip to canvas boundaries
    if (y1 < 0) y1 = 0;
    if (y2 >= height) y2 = height - 1;
    if (y1 > y2) return;
    
    // Draw the vertical line
    for (let y = y1; y <= y2; y++) {
      const index = (y * width + x) * 4;
      const pixelPos = y * width + x;
      
      // Check clipping if needed
      if (hasClipping) {
        const clippingMaskByteIndex = pixelPos >> 3;
        const bitIndex = pixelPos & 7;
        
        if (clippingMask[clippingMaskByteIndex] === 0) continue;
        if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) continue;
      }
      
      if (isOpaque) {
        // Fast path for opaque pixels - Direct 32-bit write
        frameBufferUint32View[pixelPos] = packedColor;
      } else {
        // Alpha blending
        const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;
        
        if (newAlpha <= 0) continue;
        
        const blendFactor = 1 / newAlpha;
        frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
        frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
        frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
        frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
      }
    }
  }

  _drawLine1px_45degrees(x1, y1, x2, y2, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBufferUint8ClampedView = this.pixelRenderer.frameBufferUint8ClampedView;
    const frameBufferUint32View = this.pixelRenderer.frameBufferUint32View;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    if (isOpaque) {
      packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Direction of movement (1 or -1) in each axis
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // Since this is a 45-degree line, we always step diagonally
    // No error tracking needed as with Bresenham algorithm
    let x = x1;
    let y = y1;
    
    // Draw the 45-degree line
    while (true) {
      // Break if we've gone out of bounds entirely
      if (x < 0 && sx < 0) break; // Moving left and already off left edge
      if (x >= width && sx > 0) break; // Moving right and already off right edge
      if (y < 0 && sy < 0) break; // Moving up and already off top edge
      if (y >= height && sy > 0) break; // Moving down and already off bottom edge
      
      // Check if we're in bounds for this pixel
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        const pixelPos = y * width + x;
        
        // Check clipping if needed
        let drawPixel = true;
        
        if (hasClipping) {
          const clippingMaskByteIndex = pixelPos >> 3;
          const bitIndex = pixelPos & 7;
          
          // Skip if clipping mask indicates pixel should be clipped
          if (clippingMaskByteIndex >= clippingMask.length ||
              clippingMask[clippingMaskByteIndex] === 0 || 
              (clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) {
            drawPixel = false;
          }
        }
        
        if (drawPixel) {
          if (isOpaque) {
            // Fast path for opaque pixels - Direct 32-bit write
            frameBufferUint32View[pixelPos] = packedColor;
          } else {
            // Alpha blending
            const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
            const newAlpha = incomingAlpha + oldAlphaScaled;
            
            if (newAlpha > 0) {
              const blendFactor = 1 / newAlpha;
              frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
              frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
              frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
              frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
            }
          }
        }
      }
      
      // Check if we've reached the end point
      if (x === x2 && y === y2) break;
      
      // Move diagonally - for 45-degree lines, we move by 1 in both directions each time
      x += sx;
      y += sy;
    }
  }

  _drawLine1px_genericOrientations(x1, y1, x2, y2, dx, dy, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBufferUint8ClampedView = this.pixelRenderer.frameBufferUint8ClampedView;
    const frameBufferUint32View = this.pixelRenderer.frameBufferUint32View;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    if (isOpaque) {
      packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Direction of movement in each axis
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // Initialize Bresenham algorithm state
    let err = dx - dy;
    
    // We prefer to do bounds checking inside the loop for generic orientations
    // Since they can enter and exit the viewable area multiple times
    while (true) {
      // Check if current pixel is in bounds
      if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height) {
        const index = (y1 * width + x1) * 4;
        const pixelPos = y1 * width + x1;
        
        // Check clipping if needed
        let drawPixel = true;
        
        if (hasClipping) {
          const clippingMaskByteIndex = pixelPos >> 3;
          const bitIndex = pixelPos & 7;
          
          if (clippingMaskByteIndex >= clippingMask.length ||
              clippingMask[clippingMaskByteIndex] === 0 || 
              (clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) {
            drawPixel = false;
          }
        }
        
        if (drawPixel) {
          if (isOpaque) {
            // Fast path for opaque pixels - Direct 32-bit write
            frameBufferUint32View[pixelPos] = packedColor;
          } else {
            // Alpha blending
            const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
            const newAlpha = incomingAlpha + oldAlphaScaled;
            
            if (newAlpha > 0) {
              const blendFactor = 1 / newAlpha;
              frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
              frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
              frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
              frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
            }
          }
        }
      }
      
      // Break after processing the last pixel
      if (x1 === x2 && y1 === y2) break;
      
      // Calculate next pixel position using Bresenham algorithm
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  drawLineThick(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Original algorithm - bounding box with distance check
    //this._drawLineThickBoundingBox(x1, y1, x2, y2, thickness, r, g, b, a);
    
    // Uncomment one of these to use a different algorithm:
    // this._drawLineThickModifiedBresenham(x1, y1, x2, y2, thickness, r, g, b, a);
    // this._drawLineThickDistanceOptimized(x1, y1, x2, y2, thickness, r, g, b, a);
    // this._drawLineThickParallelOffset(x1, y1, x2, y2, thickness, r, g, b, a);
    this._drawLineThickPolygonScan(x1, y1, x2, y2, thickness, r, g, b, a);
  }

  /**
   * Algorithm 1: Original bounding box algorithm
   * Scans a rectangle containing the entire thick line and checks each pixel's distance
   */
  _drawLineThickBoundingBox(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Tweaks to make the sw render more closely match the canvas render.
    // Canvas coordinates are offset by 0.5 pixels, so adjusting here
    x1 -= 0.5;
    y1 -= 0.5;
    x2 -= 0.5;
    y2 -= 0.5;

    // Calculate the line's direction vector and length
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Skip empty lines
    if (length === 0) return;
    
    // Calculate a perpendicular unit vector to the line
    // This vector points 90 degrees to the line direction
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Calculate half the thickness to offset from the line center
    const halfThickness = thickness / 2;
    
    // Calculate the four corners of the rectangle formed by the thick line
    // These are the endpoints offset perpendicular to the line by half thickness
    const corners = [
      [x1 + perpX * halfThickness, y1 + perpY * halfThickness], // Top-left
      [x1 - perpX * halfThickness, y1 - perpY * halfThickness], // Bottom-left
      [x2 + perpX * halfThickness, y2 + perpY * halfThickness], // Top-right
      [x2 - perpX * halfThickness, y2 - perpY * halfThickness]  // Bottom-right
    ];
    
    // Determine the bounding box of the thick line
    // This optimizes rendering by only checking pixels within this box
    const minX = Math.floor(Math.min(...corners.map(c => c[0])));
    const maxX = Math.ceil(Math.max(...corners.map(c => c[0])));
    const minY = Math.floor(Math.min(...corners.map(c => c[1])));
    const maxY = Math.ceil(Math.max(...corners.map(c => c[1])));
    
    // For each pixel in the bounding box, check if it should be colored
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Calculate the vector from the line start to the current pixel
        const px = x - x1;
        const py = y - y1;
        
        // Calculate the projection of pixel position onto the line
        // The dot product tells us how far along the line the closest point is
        const dot = (px * dx + py * dy) / length;
        
        // Calculate the coordinates of the projected point on the line
        const projX = (dx / length) * dot;
        const projY = (dy / length) * dot;
        
        // Calculate the distance from the pixel to its closest point on the line
        const distX = px - projX;
        const distY = py - projY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        // If the pixel is both:
        // 1. Within the line segment (not beyond endpoints)
        // 2. Within the specified thickness from the line
        // Then draw it
        if (dot >= 0 && dot <= length && dist <= halfThickness) {
          this.pixelRenderer.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  /**
   * Algorithm 2: Modified Bresenham algorithm for thick lines
   * Extends the classic Bresenham line algorithm to draw perpendicular segments
   */
  _drawLineThickModifiedBresenham(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    x1 = Math.floor(x1 - 0.5);
    y1 = Math.floor(y1 - 0.5);
    x2 = Math.floor(x2 - 0.5);
    y2 = Math.floor(y2 - 0.5);
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // Calculate perpendicular direction
    let perpX, perpY;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    
    if (lineLength === 0) {
      // Handle zero-length line case (draw a square)
      const halfThick = Math.floor(thickness / 2);
      for (let py = -halfThick; py <= halfThick; py++) {
        for (let px = -halfThick; px <= halfThick; px++) {
          this.pixelRenderer.setPixel(x1 + px, y1 + py, r, g, b, a);
        }
      }
      return;
    }
    
    perpX = -dy / lineLength;
    perpY = dx / lineLength;
    
    // Half thickness for extending in both directions
    const halfThick = thickness / 2;
    
    let err = dx - dy;
    let x = x1;
    let y = y1;
    
    // For each point along the line
    while (true) {
      // Draw perpendicular segment at each point
      this._drawPerpendicularSegment(x, y, perpX, perpY, halfThick, r, g, b, a);
      
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    
    // Draw square caps at endpoints
    const dirX1 = (x2 - x1) / lineLength;
    const dirY1 = (y2 - y1) / lineLength;
    this._drawSquareCap(x1, y1, perpX, perpY, halfThick, -dirX1, -dirY1, r, g, b, a);
    this._drawSquareCap(x2, y2, perpX, perpY, halfThick, dirX1, dirY1, r, g, b, a);
  }
  
  /**
   * Helper method to draw a perpendicular segment at a point
   */
  _drawPerpendicularSegment(x, y, perpX, perpY, halfThick, r, g, b, a) {
    const steps = Math.ceil(halfThick);
    
    // Draw center pixel
    this.pixelRenderer.setPixel(x, y, r, g, b, a);
    
    // Draw pixels along the perpendicular direction
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps * halfThick;
      // Draw in both perpendicular directions
      const px1 = Math.round(x + perpX * ratio);
      const py1 = Math.round(y + perpY * ratio);
      const px2 = Math.round(x - perpX * ratio);
      const py2 = Math.round(y - perpY * ratio);
      
      this.pixelRenderer.setPixel(px1, py1, r, g, b, a);
      this.pixelRenderer.setPixel(px2, py2, r, g, b, a);
    }
  }
  
  /**
   * Draw a square cap at the endpoint of a line
   */
  _drawSquareCap(x, y, perpX, perpY, halfThick, dirX, dirY, r, g, b, a) {
    const steps = Math.ceil(halfThick);
    
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps * halfThick;
      // Draw in the direction of the line extension
      const extX = Math.round(x + dirX * ratio);
      const extY = Math.round(y + dirY * ratio);
      
      // Draw perpendicular segment at this extended point
      this._drawPerpendicularSegment(extX, extY, perpX, perpY, halfThick, r, g, b, a);
    }
  }

  /**
   * Algorithm 3: Distance-based approach with center line optimization
   * First rasterizes the center line, then draws perpendicular spans
   */
  _drawLineThickDistanceOptimized(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    x1 = Math.floor(x1 - 0.5);
    y1 = Math.floor(y1 - 0.5);
    x2 = Math.floor(x2 - 0.5);
    y2 = Math.floor(y2 - 0.5);
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // For perpendicular spans
    const lineLength = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = Math.floor(thickness / 2);
      for (let py = -radius; py <= radius; py++) {
        for (let px = -radius; px <= radius; px++) {
          this.pixelRenderer.setPixel(x1 + px, y1 + py, r, g, b, a);
        }
      }
      return;
    }
    
    // Unit vector perpendicular to the line
    const perpX = -((y2 - y1) / lineLength);
    const perpY = ((x2 - x1) / lineLength);
    
    // Half thickness for extending in both directions
    const halfThick = Math.floor(thickness / 2);
    
    // Draw the center line using Bresenham's algorithm
    let err = dx - dy;
    let x = x1;
    let y = y1;
    
    // Collect center line points
    const centerPoints = [];
    while (true) {
      centerPoints.push({ x, y });
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    
    // Draw horizontal spans at each center point
    for (const point of centerPoints) {
      for (let t = -halfThick; t <= halfThick; t++) {
        const px = Math.round(point.x + perpX * t);
        const py = Math.round(point.y + perpY * t);
        this.pixelRenderer.setPixel(px, py, r, g, b, a);
      }
    }
    
    // Draw square caps
    // For start cap
    const dirX1 = -(x2 - x1) / lineLength;
    const dirY1 = -(y2 - y1) / lineLength;
    for (let i = 1; i <= halfThick; i++) {
      const capX = Math.round(x1 + dirX1 * i);
      const capY = Math.round(y1 + dirY1 * i);
      
      // Draw horizontal span at this cap point
      for (let t = -halfThick; t <= halfThick; t++) {
        const px = Math.round(capX + perpX * t);
        const py = Math.round(capY + perpY * t);
        this.pixelRenderer.setPixel(px, py, r, g, b, a);
      }
    }
    
    // For end cap
    const dirX2 = (x2 - x1) / lineLength;
    const dirY2 = (y2 - y1) / lineLength;
    for (let i = 1; i <= halfThick; i++) {
      const capX = Math.round(x2 + dirX2 * i);
      const capY = Math.round(y2 + dirY2 * i);
      
      // Draw horizontal span at this cap point
      for (let t = -halfThick; t <= halfThick; t++) {
        const px = Math.round(capX + perpX * t);
        const py = Math.round(capY + perpY * t);
        this.pixelRenderer.setPixel(px, py, r, g, b, a);
      }
    }
  }

  /**
   * Algorithm 4: Parallel offset lines approach
   * Creates multiple parallel lines offset from the center line to create thickness
   */
  _drawLineThickParallelOffset(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    x1 = Math.floor(x1 - 0.5);
    y1 = Math.floor(y1 - 0.5);
    x2 = Math.floor(x2 - 0.5);
    y2 = Math.floor(y2 - 0.5);
    
    const lineLength = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = Math.floor(thickness / 2);
      for (let py = -radius; py <= radius; py++) {
        for (let px = -radius; px <= radius; px++) {
          this.pixelRenderer.setPixel(x1 + px, y1 + py, r, g, b, a);
        }
      }
      return;
    }
    
    // Calculate perpendicular vector
    const perpX = -((y2 - y1) / lineLength);
    const perpY = ((x2 - x1) / lineLength);
    
    // Line direction unit vector for caps
    const dirX = (x2 - x1) / lineLength;
    const dirY = (y2 - y1) / lineLength;
    
    // Half thickness
    const halfThick = thickness / 2;
    
    // Draw offset lines
    const offsetCount = Math.ceil(halfThick);
    for (let offset = -offsetCount; offset <= offsetCount; offset++) {
      // Calculate offset ratio to ensure even coverage
      const offsetRatio = offset / offsetCount * halfThick;
      
      // Calculate offset points
      const ox1 = x1 + perpX * offsetRatio;
      const oy1 = y1 + perpY * offsetRatio;
      const ox2 = x2 + perpX * offsetRatio;
      const oy2 = y2 + perpY * offsetRatio;
      
      // Draw the offset line using Bresenham's algorithm
      this._drawBresenhamLine(Math.round(ox1), Math.round(oy1), 
                           Math.round(ox2), Math.round(oy2), 
                           r, g, b, a);
    }
    
    // Draw square caps
    // For start cap
    for (let offset = -offsetCount; offset <= offsetCount; offset++) {
      const offsetRatio = offset / offsetCount * halfThick;
      
      for (let i = 1; i <= halfThick; i++) {
        const capX = Math.round(x1 - dirX * i + perpX * offsetRatio);
        const capY = Math.round(y1 - dirY * i + perpY * offsetRatio);
        this.pixelRenderer.setPixel(capX, capY, r, g, b, a);
      }
    }
    
    // For end cap
    for (let offset = -offsetCount; offset <= offsetCount; offset++) {
      const offsetRatio = offset / offsetCount * halfThick;
      
      for (let i = 1; i <= halfThick; i++) {
        const capX = Math.round(x2 + dirX * i + perpX * offsetRatio);
        const capY = Math.round(y2 + dirY * i + perpY * offsetRatio);
        this.pixelRenderer.setPixel(capX, capY, r, g, b, a);
      }
    }
  }
  
  /**
   * Helper function: Standard Bresenham line algorithm
   */
  _drawBresenhamLine(x1, y1, x2, y2, r, g, b, a) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      this.pixelRenderer.setPixel(x1, y1, r, g, b, a);
      if (x1 === x2 && y1 === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  /**
   * Algorithm 5: Direct Rectangle Calculation with pixel runs
   * Treats the thick line as a four-sided polygon and directly computes spans
   * Optimized to eliminate sorting with direct span calculation
   */

  _drawLineThickPolygonScan(x1, y1, x2, y2, thickness, r, g, b, a) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    
    // Reuse the pre-allocated pixel runs array, but clear it first
    const pixelRuns = this._pixelRuns;
    pixelRuns.length = 0;
    
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = thickness >> 1; // Bitwise right shift by 1 = divide by 2 and floor
      const centerX = x1 | 0; // Faster rounding using bitwise OR
      const centerY = y1 | 0;
      
      for (let py = -radius; py <= radius; py++) {
        // Add a complete horizontal run for each row
        pixelRuns.push(centerX - radius, centerY + py, (radius << 1) + 1); // (radius * 2) + 1
      }
      
      // Render all runs in a single batch
      this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);
      return;
    }
    
    // Cache common calculations - inverse line length to avoid division
    const invLineLength = 1 / lineLength;
    
    // Calculate perpendicular vector using multiplication instead of division
    const perpX = -dy * invLineLength;
    const perpY = dx * invLineLength;
    
    // Calculate half thickness
    const halfThick = thickness * 0.5;
    
    // Reuse pre-allocated corner objects
    const corners = this._corners;
    
    // Cache perpendicular offsets for corner calculations
    const perpXHalfThick = perpX * halfThick;
    const perpYHalfThick = perpY * halfThick;
    
    // Update the corners in-place to avoid allocations
    corners[0].x = x1 + perpXHalfThick;  corners[0].y = y1 + perpYHalfThick;  // top-left
    corners[1].x = x1 - perpXHalfThick;  corners[1].y = y1 - perpYHalfThick;  // bottom-left
    corners[2].x = x2 - perpXHalfThick;  corners[2].y = y2 - perpYHalfThick;  // bottom-right
    corners[3].x = x2 + perpXHalfThick;  corners[3].y = y2 + perpYHalfThick;  // top-right
    
    // Find bounding box using bitwise operations for faster floor/ceil
    const minY = (Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)) | 0;
    const maxY = (Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y) + 0.999) | 0;
    
    // Pre-compute edge data to avoid recalculating slopes
    const edges = this._edges;
    
    for (let i = 0; i < 4; i++) {
      const edge = edges[i];
      const p1 = corners[i];
      const p2 = corners[(i + 1) & 3]; // Faster modulo for power of 2 using bitwise AND
      
      // Update edge endpoints
      edge.p1 = p1;
      edge.p2 = p2;
      
      // Pre-compute inverse delta Y to avoid division during scanline processing
      // Only update if not horizontal to avoid division by zero
      if (p1.y !== p2.y) {
        edge.invDeltaY = 1 / (p2.y - p1.y);
        edge.deltaX = p2.x - p1.x;
      }
    }
    
    // Reuse pre-allocated intersections array
    const intersections = this._intersections;
    
    // Scan each row
    for (let y = minY; y <= maxY; y++) {
      // Counter for intersections
      let intersectionCount = 0;
      
      for (let i = 0; i < 4; i++) {
        const edge = edges[i];
        const p1 = edge.p1;
        const p2 = edge.p2;
        
        // Skip horizontal edges
        if (p1.y === p2.y) continue;
        
        // Check if scanline intersects this edge
        if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
          // Use pre-computed values for x-intersection
          const t = (y - p1.y) * edge.invDeltaY;
          intersections[intersectionCount++] = p1.x + t * edge.deltaX;
        }
      }
      
      if (intersectionCount === 1) {
        // Single intersection case - just draw one pixel
        const x = intersections[0] | 0; // Faster floor using bitwise OR
        pixelRuns.push(x, y, 1);
      }
      else if (intersectionCount === 2) {
        // Two intersections case - draw span between them
        const x1 = intersections[0];
        const x2 = intersections[1];
        // No need to sort - just compare directly
        const leftX = x1 < x2 ? x1 | 0 : x2 | 0; // Math.floor using bitwise OR
        const rightX = x1 > x2 ? (x1 + 0.999) | 0 : (x2 + 0.999) | 0; // Math.ceil approximation
        const spanLength = rightX - leftX;
        
        if (spanLength > 0) {
          pixelRuns.push(leftX, y, spanLength);
        }
      }
    }
    
    // Render all collected pixel runs in a single batch operation
    if (pixelRuns.length > 0) {
      this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);
    }
  }
}

class SWRendererPixel {
  constructor(frameBufferUint8ClampedView, frameBufferUint32View, width, height, context) {
    this.frameBufferUint8ClampedView = frameBufferUint8ClampedView;
    this.frameBufferUint32View = frameBufferUint32View;
    this.width = width;
    this.height = height;
    // if context is null, then it means we are just using the primitives without the
    // whole context apparatus, so we create a placeholder object with the globalAlpha property
    // that we need for the blending calculations
    if (context) {
      this.context = context;
      this.tempClippingMask = context.tempClippingMask;
    } else {
      this.context = { globalAlpha: 1.0 };
    }
  }

  clipPixel(x, y) {
    // Convert to integer with bitwise OR
    x = x | 0;
    y = y | 0;
    
    // Cache width for performance
    const width = this.width;
    
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position
    const pixelPos = y * width + x;
    
    // Use bit shifting for division and modulo
    const byteIndex = pixelPos >> 3; // Faster than Math.floor(pixelPos / 8)
    const bitIndex = pixelPos & 7;   // Faster than pixelPos % 8
    
    // OR the bit in the tempClippingMask
    this.tempClippingMask[byteIndex] |= (1 << bitIndex);
  }

  // Blending happens in sRGB space for performance reasons
  setPixel(x, y, r, g, b, a) {
    // emit a warning if x or y are not integers
    if (false) {
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        console.warn(`setPixel called with non-integer coordinates: x=${x}, y=${y}`);
      }
    }
    // fix x and y to be integers using bitwise OR (faster than Math.round)
    x = x | 0;
    y = y | 0;
    
    // Cache frequently used constants
    const width = this.width;
    const globalAlpha = this.context.globalAlpha;
    
    // Early bounds check
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position (used multiple times)
    const pixelPos = y * width + x;
    const index = pixelPos * 4;
    
    // Check for clipping with optimized path
    if (this.context.currentState) {
      const clippingMask = this.context.currentState.clippingMask;
      const clippingMaskByteIndex = pixelPos >> 3; // Faster than Math.floor(pixelPos / 8)
      const bitIndex = pixelPos & 7; // Faster than pixelPos % 8
      
      // Quick check for common case (fully clipped byte)
      if (clippingMask[clippingMaskByteIndex] === 0) return;
      
      // Bit-level check only if needed
      if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) return;
    }
    
    // Check for fast path with opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    
    if (isOpaque) {
      // Calculate packed color once
      packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
      // Fast path for opaque colors - direct pixel setting without blending
      this.frameBufferUint32View[pixelPos] = packedColor;
      return;
    }
    
    // Standard path with alpha blending
    // Batch alpha calculations to reduce divisions
    const incomingAlpha = (a / 255) * globalAlpha;
    const oldAlpha = this.frameBufferUint8ClampedView[index + 3] / 255;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
    const newAlpha = incomingAlpha + oldAlphaScaled;
    
    // Avoid division if possible
    if (newAlpha <= 0) return;
    
    // Pre-calculate division factor once
    const blendFactor = 1 / newAlpha;
    
    // Apply color blending
    this.frameBufferUint8ClampedView[index] = (r * incomingAlpha + this.frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
    this.frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + this.frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
    this.frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + this.frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
    this.frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
  }

  clearPixel(x, y) {
    // Convert to integer with bitwise OR
    x = x | 0;
    y = y | 0;
    
    // Cache width for performance
    const width = this.width;
    
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position
    const index = (y * width + x) * 4;
    
    // Set all pixel values to 0 
    this.frameBufferUint8ClampedView[index] = 0;
    this.frameBufferUint8ClampedView[index + 1] = 0;
    this.frameBufferUint8ClampedView[index + 2] = 0;
    this.frameBufferUint8ClampedView[index + 3] = 0;
  }

  /**
   * Set multiple horizontal pixel runs with the same color
   * @param {Array} runs - Array of [x, y, length] triplets
   * @param {Number} r - Red component (0-255)
   * @param {Number} g - Green component (0-255)
   * @param {Number} b - Blue component (0-255)
   * @param {Number} a - Alpha component (0-255)
   */
  setPixelRuns(runs, r, g, b, a) {
    // Cache frequently used constants
    const width = this.width;
    const height = this.height;
    const frameBufferUint8ClampedView = this.frameBufferUint8ClampedView;
    const frameBufferUint32View = this.frameBufferUint32View;
    const globalAlpha = this.context.globalAlpha;
    const hasClipping = this.context.currentState;
    const clippingMask = hasClipping ? this.context.currentState.clippingMask : null;
    
    // Check for fast path with opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    if (isOpaque) {
      packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    
    // For non-opaque colors, we need alpha calculations
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Skip processing if fully transparent
    if (incomingAlpha <= 0) return;

    for (let i = 0; i < runs.length; i += 3) {
      // Get run parameters and convert to integers
      let x = runs[i] | 0;
      const y = runs[i+1] | 0;
      let length = runs[i+2] | 0;
      
      // Skip if y is out of bounds
      if (y < 0 || y >= height) continue;
      
      // Handle horizontal clipping
      if (x < 0) {
        length += x; // Reduce length by the amount x is negative
        x = 0;       // Start at left edge
        if (length <= 0) continue; // Skip if nothing to draw
      }
      
      // Clip to right edge
      if (x + length > width) {
        length = width - x;
        if (length <= 0) continue; // Skip if nothing to draw
      }
      
      // Calculate base position for this scanline
      let pixelPos = y * width + x;
      let index = pixelPos * 4;
      
      // Draw the run
      if (isOpaque) {
        // --- Opaque Path --- 
        for (let j = 0; j < length; j++, pixelPos++, index += 4) {
          // Check clipping if needed
          if (hasClipping) {
            const clippingMaskByteIndex = pixelPos >> 3;
            
            // Quick check for fully clipped byte
            if (clippingMask[clippingMaskByteIndex] === 0) {
              // Skip to the end of this byte boundary
              const pixelsInThisByte = 8 - (pixelPos & 7);
              const pixelsToSkip = Math.min(pixelsInThisByte, length - j);
              j += pixelsToSkip - 1; // -1 because loop also increments j
              pixelPos += pixelsToSkip - 1;
              index += (pixelsToSkip - 1) * 4;
              continue;
            }
            
            // Bit-level check
            const bitIndex = pixelPos & 7;
            if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) {
              continue;
            }
          }
          
          // Direct 32-bit write
          frameBufferUint32View[pixelPos] = packedColor;
        }
      } else {
        // --- Blending Path --- 
        for (let j = 0; j < length; j++, pixelPos++, index += 4) {
          // Check clipping if needed
          if (hasClipping) {
            const clippingMaskByteIndex = pixelPos >> 3;
            
            // Quick check for fully clipped byte
            if (clippingMask[clippingMaskByteIndex] === 0) {
              // Skip to the end of this byte boundary
              const pixelsInThisByte = 8 - (pixelPos & 7);
              const pixelsToSkip = Math.min(pixelsInThisByte, length - j);
              j += pixelsToSkip - 1; // -1 because loop also increments j
              pixelPos += pixelsToSkip - 1;
              index += (pixelsToSkip - 1) * 4;
              continue;
            }
            
            // Bit-level check
            const bitIndex = pixelPos & 7;
            if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) {
              continue;
            }
          }
          
          // Standard path with alpha blending
          // Get existing pixel alpha
          const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
          const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
          const newAlpha = incomingAlpha + oldAlphaScaled;
          
          // Skip fully transparent pixels
          if (newAlpha <= 0) continue;
          
          // Pre-calculate division factor once for this pixel
          const blendFactor = 1 / newAlpha;
          
          // Apply color blending
          frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
          frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
          frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
          frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
        }
      }
    }
  }

  /**
   * Set pixel runs with fill and stroke colors in a single pass
   * @param {Number} startY - Starting Y coordinate
   * @param {Array} runs - Array of [xFill, fillLen, xStroke1, stroke1Len, xStroke2, stroke2Len] sextuplets
   * @param {Number} fillR - Fill red component (0-255)
   * @param {Number} fillG - Fill green component (0-255)
   * @param {Number} fillB - Fill blue component (0-255)
   * @param {Number} fillA - Fill alpha component (0-255)
   * @param {Number} strokeR - Stroke red component (0-255)
   * @param {Number} strokeG - Stroke green component (0-255)
   * @param {Number} strokeB - Stroke blue component (0-255)
   * @param {Number} strokeA - Stroke alpha component (0-255)
   */
  // Called by SWRendererCircle.drawFullCircleFastest
  // Not used. The idea was that in tha case we have both a stroke and a fill,
  // we could collect the runs for both, and then render them in a single batch operation that
  // scans the rows from top to bottom only once, for each line drawing the fill and then stroke
  // The hope was that although the number of set pixels doesn't change, this would be more cache-friendly
  // as it scans the lines sequentially only once (instead of twice), and therefore faster.
  // However, this was not faster than the other approach of doing first a pass for the fill,

  setPixelFillAndStrokeRuns(startY, runs, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {
    // Cache frequently used constants
    startY += 2; // This offset seems specific to the caller (Circle) and shouldn't be here
    const width = this.width;
    const height = this.height;
    const frameBufferUint8ClampedView = this.frameBufferUint8ClampedView; // Cache views
    const frameBufferUint32View = this.frameBufferUint32View;
    const globalAlpha = this.context.globalAlpha;
    const hasClipping = this.context.currentState;
    const clippingMask = hasClipping ? this.context.currentState.clippingMask : null;

    // Batch alpha calculations for fill
    const fillIncomingAlpha = (fillA / 255) * globalAlpha;
    const fillInverseIncomingAlpha = 1 - fillIncomingAlpha;
    const fillIsOpaque = fillIncomingAlpha >= 1.0;
    let fillPackedColor = 0;
    if (fillIsOpaque) {
      fillPackedColor = (255 << 24) | (fillB << 16) | (fillG << 8) | fillR;
    }

    // Batch alpha calculations for stroke
    const strokeIncomingAlpha = (strokeA / 255) * globalAlpha;
    const strokeInverseIncomingAlpha = 1 - strokeIncomingAlpha;
    const strokeIsOpaque = strokeIncomingAlpha >= 1.0;
    let strokePackedColor = 0;
    if (strokeIsOpaque) {
      strokePackedColor = (255 << 24) | (strokeB << 16) | (strokeG << 8) | strokeR;
    }

    // Skip processing if both are fully transparent
    // Note: Even if opaque, alpha can be 0 if globalAlpha or base alpha is 0
    if (fillIncomingAlpha <= 0 && strokeIncomingAlpha <= 0) return;

    let y = startY; // Use original startY

    for (let i = 0; i < runs.length; i += 6) {
      // Skip if y is out of bounds
      if (y < 0 || y >= height) {
        y++;
        continue;
      }

      // Extract segment data
      // Use | 0 for potential float to integer conversion, though input should be int
      let xFill = runs[i] !== -1 ? runs[i] | 0 : -1;
      let fillLen = runs[i+1] !== -1 ? runs[i+1] | 0 : -1;
      let xStroke1 = runs[i+2] !== -1 ? runs[i+2] | 0 : -1;
      let stroke1Len = runs[i+3] !== -1 ? runs[i+3] | 0 : -1;
      let xStroke2 = runs[i+4] !== -1 ? runs[i+4] | 0 : -1;
      let stroke2Len = runs[i+5] !== -1 ? runs[i+5] | 0 : -1;

      // Process segments for this scanline
      const hasFill = xFill !== -1 && fillLen > 0 && fillIncomingAlpha > 0;
      const hasStroke1 = xStroke1 !== -1 && stroke1Len > 0 && strokeIncomingAlpha > 0;
      const hasStroke2 = xStroke2 !== -1 && stroke2Len > 0 && strokeIncomingAlpha > 0;

      // Skip if nothing to draw on this line
      if (!hasFill && !hasStroke1 && !hasStroke2) {
        y++;
        continue;
      }

      // Prepare for fill segment
      if (hasFill) {
        // Handle horizontal clipping for fill
        if (xFill < 0) {
          fillLen += xFill;
          xFill = 0;
        }
        // Clip to right edge
        if (xFill + fillLen > width) {
          fillLen = width - xFill;
        }
        // Skip if invalid after clipping
        if (fillLen <= 0) {
          // Ensure state reflects no fill for this line
          xFill = -1;
          fillLen = 0;
          // hasFill = false; // Not strictly needed as we re-check later, but cleaner
        }
      }

      // Prepare for stroke1 segment
      if (hasStroke1) {
        // Handle horizontal clipping for stroke1
        if (xStroke1 < 0) {
          stroke1Len += xStroke1;
          xStroke1 = 0;
        }
        // Clip to right edge
        if (xStroke1 + stroke1Len > width) {
          stroke1Len = width - xStroke1;
        }
        // Skip if invalid after clipping
        if (stroke1Len <= 0) {
          xStroke1 = -1;
          stroke1Len = 0;
          // hasStroke1 = false; // Cleaner
        }
      }

      // Prepare for stroke2 segment
      if (hasStroke2) {
        // Handle horizontal clipping for stroke2
        if (xStroke2 < 0) {
          stroke2Len += xStroke2;
          xStroke2 = 0;
        }
        // Clip to right edge
        if (xStroke2 + stroke2Len > width) {
          stroke2Len = width - xStroke2;
        }
        // Skip if invalid after clipping
        if (stroke2Len <= 0) {
          xStroke2 = -1;
          stroke2Len = 0;
          // hasStroke2 = false; // Cleaner
        }
      }

      // Process segments in order: fill, then stroke1, then stroke2
      for (let segmentType = 0; segmentType < 3; segmentType++) {
        // Select segment parameters based on type
        let x, length, r, g, b, incomingAlpha, inverseIncomingAlpha, isOpaque;
        let packedColor = 0; // Added for opaque optimization

        // Segment type: 0 = fill, 1 = stroke1, 2 = stroke2
        if (segmentType === 0) {
           // Re-check hasFill and validity after clipping
          if (!hasFill || xFill === -1 || fillLen <= 0) continue;
          x = xFill;
          length = fillLen;
          r = fillR;
          g = fillG;
          b = fillB;
          incomingAlpha = fillIncomingAlpha;
          inverseIncomingAlpha = fillInverseIncomingAlpha;
          isOpaque = fillIsOpaque;
          if (isOpaque) packedColor = fillPackedColor; // Set packed color if opaque
        } else if (segmentType === 1) {
          // Re-check hasStroke1 and validity after clipping
          if (!hasStroke1 || xStroke1 === -1 || stroke1Len <= 0) continue;
          x = xStroke1;
          length = stroke1Len;
          r = strokeR;
          g = strokeG;
          b = strokeB;
          incomingAlpha = strokeIncomingAlpha;
          inverseIncomingAlpha = strokeInverseIncomingAlpha;
          isOpaque = strokeIsOpaque;
          if (isOpaque) packedColor = strokePackedColor; // Set packed color if opaque
        } else { // segmentType === 2
          // Re-check hasStroke2 and validity after clipping
          if (!hasStroke2 || xStroke2 === -1 || stroke2Len <= 0) continue;
          x = xStroke2;
          length = stroke2Len;
          r = strokeR;
          g = strokeG;
          b = strokeB;
          incomingAlpha = strokeIncomingAlpha;
          inverseIncomingAlpha = strokeInverseIncomingAlpha;
          isOpaque = strokeIsOpaque;
          if (isOpaque) packedColor = strokePackedColor; // Set packed color if opaque
        }

        // Calculate base position for this segment
        let pixelPos = y * width + x;
        let index = pixelPos * 4;

        // Draw the run
        for (let j = 0; j < length; j++, pixelPos++, index += 4) {
          // Check clipping if needed
          if (hasClipping) {
            const clippingMaskByteIndex = pixelPos >> 3; // Calculate byte index

            // Check if byte index is potentially outside the mask bounds (shouldn't happen with y/x clipping)
            // Though adding a check might be safer depending on mask generation guarantees.
             if (clippingMaskByteIndex >= clippingMask.length) {
                 // This pixel is outside the drawable area defined by the mask dimensions
                 continue;
             }

            // Quick check for fully clipped byte
            if (clippingMask[clippingMaskByteIndex] === 0) {
              // Skip to the end of this byte boundary
              const pixelsInThisByte = 8 - (pixelPos & 7); // Pixels remaining in this byte
              const pixelsToSkip = Math.min(pixelsInThisByte, length - j); // Don't skip past the end of the run
              // Advance counters
              j += pixelsToSkip - 1; // -1 because loop also increments j
              pixelPos += pixelsToSkip - 1;
              index += (pixelsToSkip - 1) * 4;
              continue; // Continue to next iteration of inner loop
            }

            // Bit-level check if the byte wasn't fully clipped
            const bitIndex = pixelPos & 7; // 0-7
            // Check if the specific bit for this pixel is 0 (clipped)
            if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) {
              continue; // Skip this pixel
            }
          }

          // *** Opaque Optimization ***
          if (isOpaque) {
            // --- Opaque Path ---
            // Direct 32-bit write
            frameBufferUint32View[pixelPos] = packedColor;
          } else {
            // --- Blending Path (Original Logic) ---
            // Get existing pixel alpha
            const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
            const newAlpha = incomingAlpha + oldAlphaScaled;

            // Skip blending if resulting alpha is negligible (or zero)
            // Using a small epsilon might be slightly more robust than == 0 for floats
            if (newAlpha <= 0.00001) continue;

            // Pre-calculate division factor once for this pixel
            const blendFactor = 1 / newAlpha;

            // Apply color blending (Porter-Duff "source-over")
            frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
          }
        } // End inner pixel loop (j)
      } // End segment type loop

      y++; // Move to the next scanline
    } // End runs loop (i)
  } // End setPixelFillAndStrokeRuns

}class SWRendererRect {
  constructor(frameBufferUint8ClampedView, frameBufferUint32View, width, height, lineRenderer, pixelRenderer) {
    this.frameBufferUint8ClampedView = frameBufferUint8ClampedView;
    this.frameBufferUint32View = frameBufferUint32View;
    this.width = width;
    this.height = height;
    this.lineRenderer = lineRenderer;
    this.pixelRenderer = pixelRenderer;
  }

  drawRect(shape) {
    if(shape.clippingOnly) {
      if (isNearMultipleOf90Degrees(shape.rotation)) {
        const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(shape.width, shape.height, shape.rotation);
        this.drawAxisAlignedRect(shape.center.x, shape.center.y, adjustedWidth, adjustedHeight, true);
      } else {
        this.drawRotatedRect(shape.center.x, shape.center.y, shape.width, shape.height, shape.rotation, true);
      }
      return;
    }

    const {
      center, width, height, rotation, clippingOnly,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    if (isNearMultipleOf90Degrees(rotation)) {
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(width, height, rotation);
      this.drawAxisAlignedRect(center.x, center.y, adjustedWidth, adjustedHeight, clippingOnly,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    } else {
      this.drawRotatedRect(center.x, center.y, width, height, rotation, clippingOnly,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    }
  }

  clearRect(shape) {
    const center = shape.center;
    const shapeWidth = shape.width;
    const shapeHeight = shape.height;
    const rotation = shape.rotation;

    if (isNearMultipleOf90Degrees(rotation)) {
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(shapeWidth, shapeHeight, rotation);
      
      if (adjustedWidth === this.width && 
        adjustedHeight === this.height &&
        center.x === adjustedWidth / 2 &&
        center.y === adjustedHeight / 2) {
        this.frameBufferUint8ClampedView.fill(0);
        return;
      }
      this.clearAxisAlignedRect(center.x, center.y, adjustedWidth, adjustedHeight);
    } else {
      this.fillRotatedRect(center.x, center.y, shapeWidth, shapeHeight, rotation, false, true);
    }
  }

  drawRotatedRect(centerX, centerY, width, height, rotation, clippingOnly, strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // draw fill first
    if (clippingOnly || fillA > 0) {
      this.fillRotatedRect(centerX, centerY, width, height, rotation, clippingOnly, false, fillR, fillG, fillB, fillA);
    }
    if (clippingOnly) {
      return;
    }

    if (strokeA > 0) {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const points = [
        [-halfWidth, -halfHeight],
        [halfWidth, -halfHeight],
        [halfWidth, halfHeight],
        [-halfWidth, halfHeight]
      ].map(([x, y]) => ({
        x: centerX + x * cos - y * sin,
        y: centerY + x * sin + y * cos
      }));

      if (strokeWidth === 1) {
        for (let i = 0; i < 4; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 4];
          this.lineRenderer.drawLine1px(
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

          this.lineRenderer.drawLineThick(
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

          this.lineRenderer.drawLineThick(
            line.start.x, line.start.y,
            line.end.x, line.end.y,
            strokeWidth,
            strokeR, strokeG, strokeB, strokeA
          );
        }
      }
    }
  }

  drawAxisAlignedRect(centerX, centerY, rectWidth, rectHeight, clippingOnly,
    strokeWidth, strokeR, strokeG, strokeB, strokeA,
    fillR, fillG, fillB, fillA) {
    
    // Round inputs for consistency
    //centerX = Math.round(centerX);
    //centerY = Math.round(centerY);
    //rectWidth = Math.round(rectWidth);
    //rectHeight = Math.round(rectHeight);
    //strokeWidth = Math.round(strokeWidth);
    if (clippingOnly) {strokeWidth = 0;}
  
    
    // Draw fill first
    if (clippingOnly || fillA > 0) {
      // Get fill geometry
      let fillPos = null;

      // If we are drawing the fill under a fully opaque stroke, then we can ignore some minor defects
      // in positioning that would make the fill not crisp (and hence would show differently in the
      // standard canvas renderer), as they will be covered by the stroke.
      // If instead we are drawing the fill under a semi-transparent (or non existent) stroke, then we
      // throw a warning, as the rendering would be different in the standard canvas renderer.
      if (strokeA == 255 && strokeWidth > 0) {
        fillPos = roundCornerOfRectangularGeometry(getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight));
      } else {
        fillPos = roundCornerOfRectangularGeometryWithWarning(getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight));
      }
      if (clippingOnly) {
        for (let y = Math.floor(fillPos.y); y < Math.ceil(fillPos.y + fillPos.h); y++) {
          for (let x = Math.floor(fillPos.x); x < Math.ceil(fillPos.x + fillPos.w); x++) {
            this.pixelRenderer.clipPixel(x, y);
          }
        }
        return;
      }
  
       // Check for fast path with opaque colors
       const globalAlpha = this.pixelRenderer.context.globalAlpha;
       const isOpaque = (fillA === 255) && (globalAlpha >= 1.0);
       let packedColor = 0;
       if (isOpaque) {
         packedColor = (255 << 24) | (fillB << 16) | (fillG << 8) | fillR;
       }

       for (let y = Math.floor(fillPos.y); y < Math.ceil(fillPos.y + fillPos.h); y++) {
         for (let x = Math.floor(fillPos.x); x < Math.ceil(fillPos.x + fillPos.w); x++) {
           // Perform bounds check
           if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

           // Pre-calculate pixel position
           const pixelPos = y * this.width + x;

           // Check for clipping with optimized path
           if (this.pixelRenderer.context.currentState) {
             const clippingMask = this.pixelRenderer.context.currentState.clippingMask;
             const clippingMaskByteIndex = pixelPos >> 3;
             const bitIndex = pixelPos & 7;
             if (clippingMask[clippingMaskByteIndex] === 0) continue;
             if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) continue;
           }

           if (isOpaque) {
             // Fast path for opaque pixels - Direct 32-bit write
             this.frameBufferUint32View[pixelPos] = packedColor;
           } else {
             // Standard path: Call setPixel for blending
             this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
           }
         }
       }
    }
  
    // Draw stroke if needed. Note that the stroke can't always be precisely centered on the fill
    // i.e. in case the stroke is larger by an odd number of pixels.
    if (strokeA > 0 && strokeWidth > 0) {
      let strokePos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
      const halfStroke = strokeWidth / 2;
  
      // Draw horizontal strokes
      for (let x = Math.floor(strokePos.x - halfStroke); x < strokePos.x + strokePos.w + halfStroke; x++) {
        for (let t = -halfStroke; t < halfStroke; t++) {
          this.pixelRenderer.setPixel(x, strokePos.y + t, strokeR, strokeG, strokeB, strokeA);
          this.pixelRenderer.setPixel(x, strokePos.y + strokePos.h + t, strokeR, strokeG, strokeB, strokeA);
        }
      }
  
      // Draw vertical strokes
      for (let y = Math.floor(strokePos.y + halfStroke); y < strokePos.y + strokePos.h - halfStroke; y++) {
        for (let t = -halfStroke; t < halfStroke; t++) {
          this.pixelRenderer.setPixel(strokePos.x + t, y, strokeR, strokeG, strokeB, strokeA);
          this.pixelRenderer.setPixel(strokePos.x + strokePos.w + t, y, strokeR, strokeG, strokeB, strokeA);
        }
      }
    }
  }

  clearAxisAlignedRect(centerX, centerY, rectWidth, rectHeight) {
    // Round inputs for consistency with draw function
    centerX = Math.round(centerX);
    centerY = Math.round(centerY);
    rectWidth = Math.round(rectWidth);
    rectHeight = Math.round(rectHeight);

    const halfWidth = Math.floor(rectWidth / 2);
    const halfHeight = Math.floor(rectHeight / 2);
    const pathLeft = centerX - halfWidth;
    const pathTop = centerY - halfHeight;
    const pathRight = pathLeft + rectWidth;
    const pathBottom = pathTop + rectHeight;

    for (let y = pathTop; y < pathBottom; y++) {
      for (let x = pathLeft; x < pathRight; x++) {
        this.pixelRenderer.clearPixel(x, y);
      }
    }
  }

  fillRotatedRect(centerX, centerY, width, height, rotation, clippingOnly, clear, r, g, b, a) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const hw = width / 2;
    const hh = height / 2;
    
    // Calculate corners
    const corners = [
      { x: centerX + hw * cos - hh * sin, y: centerY + hw * sin + hh * cos },
      { x: centerX + hw * cos + hh * sin, y: centerY + hw * sin - hh * cos },
      { x: centerX - hw * cos + hh * sin, y: centerY - hw * sin - hh * cos },
      { x: centerX - hw * cos - hh * sin, y: centerY - hw * sin + hh * cos }
    ];
    
    // Create edge functions for each edge
    const edges = [];
    for(let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      
      // Edge equation coefficients
      const a = p2.y - p1.y;
      const b = p1.x - p2.x;
      const c = p2.x * p1.y - p1.x * p2.y;
      
      edges.push({a, b, c});
    }
    
    // Find bounding box
    const minX = Math.floor(Math.min(...corners.map(p => p.x)));
    const maxX = Math.ceil(Math.max(...corners.map(p => p.x)));
    const minY = Math.floor(Math.min(...corners.map(p => p.y)));
    const maxY = Math.ceil(Math.max(...corners.map(p => p.y)));
    
    // Test each pixel using edge functions
    const globalAlpha = this.pixelRenderer.context.globalAlpha;
    if (clippingOnly) {
      for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
          // A point is inside if it's on the "inside" of all edges
          const inside = edges.every(edge => 
            (edge.a * x + edge.b * y + edge.c) >= 0
          );
          
          if(inside) {
            this.pixelRenderer.clipPixel(x, y);
          }
        }
      }
    }
    else if (clear) {
      for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
          // A point is inside if it's on the "inside" of all edges
          const inside = edges.every(edge => 
            (edge.a * x + edge.b * y + edge.c) >= 0
          );
          
          if(inside) {
            this.pixelRenderer.clearPixel(x, y);
          }
        }
      }
    }
    else {
      // Check for fast path with opaque colors
      const isOpaque = (a === 255) && (globalAlpha >= 1.0);
      let packedColor = 0;
      if (isOpaque) {
        packedColor = (255 << 24) | (b << 16) | (g << 8) | r;
      }

      for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
          // A point is inside if it's on the "inside" of all edges
          const inside = edges.every(edge => 
            (edge.a * x + edge.b * y + edge.c) >= 0
          );
          
          if(inside) {
            // Perform bounds check
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

            // Pre-calculate pixel position
            const pixelPos = y * this.width + x;

            // Check for clipping with optimized path
            if (this.pixelRenderer.context.currentState) {
              const clippingMask = this.pixelRenderer.context.currentState.clippingMask;
              const clippingMaskByteIndex = pixelPos >> 3;
              const bitIndex = pixelPos & 7;
              if (clippingMask[clippingMaskByteIndex] === 0) continue;
              if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) continue;
            }

            if (isOpaque) {
              // Fast path for opaque pixels - Direct 32-bit write
              this.frameBufferUint32View[pixelPos] = packedColor;
            } else {
              // Standard path: Call setPixel for blending
              this.pixelRenderer.setPixel(x, y, r, g, b, a);
            }
          }
        }
      }
    }
  }
}class SWRendererRoundedRect {
  constructor(frameBufferUint8ClampedView, frameBufferUint32View, width, height, lineRenderer, pixelRenderer, swRectRenderer) {
    this.frameBufferUint8ClampedView = frameBufferUint8ClampedView;
    this.frameBufferUint32View = frameBufferUint32View;
    this.width = width;
    this.height = height;
    this.lineRenderer = lineRenderer;
    this.pixelRenderer = pixelRenderer;
    this.swRectRenderer = swRectRenderer;
  }

  drawRoundedRect(shape) {
    const {
      center, width, height, radius, rotation,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    // if the stroke is a) invisible (size zero or trasparent) OR b) opaque and thin,
    //  then use drawCrispAxisAlignedRoundedRectThinOpaqueStroke
    //  otherwise use drawCrispAxisAlignedRoundedRectThickOrSemitrasparentStroke
    if (isNearMultipleOf90Degrees(rotation)) {
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(width, height, rotation);
      const correctedRadius = radius > 2 ? radius - 1 : radius;
      if (strokeWidth == 0 || strokeA === 255 || (strokeWidth < 5 && strokeA === 255)) {
        this.drawCrispAxisAlignedRoundedRectThinOpaqueStroke(center.x, center.y, adjustedWidth, adjustedHeight, correctedRadius,
          strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA);
      } else {
        this.drawCrispAxisAlignedRoundedRectThickOrSemitrasparentStroke(center.x, center.y, adjustedWidth, adjustedHeight, correctedRadius,
          strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA);
      }
    } else {
      this.drawRotatedRoundedRect(center.x, center.y, width, height, radius, rotation,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    }
  }

  drawCrispAxisAlignedRoundedRectThinOpaqueStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius,
    strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {

    // to drow a crisp rectangle-like shape, while centerX and centerY could be non-integer,
    // the width and height must be integers, so let's throw an error if they are not
    if (rectWidth % 1 !== 0 || rectHeight % 1 !== 0) {
      throw new Error('Width and height must be integers');
    }

    // Handle fill
    if (fillA > 0) {
      this.drawRoundedRectFill(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth, 
        fillR, fillG, fillB, fillA, strokeA == 255 && strokeWidth > 0);
    }

    // Handle stroke
    if (strokeA > 0 && strokeWidth > 0) {
      if (strokeWidth === 1) {
        // For very thin strokes, use the simple direct drawing approach
        let pos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
        let r = Math.round(Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2));

        // Draw horizontal strokes
        for (let xx = Math.floor(pos.x + r); xx < pos.x + pos.w - r; xx++) {
            this.pixelRenderer.setPixel(xx, pos.y - 0.5, strokeR, strokeG, strokeB, strokeA);
            this.pixelRenderer.setPixel(xx, pos.y + pos.h - 0.5, strokeR, strokeG, strokeB, strokeA);
        }
        
        // Draw vertical strokes
        for (let yy = Math.floor(pos.y + r); yy < pos.y + pos.h - r; yy++) {
            this.pixelRenderer.setPixel(pos.x - 0.5, yy, strokeR, strokeG, strokeB, strokeA);
            this.pixelRenderer.setPixel(pos.x + pos.w - 0.5, yy, strokeR, strokeG, strokeB, strokeA);
        }

        // Draw corner strokes
        const drawCorner = (cx, cy, startAngle, endAngle) => {
          for (let angle = startAngle; angle <= endAngle; angle += Math.PI/180) {
              const sr = r - 0.5;
              const px = cx + sr * Math.cos(angle);
              const py = cy + sr * Math.sin(angle);
              this.pixelRenderer.setPixel(Math.floor(px), Math.floor(py), strokeR, strokeG, strokeB, strokeA);
          }
        };

        drawCorner(pos.x + r, pos.y + r, Math.PI, Math.PI * 3/2);
        drawCorner(pos.x + pos.w - r, pos.y + r, Math.PI * 3/2, Math.PI * 2);
        drawCorner(pos.x + pos.w - r, pos.y + pos.h - r, 0, Math.PI/2);
        drawCorner(pos.x + r, pos.y + pos.h - r, Math.PI/2, Math.PI);
      } else {
        // For thicker strokes, use the same mechanism as thick transparent stroke
        this.drawRoundedRectStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
          strokeR, strokeG, strokeB, strokeA);
      }
    }
  }

  drawCrispAxisAlignedRoundedRectThickOrSemitrasparentStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, 
    strokeWidth, strokeR, strokeG, strokeB, strokeA, 
    fillR, fillG, fillB, fillA) {

    if (rectWidth % 1 !== 0 || rectHeight % 1 !== 0) {
      throw new Error('Width and height must be integers');
    }

    // Handle fill
    if (fillA > 0) {
      this.drawRoundedRectFill(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
        fillR, fillG, fillB, fillA, strokeA == 255 && strokeWidth > 0);
    }

    // Handle stroke
    if (strokeA > 0 && strokeWidth > 0) {
      this.drawRoundedRectStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
        strokeR, strokeG, strokeB, strokeA);
    }
  }

  // Helper method for fill
  drawRoundedRectFill(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
    fillR, fillG, fillB, fillA, alsoDrawingOpaqueStroke = false) {
    let pos = null;

    // If we are drawing the fill under a fully opaque stroke, then we can ignore some minor defects
    // in positioning that would make the fill not crisp (and hence would show differently in the
    // standard canvas renderer), as they will be covered by the stroke.
    // If instead we are drawing the fill under a semi-transparent (or non existent) stroke, then we
    // throw a warning, as the rendering would be different in the standard canvas renderer.
    if (alsoDrawingOpaqueStroke) {
      pos = roundCornerOfRectangularGeometry(
        getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight)
      );
    } else {
      pos = roundCornerOfRectangularGeometryWithWarning(
        getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight)
      );
    }
    
    let r = Math.round(Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2));

    function isInsideRoundedRect(px, py) {
      // Test if point is inside main rectangle
      if (px >= pos.x + r && px < pos.x + pos.w - r && 
          py >= pos.y && py < pos.y + pos.h) {
        return true;
      }
      if (px >= pos.x && px < pos.x + pos.w && 
          py >= pos.y + r && py < pos.y + pos.h - r) {
        return true;
      }

      // Test if point is inside rounded corners
      const corners = [
        { x: pos.x + r, y: pos.y + r },
        { x: pos.x + pos.w - r, y: pos.y + r },
        { x: pos.x + pos.w - r, y: pos.y + pos.h - r },
        { x: pos.x + r, y: pos.y + pos.h - r }
      ];
      
      for (const corner of corners) {
        const dx = px - corner.x + 1;
        const dy = py - corner.y + 1;
        if (dx * dx + dy * dy < r * r) {
          return true;
        }
      }
      
      return false;
    }

    // Check for fast path with opaque colors
    const globalAlpha = this.pixelRenderer.context.globalAlpha;
    const isOpaque = (fillA === 255) && (globalAlpha >= 1.0);
    let packedColor = 0;
    if (isOpaque) {
      packedColor = (255 << 24) | (fillB << 16) | (fillG << 8) | fillR;
    }

    for (let yy = Math.floor(pos.y); yy <= Math.ceil(pos.y + pos.h); yy++) {
      for (let xx = Math.floor(pos.x); xx <= Math.ceil(pos.x + pos.w); xx++) {
        if (isInsideRoundedRect(Math.ceil(xx), Math.ceil(yy))) {
           // Perform bounds check
           if (xx < 0 || xx >= this.width || yy < 0 || yy >= this.height) continue;

           // Pre-calculate pixel position
           const pixelPos = yy * this.width + xx;

           // Check for clipping with optimized path
           if (this.pixelRenderer.context.currentState) {
             const clippingMask = this.pixelRenderer.context.currentState.clippingMask;
             const clippingMaskByteIndex = pixelPos >> 3;
             const bitIndex = pixelPos & 7;
             if (clippingMask[clippingMaskByteIndex] === 0) continue;
             if ((clippingMask[clippingMaskByteIndex] & (1 << bitIndex)) === 0) continue;
           }

           if (isOpaque) {
             // Fast path for opaque pixels - Direct 32-bit write
             this.frameBufferUint32View[pixelPos] = packedColor;
           } else {
             // Standard path: Call setPixel for blending
             this.pixelRenderer.setPixel(xx, yy, fillR, fillG, fillB, fillA);
           }
        }
      }
    }
  }

  // Helper method for both semi-transparent strokes and thick strokes
  // The pixels of the stroke are first collected in a set, and then drawn to the
  // screen. Not only that, but the stroke of the corners is actually kept in a set of scanlines, this is to avoid
  // internal gaps that one can see using the current algorithm. Using scanlines, the internal gaps are filled in.
  // Draws the stroke (outline) of a rounded rectangle by collecting pixels in a set first,
  // then drawing them all at once. Uses scanlines to avoid internal gaps in the stroke.
  drawRoundedRectStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
    strokeR, strokeG, strokeB, strokeA) {
    const halfStroke = strokeWidth / 2;
    let pos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
    let r = Math.round(Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2));

    // Create a set to collect all stroke pixels before drawing
    const strokePixels = new PixelSet(this.pixelRenderer);
    
    // Draw horizontal strokes (top and bottom edges)
    const horizontalStrokes = new ScanlineSpans();
    // Add spans for top edge
    for (let y = pos.y - halfStroke; y < pos.y + halfStroke; y++) {
      horizontalStrokes.addSpan(y, pos.x + r, pos.x + pos.w - r);
    }
    // Add spans for bottom edge
    for (let y = pos.y + pos.h - halfStroke; y < pos.y + pos.h + halfStroke; y++) {
      horizontalStrokes.addSpan(y, pos.x + r, pos.x + pos.w - r);
    }
    horizontalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);

    // Draw vertical strokes (left and right edges)
    const leftVerticalStrokes = new ScanlineSpans();
    const rightVerticalStrokes = new ScanlineSpans();
    
    for (let y = pos.y + r; y < pos.y + pos.h - r; y++) {
      // Add pixels for left edge
      for (let x = pos.x - halfStroke; x < pos.x + halfStroke; x++) {
        leftVerticalStrokes.addPixel(x, y);
      }
      // Add pixels for right edge
      for (let x = pos.x + pos.w - halfStroke; x < pos.x + pos.w + halfStroke; x++) {
        rightVerticalStrokes.addPixel(x, y);
      }
    }
    leftVerticalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);
    rightVerticalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);

    // Helper function to draw rounded corners using circular arcs
    const drawCornerSpans = (cx, cy, startAngle, endAngle) => {
      const cornerSpans = new ScanlineSpans();
      const angleStep = Math.PI / 180;  // 1 degree steps for smooth corners
      for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
        // Add pixels along the stroke width
        for (let t = -halfStroke; t < halfStroke; t ++) {
          const sr = r + t;  // Radius adjusted for stroke width
          const px = cx + sr * Math.cos(angle);
          const py = cy + sr * Math.sin(angle);
          cornerSpans.addPixel(Math.floor(px), Math.floor(py));
        }
      }
      cornerSpans.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);
    };

    // Draw all four corners with appropriate arc angles
    drawCornerSpans(pos.x + r, pos.y + r, Math.PI, Math.PI * 3/2);           // Top-left
    drawCornerSpans(pos.x + pos.w - r, pos.y + r, Math.PI * 3/2, Math.PI * 2); // Top-right
    drawCornerSpans(pos.x + pos.w - r, pos.y + pos.h - r, 0, Math.PI/2);     // Bottom-right
    drawCornerSpans(pos.x + r, pos.y + pos.h - r, Math.PI/2, Math.PI);       // Bottom-left

    // Finally, paint all collected stroke pixels to the screen
    strokePixels.paint();
  }

  drawRotatedRoundedRect(centerX, centerY, width, height, radius, rotation,
    strokeWidth, strokeR, strokeG, strokeB, strokeA,
    fillR, fillG, fillB, fillA) {
    
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Calculate corner centers (these stay fixed)
    const cornerCenters = [
      [-halfWidth + radius, -halfHeight + radius],
      [halfWidth - radius, -halfHeight + radius],
      [halfWidth - radius, halfHeight - radius],
      [-halfWidth + radius, halfHeight - radius]
    ].map(([x, y]) => ({
      x: centerX + x * cos - y * sin,
      y: centerY + x * sin + y * cos
    }));

    // calculate edge directions
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

    if (fillA > 0) {
      // 1. Draw the central rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX, centerY,
        width - 2 * radius, height - 2 * radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // 2. Draw the four side rectangles
      // Top rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX + (-radius * sin),
        centerY + (-height/2 + radius/2) * cos,
        width - 2 * radius, radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // Right rectangle 
      this.swRectRenderer.fillRotatedRect(
        centerX + (width/2 - radius/2) * cos,
        centerY + (width/2 - radius/2) * sin,
        radius, height - 2 * radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // Bottom rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX + (radius * sin),
        centerY + (height/2 - radius/2) * cos,
        width - 2 * radius, radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // Left rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX + (-width/2 + radius/2) * cos,
        centerY + (-width/2 + radius/2) * sin,
        radius, height - 2 * radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // 3. Fill corner arcs
      const rotationDegrees = rotation * 180 / Math.PI;
      cornerCenters.forEach((center, i) => {
        const baseAngles = [
          [180, 270],
          [270, 360],
          [0, 90],
          [90, 180]
        ][i];
        
        const startAngle = (baseAngles[0] + rotationDegrees) % 360;
        const endAngle = (baseAngles[1] + rotationDegrees) % 360;
        
        drawArcSWHelper(center.x, center.y, radius,
          startAngle, endAngle,
          fillR, fillG, fillB, fillA, true);
      });
    }

    if (strokeA > 0) {
      for (let i = 0; i < 4; i++) {
        const currentPoint = strokePoints[i];
        const nextPoint = strokePoints[(i + 1) % 4];
        
        this.lineRenderer.drawLineThick(
          currentPoint.end.x, currentPoint.end.y,
          nextPoint.start.x, nextPoint.start.y,
          strokeWidth, strokeR, strokeG, strokeB, strokeA
        );
      }

      const rotationDegrees = rotation * 180 / Math.PI;
      cornerCenters.forEach((center, i) => {
        const baseAngles = [
          [180, 270],
          [270, 360],
          [0, 90],
          [90, 180]
        ][i];
        
        const startAngle = (baseAngles[0] + rotationDegrees) % 360;
        const endAngle = (baseAngles[1] + rotationDegrees) % 360;
        
        drawArcSWHelper(center.x, center.y, radius,
          startAngle, endAngle,
          strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
      });
    }
  }
}/**
 * Class for performing various checks on the rendered images
 */
class RenderChecks {
  /**
   * Creates a new RenderChecks instance
   * @param {Object} test - The test object used for showing errors
   */
  constructor(test) {
    this.test = test;
  }

  /**
   * Checks if a stroke forms a continuous loop without holes
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The rendering context to analyze
   * @param {Object} extremes - The shape boundaries {leftX, rightX, topY, bottomY}
   * @param {boolean} horizontalScan - Whether to perform a horizontal (column-by-column) scan instead of vertical
   * @returns {boolean} True if the stroke is continuous, false if holes are found
   */
  checkStrokeContinuity(canvasCtxOfSwRender, extremes, horizontalScan = false) {
    // Get canvas dimensions and image data
    const canvas = canvasCtxOfSwRender.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasCtxOfSwRender.title || 'unknown');
    
    const imageData = canvasCtxOfSwRender.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Extract edges from extremes
    const { leftX, rightX, topY, bottomY } = extremes;
    
    // Function to check if a pixel is transparent (alpha = 0)
    const isTransparent = (idx) => data[idx + 3] === 0;
    
    // Track the pattern transitions as we scan
    let transitionPattern = [];
    let holeFound = false;
    let detailMessage = '';
    
    if (!horizontalScan) {
      // Vertical scan (row by row from top to bottom)
      this.scanVertically(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern);
    } else {
      // Horizontal scan (column by column from left to right)
      this.scanHorizontally(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern);
    }
    
    // Find any fragmented patterns that indicate holes
    for (const transition of transitionPattern) {
      if (transition.pattern === 'fragmented') {
        holeFound = true;
        const coord = horizontalScan ? `x=${transition.pos}` : `y=${transition.pos}`;
        detailMessage = `${horizontalScan ? 'Column' : 'Row'} ${coord} has ${transition.groupCount} disconnected pixel groups instead of 1 or 2`;
        break;
      }
    }
    
    // Validate the transition pattern - should follow this sequence:
    // 1. One or more 'solid' rows/cols (cap)
    // 2. Zero or more 'sides' rows/cols (if shape is large enough)
    // 3. One or more 'solid' rows/cols (cap)
    
    // The only valid patterns are:
    // - solid only (small shape)
    // - solid → sides → solid (normal shape)
    
    let validTransitionSequence = true;
    let currentState = 'start';
    const directionLabel = horizontalScan ? 'column' : 'row';
    
    for (let i = 0; i < transitionPattern.length; i++) {
      const { pattern, pos } = transitionPattern[i];
      
      switch (currentState) {
        case 'start':
          if (pattern === 'solid') {
            currentState = 'firstCap';
          } else if (pattern === 'sides') {
            // Missing first cap
            validTransitionSequence = false;
            detailMessage = `Missing first cap at ${directionLabel} ${pos}`;
          } else if (pattern === 'fragmented') {
            // Fragmented pattern not allowed
            validTransitionSequence = false;
            detailMessage = `Fragmented pattern at ${directionLabel} ${pos}`;
          }
          break;
          
        case 'firstCap':
          if (pattern === 'sides') {
            currentState = 'sides';
          } else if (pattern === 'fragmented') {
            // Fragmented pattern not allowed
            validTransitionSequence = false;
            detailMessage = `Fragmented pattern at ${directionLabel} ${pos}`;
          } else if (pattern === 'empty') {
            // Empty row/column not allowed here
            validTransitionSequence = false;
            detailMessage = `Unexpected empty ${directionLabel} at ${pos}`;
          }
          break;
          
        case 'sides':
          if (pattern === 'solid') {
            currentState = 'secondCap';
          } else if (pattern === 'fragmented') {
            // Fragmented pattern not allowed
            validTransitionSequence = false;
            detailMessage = `Fragmented pattern at ${directionLabel} ${pos}`;
          } else if (pattern === 'empty') {
            // Empty row/column not allowed here
            validTransitionSequence = false;
            detailMessage = `Unexpected empty ${directionLabel} at ${pos}`;
          }
          break;
          
        case 'secondCap':
          if (pattern !== 'solid') {
            // Only solid allowed in second cap
            validTransitionSequence = false;
            detailMessage = `Expected solid pattern for second cap, got ${pattern} at ${directionLabel} ${pos}`;
          }
          break;
      }
      
      if (!validTransitionSequence) {
        break;
      }
    }
    
    // Check final state - must end in firstCap (small shape) or secondCap (normal shape)
    if (validTransitionSequence && currentState !== 'firstCap' && currentState !== 'secondCap') {
      validTransitionSequence = false;
      detailMessage = 'Incomplete stroke pattern';
    }
    
    if (!validTransitionSequence || holeFound) {
      const rendererName = title ? title.split('-')[0] : 'Unknown';
      const scanType = horizontalScan ? 'horizontal' : 'vertical';
      const errorMessage = `${rendererName} Renderer: Found holes in stroke during ${scanType} scan! ${detailMessage}`;
      this.test.showError(errorMessage);
      return false;
    }
    
    return true;
  }
  
  /**
   * Scan vertically (row by row) and analyze pixel patterns
   * @private
   */
  scanVertically(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern) {
    // Scan each row from top to bottom
    for (let y = topY; y <= bottomY; y++) {
      // Track contiguous pixel groups in the current row
      let contiguousGroups = [];
      let currentGroup = null;
      
      // Scan this row from left to right
      for (let x = leftX; x <= rightX; x++) {
        const idx = (y * width + x) * 4;
        const isPixelTransparent = isTransparent(idx);
        
        if (!isPixelTransparent) {
          // Start a new group or extend current group
          if (currentGroup === null) {
            currentGroup = { startX: x, endX: x };
          } else {
            currentGroup.endX = x;
          }
        } else if (currentGroup !== null) {
          // End of a group
          contiguousGroups.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Add the last group if it exists
      if (currentGroup !== null) {
        contiguousGroups.push(currentGroup);
      }
      
      // Categorize the pattern for this row
      let rowPattern = '';
      if (contiguousGroups.length === 0) {
        rowPattern = 'empty';
      } else if (contiguousGroups.length === 1) {
        rowPattern = 'solid';
      } else if (contiguousGroups.length === 2) {
        rowPattern = 'sides';
      } else {
        rowPattern = 'fragmented';
      }
      
      // Add the pattern to our transition sequence
      if (transitionPattern.length === 0 || transitionPattern[transitionPattern.length - 1].pattern !== rowPattern) {
        transitionPattern.push({ pos: y, pattern: rowPattern, groupCount: contiguousGroups.length });
      }
    }
  }
  
  /**
   * Scan horizontally (column by column) and analyze pixel patterns
   * @private
   */
  scanHorizontally(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern) {
    // Scan each column from left to right
    for (let x = leftX; x <= rightX; x++) {
      // Track contiguous pixel groups in the current column
      let contiguousGroups = [];
      let currentGroup = null;
      
      // Scan this column from top to bottom
      for (let y = topY; y <= bottomY; y++) {
        const idx = (y * width + x) * 4;
        const isPixelTransparent = isTransparent(idx);
        
        if (!isPixelTransparent) {
          // Start a new group or extend current group
          if (currentGroup === null) {
            currentGroup = { startY: y, endY: y };
          } else {
            currentGroup.endY = y;
          }
        } else if (currentGroup !== null) {
          // End of a group
          contiguousGroups.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Add the last group if it exists
      if (currentGroup !== null) {
        contiguousGroups.push(currentGroup);
      }
      
      // Categorize the pattern for this column
      let colPattern = '';
      if (contiguousGroups.length === 0) {
        colPattern = 'empty';
      } else if (contiguousGroups.length === 1) {
        colPattern = 'solid';
      } else if (contiguousGroups.length === 2) {
        colPattern = 'sides';
      } else {
        colPattern = 'fragmented';
      }
      
      // Add the pattern to our transition sequence
      if (transitionPattern.length === 0 || transitionPattern[transitionPattern.length - 1].pattern !== colPattern) {
        transitionPattern.push({ pos: x, pattern: colPattern, groupCount: contiguousGroups.length });
      }
    }
  }

  /**
   * Checks the count of unique colors in a horizontal or vertical line through the middle of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @param {boolean} isRow - True to check a horizontal row, false to check a vertical column
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, isRow) {
    // Get the canvas width/height - handling both real canvas and our CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
    
    const data = imageData.data;
    const uniqueColors = new Set();
    
    if (isRow) {
      const middleY = Math.floor(height / 2);
      for(let x = 0; x < width; x++) {
        const i = (middleY * width + x) * 4;
        if(data[i+3] === 0) continue;
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    } else {
      const middleX = Math.floor(width / 2);
      for(let y = 0; y < height; y++) {
        const i = (y * width + middleX) * 4;
        if(data[i+3] === 0) continue;
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      let message = `Expected ${expectedColors} colors but found ${count} colors in middle ${isRow ? 'row' : 'column'} of ${title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.test.showError(message);
    }
    
    return count;
  }

  /**
   * Checks the count of unique colors in the middle horizontal row of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInMiddleRow(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    return this.checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, true);
  }

  /**
   * Checks the count of unique colors in the middle vertical column of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInMiddleColumn(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    return this.checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, false);
  }


  /**
   * Find the extremes (boundaries) of an image with an alpha tolerance
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number} alphaTolerance - Tolerance for alpha values (0-1)
   * @returns {Object|null} The extremes object with leftX, rightX, topY, bottomY or null if no qualifying pixels
   */
  findExtremesWithTolerance(canvasContextOfSwRendererOrCanvasRenderer, alphaTolerance = 0) {
    // Get canvas dimensions - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
    
    const data = imageData.data;
    
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    
    // Scan all pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3]/255 > alphaTolerance) {  // If pixel is not fully transparent (or very close, depending on alphaTolerance)
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // If no qualifying pixels were found, return null
    if (minX === width || maxX === -1 || minY === height || maxY === -1) {
      return null;
    }
    
    return { leftX: minX, rightX: maxX, topY: minY, bottomY: maxY };
  }
  
  /**
   * Check if the extremes match the expected values for both renderers
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {Object} expectedExtremes - The expected extremes
   * @param {number} alphaTolerance - Tolerance for alpha values (0-1)
   * @returns {string} Results of the check
   */
  checkExtremes(canvasCtxOfSwRender, canvasCtxOfCanvasRender, expectedExtremes, alphaTolerance = 0) {
    // Build an array of contexts to check, always including SW renderer
    // Only include Canvas renderer if it's provided (not null/undefined)
    const contexts = [
      { name: 'SW Renderer', context: canvasCtxOfSwRender }
    ];
    
    // Add Canvas renderer only if it exists (handles Node environment case)
    if (canvasCtxOfCanvasRender) {
      contexts.push({ name: 'Canvas Renderer', context: canvasCtxOfCanvasRender });
    }
    
    const results = [];
    const errors = [];
    
    for (const { name, context } of contexts) {
      const actualExtremes = this.findExtremesWithTolerance(context, alphaTolerance);
      
      // If no qualifying pixels were found
      if (!actualExtremes) {
        const message = `${name}: No non-transparent pixels found`;
        results.push(message);
        this.test.showError(message);
        continue;
      }
      
      // Check against expected extremes if provided
      if (expectedExtremes) {
        if (actualExtremes.leftX !== expectedExtremes.leftX) {
          const message = `${name}: Left extreme expected at ${expectedExtremes.leftX}, found at ${actualExtremes.leftX}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
        if (actualExtremes.rightX !== expectedExtremes.rightX) {
          const message = `${name}: Right extreme expected at ${expectedExtremes.rightX}, found at ${actualExtremes.rightX}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
        if (actualExtremes.topY !== expectedExtremes.topY) {
          const message = `${name}: Top extreme expected at ${expectedExtremes.topY}, found at ${actualExtremes.topY}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
        if (actualExtremes.bottomY !== expectedExtremes.bottomY) {
          const message = `${name}: Bottom extreme expected at ${expectedExtremes.bottomY}, found at ${actualExtremes.bottomY}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
      }
      
      results.push(`${name}: left=${actualExtremes.leftX}, right=${actualExtremes.rightX}, top=${actualExtremes.topY}, bottom=${actualExtremes.bottomY}`);
    }
    
    // For Node environment compatibility, add error count to result
    results.errors = errors.length;
    
    return results.join('\n');
  }
  
  /**
   * Checks for gaps in the edges of a shape
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {Object} extremes - The shape boundaries {leftX, rightX, topY, bottomY}
   * @param {boolean} isStroke - Whether checking stroke edges (true) or fill edges (false)
   * @returns {string} Results of the gap check
   */
  checkEdgeGaps(canvasContextOfSwRendererOrCanvasRenderer, extremes, isStroke) {
    // Get canvas dimensions and title - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, canvas.height);
      
    const data = imageData.data;
    
    // Extract edges from extremes
    const { leftX, rightX, topY, bottomY } = extremes;
    
    // Function to check for transparent pixels - a pixel is transparent if alpha = 0
    const isTransparent = (idx) => data[idx + 3] === 0;
    
    // Results for tracking gaps
    const results = { gaps: 0, details: [] };
    
    // Find first and last non-transparent pixels in top row
    let topFirstFilled = null, topLastFilled = null;
    
    for (let x = leftX; x <= rightX; x++) {
      const i = (topY * width + x) * 4;
      if (!isTransparent(i)) {
        topFirstFilled = topFirstFilled === null ? x : topFirstFilled;
        topLastFilled = x;
      }
    }
    
    // Check for gaps in top row if we found filled pixels
    if (topFirstFilled !== null) {
      for (let x = topFirstFilled; x <= topLastFilled; x++) {
        const i = (topY * width + x) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at top row, x=${x}`);
        }
      }
    }
    
    // Find first and last non-transparent pixels in bottom row
    let bottomFirstFilled = null, bottomLastFilled = null;
    
    for (let x = leftX; x <= rightX; x++) {
      const i = (bottomY * width + x) * 4;
      if (!isTransparent(i)) {
        bottomFirstFilled = bottomFirstFilled === null ? x : bottomFirstFilled;
        bottomLastFilled = x;
      }
    }
    
    // Check for gaps in bottom row if we found filled pixels
    if (bottomFirstFilled !== null) {
      for (let x = bottomFirstFilled; x <= bottomLastFilled; x++) {
        const i = (bottomY * width + x) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at bottom row, x=${x}`);
        }
      }
    }
    
    // Find first and last non-transparent pixels in left column
    let leftFirstFilled = null, leftLastFilled = null;
    
    for (let y = topY; y <= bottomY; y++) {
      const i = (y * width + leftX) * 4;
      if (!isTransparent(i)) {
        leftFirstFilled = leftFirstFilled === null ? y : leftFirstFilled;
        leftLastFilled = y;
      }
    }
    
    // Check for gaps in left column if we found filled pixels
    if (leftFirstFilled !== null) {
      for (let y = leftFirstFilled; y <= leftLastFilled; y++) {
        const i = (y * width + leftX) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at left column, y=${y}`);
        }
      }
    }
    
    // Find first and last non-transparent pixels in right column
    let rightFirstFilled = null, rightLastFilled = null;
    
    for (let y = topY; y <= bottomY; y++) {
      const i = (y * width + rightX) * 4;
      if (!isTransparent(i)) {
        rightFirstFilled = rightFirstFilled === null ? y : rightFirstFilled;
        rightLastFilled = y;
      }
    }
    
    // Check for gaps in right column if we found filled pixels
    if (rightFirstFilled !== null) {
      for (let y = rightFirstFilled; y <= rightLastFilled; y++) {
        const i = (y * width + rightX) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at right column, y=${y}`);
        }
      }
    }
    
    // Extract renderer name from title or use a default
    const rendererName = title ? title.split('-')[0] : 'Unknown';
    
    // Generate result message
    let resultMsg = `${rendererName} Renderer: `;
    
    if (results.gaps === 0) {
      resultMsg += `No gaps found in ${isStroke ? 'stroke' : 'fill'} edges!`;
    } else {
      resultMsg += `Found ${results.gaps} gaps in ${isStroke ? 'stroke' : 'fill'} edges: ${results.details.join(', ')}`;
      
      // Only show error for software renderer (this should always be true as we only call with SW renderer)
      this.test.showError(
        `Found ${results.gaps} gaps in SW renderer ${isStroke ? 'stroke' : 'fill'} edges. ` +
        `This indicates missing pixels at circle boundaries!`
      );
    }
    
    return resultMsg;
  }
  
  /**
   * Check edges of a shape for gaps. This is particularly used for circles, where some rendering
   * artefacts could happen where there would be holes in the top/bottom/left/right edges.
   * Note that this check works regardless of the fill presence and/or width or color.
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {boolean} isStroke - Whether to check stroke edges (true) or fill edges (false)
   * @returns {string} Results of the check
   */
  checkEdgesForGaps(canvasCtxOfSwRender, canvasCtxOfCanvasRender, isStroke = false) {
    // Calculate extremes for the shape by scanning the canvas
    const calculatedExtremes = this.findExtremesWithTolerance(canvasCtxOfSwRender, 0);
    
    // If no non-transparent pixels were found, return error
    if (!calculatedExtremes) {
      const errorMsg = "No non-transparent pixels found, cannot check for gaps";
      this.test.showError(errorMsg);
      return errorMsg;
    }
    
    // Check only the software renderer for gaps
    const swResults = this.checkEdgeGaps(canvasCtxOfSwRender, calculatedExtremes, isStroke);
    return `Edge gap check result (${isStroke ? 'stroke' : 'fill'}): ${swResults}`;
  }
  
  /**
   * Check if a stroke has no holes. Note that this only works for a) shapes that have a starting cap,
   * two sides, and an ending cap (like circles, rectangles, rounded rectangles, etc), and
   * b) shapes with no fill (or with a fill that is the same color as the stroke).
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {Object} options - Options for the check
   * @param {boolean} options.verticalScan - Whether to perform a vertical scan (default: true)
   * @param {boolean} options.horizontalScan - Whether to perform a horizontal scan (default: true)
   * @returns {string} Results of the check
   */
  checkStrokeForHoles(canvasCtxOfSwRender, canvasCtxOfCanvasRender, options = {}) {
    // Default options
    const { 
      verticalScan = true, 
      horizontalScan = true 
    } = options;
    
    // Calculate extremes for the shape by scanning the canvas
    const calculatedExtremes = this.findExtremesWithTolerance(canvasCtxOfSwRender, 0);
    
    // If no non-transparent pixels were found, return error
    if (!calculatedExtremes) {
      const errorMsg = "No non-transparent pixels found, cannot check for stroke holes";
      this.test.showError(errorMsg);
      return errorMsg;
    }
    
    const rendererName = canvasCtxOfSwRender.canvas.title ? 
      canvasCtxOfSwRender.canvas.title.split('-')[0] : 'SW';
    
    let isStrokeContinuous = true;
    let resultMsgs = [];
    
    // Perform vertical scan if requested
    if (verticalScan) {
      const isVerticalContinuous = this.checkStrokeContinuity(canvasCtxOfSwRender, calculatedExtremes, false);
      isStrokeContinuous = isStrokeContinuous && isVerticalContinuous;
      
      if (!isVerticalContinuous) {
        resultMsgs.push(`Vertical scan: Found holes`);
      }
    }
    
    // Perform horizontal scan if requested
    if (horizontalScan) {
      const isHorizontalContinuous = this.checkStrokeContinuity(canvasCtxOfSwRender, calculatedExtremes, true);
      isStrokeContinuous = isStrokeContinuous && isHorizontalContinuous;
      
      if (!isHorizontalContinuous) {
        resultMsgs.push(`Horizontal scan: Found holes`);
      }
    }
    
    // Determine overall result message
    const resultMsg = isStrokeContinuous ? 
      `${rendererName} Renderer: Stroke is continuous with no holes` : 
      `${rendererName} Renderer: Stroke has holes or discontinuities (${resultMsgs.join(', ')})`;
      
    return `Stroke continuity check result: ${resultMsg}`;
  }

  /**
   * Counts the number of unique colors in the entire image
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInImage(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    // Get canvas dimensions and title - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
      
    const data = imageData.data;
    const uniqueColors = new Set();
    
    // Check all pixels in the image
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i+3] === 0) continue; // Skip transparent pixels
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      let message = `Expected ${expectedColors} unique colors but found ${count} unique colors in ${title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.test.showError(message);
    }
    
    return count;
  }

  /**
   * Checks for speckles (isolated pixels with different colors from their matching neighbors)
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @returns {number} The number of speckles found
   */
  checkForSpeckles(canvasContextOfSwRendererOrCanvasRenderer) {
    // Get canvas dimensions and title - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
    
    const data = imageData.data;
    
    let speckleCount = 0;
    let firstSpeckleX = -1;
    let firstSpeckleY = -1;
    
    // Check each pixel (except edges)
    for (let y = 1; y < height - 1; y++) {  // Changed to skip first and last rows
      for (let x = 1; x < width - 1; x++) {
        const currentIdx = (y * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const topIdx = ((y - 1) * width + x) * 4;     // Added top neighbor check
        const bottomIdx = ((y + 1) * width + x) * 4;  // Added bottom neighbor check
                
        // Check if horizontal neighbors match
        const horizontalMatch = 
          data[leftIdx] === data[rightIdx] &&
          data[leftIdx + 1] === data[rightIdx + 1] &&
          data[leftIdx + 2] === data[rightIdx + 2] &&
          data[leftIdx + 3] === data[rightIdx + 3];
        
        // Check if vertical neighbors match
        const verticalMatch = 
          data[topIdx] === data[bottomIdx] &&
          data[topIdx + 1] === data[bottomIdx + 1] &&
          data[topIdx + 2] === data[bottomIdx + 2] &&
          data[topIdx + 3] === data[bottomIdx + 3];
        
        // Check if current pixel is different from neighbors
        const differentFromHorizontal = 
          data[currentIdx] !== data[leftIdx] ||
          data[currentIdx + 1] !== data[leftIdx + 1] ||
          data[currentIdx + 2] !== data[leftIdx + 2] ||
          data[currentIdx + 3] !== data[leftIdx + 3];
          
        const differentFromVertical = 
          data[currentIdx] !== data[topIdx] ||
          data[currentIdx + 1] !== data[topIdx + 1] ||
          data[currentIdx + 2] !== data[topIdx + 2] ||
          data[currentIdx + 3] !== data[topIdx + 3];
        
        // Count as speckle if either horizontal or vertical neighbors match but current pixel differs
        if ((horizontalMatch && differentFromHorizontal) || 
            (verticalMatch && differentFromVertical)) {
          speckleCount++;
          if (firstSpeckleX === -1) {
            firstSpeckleX = x;
            firstSpeckleY = y;
          }
        }
      }
    }
    
    if (speckleCount > 0) {
      const specklePixel = (firstSpeckleY * width + firstSpeckleX) * 4;
      this.test.showError(
        `Found ${speckleCount} speckle${speckleCount === 1 ? '' : 's'} in ${title} ` +
        `(single pixels with different color from matching neighbors). First speckle at (${firstSpeckleX}, ${firstSpeckleY}) ` +
        `with color rgba(${data[specklePixel]}, ${data[specklePixel + 1]}, ${data[specklePixel + 2]}, ${data[specklePixel + 3]})`
      );
    }
    
    return speckleCount;
  }

  /**
   * Compares two renderings with color and alpha thresholds
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {number} RGBThreshold - Maximum allowed difference in RGB values
   * @param {number} alphaThreshold - Maximum allowed difference in alpha values
   * @returns {string} Results of the test
   */
  compareWithThreshold(canvasCtxOfSwRender, canvasCtxOfCanvasRender, RGBThreshold, alphaThreshold) {
    const swImageData = canvasCtxOfSwRender.getImageData(0, 0, 
      canvasCtxOfSwRender.canvas.width, 
      canvasCtxOfSwRender.canvas.height);
      
    const canvasImageData = canvasCtxOfCanvasRender.getImageData(0, 0, 
      canvasCtxOfCanvasRender.canvas.width, 
      canvasCtxOfCanvasRender.canvas.height);
      
    const swData = swImageData.data;
    const canvasData = canvasImageData.data;
    const width = canvasCtxOfSwRender.canvas.width;
    const height = canvasCtxOfSwRender.canvas.height;
    
    let differenceCount = 0;
    let firstDiffX = -1;
    let firstDiffY = -1;
    
    // Compare each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Check if the color components are within the threshold
        const rDiff = Math.abs(swData[idx] - canvasData[idx]);
        const gDiff = Math.abs(swData[idx + 1] - canvasData[idx + 1]);
        const bDiff = Math.abs(swData[idx + 2] - canvasData[idx + 2]);
        const aDiff = Math.abs(swData[idx + 3] - canvasData[idx + 3]);
        
        if (rDiff > RGBThreshold || gDiff > RGBThreshold || bDiff > RGBThreshold || aDiff > alphaThreshold) {
          differenceCount++;
          
          // Record first difference position
          if (firstDiffX === -1) {
            firstDiffX = x;
            firstDiffY = y;
          }
        }
      }
    }
    
    if (differenceCount > 0) {
      // Get the color values at the first difference point
      const idx = (firstDiffY * width + firstDiffX) * 4;
      const swR = swData[idx];
      const swG = swData[idx + 1];
      const swB = swData[idx + 2];
      const swA = swData[idx + 3];
      
      const canvasR = canvasData[idx];
      const canvasG = canvasData[idx + 1];
      const canvasB = canvasData[idx + 2];
      const canvasA = canvasData[idx + 3];
      
      // Calculate the differences
      const rDiff = Math.abs(swR - canvasR);
      const gDiff = Math.abs(swG - canvasG);
      const bDiff = Math.abs(swB - canvasB);
      const aDiff = Math.abs(swA - canvasA);
      
      // Highlight which component(s) exceeds the threshold
      const rHighlight = rDiff > RGBThreshold ? `<strong>${rDiff}</strong>` : rDiff;
      const gHighlight = gDiff > RGBThreshold ? `<strong>${gDiff}</strong>` : gDiff;
      const bHighlight = bDiff > RGBThreshold ? `<strong>${bDiff}</strong>` : bDiff;
      const aHighlight = aDiff > alphaThreshold ? `<strong>${aDiff}</strong>` : aDiff;
      
      const message = `Found ${differenceCount} pixels with differences exceeding thresholds (RGB: ${RGBThreshold}, Alpha: ${alphaThreshold}). // ` +
                      `First difference at (${firstDiffX}, ${firstDiffY}): ` +
                      `SW Renderer: rgba(${swR}, ${swG}, ${swB}, ${swA}) // ` +
                      `Canvas Renderer: rgba(${canvasR}, ${canvasG}, ${canvasB}, ${canvasA}) // ` +
                      `Difference: rgba(${rHighlight}, ${gHighlight}, ${bHighlight}, ${aHighlight})`;
      
      this.test.showError(message);
      return message;
    }
    
    return `All pixels are within thresholds (RGB: ${RGBThreshold}, Alpha: ${alphaThreshold})`;
  }
}
const renderTestWidth = 600;
const renderTestHeight = 600;

class RenderTest {
  static sections = [];
  static GRID_COLUMNS = 11;
  static GRID_ROWS = 21;
  static registry = {}; // Central registry for all tests

  constructor(id, title, buildShapesFn, canvasCodeFn = null, functionToRunAllChecks = null, testDescription = '') {
    // Environment detection
    this.isNode = typeof window === 'undefined';
    
    // Common initialization - works in both environments
    this.width = renderTestWidth;
    this.height = renderTestHeight;

    // Create the frameeBuffer and two views for it
    this.frameBufferUint8ClampedView = new Uint8ClampedArray(this.width * this.height * 4);
    // this view show optimise for when we deal with pixel values all together rather than r,g,b,a separately
    this.frameBufferUint32View = new Uint32Array(this.frameBufferUint8ClampedView.buffer);

    this.errorCount = 0; // Initialize error count
    this.errors = []; // Track error messages
    this.verbose = false; // Verbose logging flag for Node.js
    
    this.id = id;
    this.title = title;
    this.shapes = [];
    this.functionToRunAllChecks = functionToRunAllChecks;
    this.canvasCodeFn = canvasCodeFn;
    this.buildShapesFn = buildShapesFn;
    
    // Auto-register this test
    RenderTest.registry[id] = this;

    if (this.isNode) {
      // Node.js initialization path
      this.setupForNode();
    } else {
      // Browser initialization path
      this.setupForBrowser(id, title, buildShapesFn, canvasCodeFn, testDescription);
      // Only add to sections in browser environment
      RenderTest.sections.push({ id, title });
    }

    // Initialize RenderChecks in both environments
    this.renderChecks = new RenderChecks(this);

    // If we're not in a Node environment, render the initial scene
    if (!this.isNode) {
      this.render(buildShapesFn, canvasCodeFn);
    }
  }

  setupForNode() {
    // Create a mock canvas object for the SW renderer
    this.canvasOfSwRender = {
      width: this.width,
      height: this.height,
      title: `${this.id}-sw`,
    };
    
    // Set up CrispSwContext for Node
    if (this.canvasCodeFn) {
      this.crispSwCanvas = new CrispSwCanvas(this.width, this.height);
      this.crispSwCtx = this.crispSwCanvas.getContext('2d');
      this.canvasCtxOfSwRender = this.crispSwCtx;
    } else {
      // Create a properly extended mock context for Node.js that supports all checks
      this.canvasCtxOfSwRender = {
        canvas: this.canvasOfSwRender, // Important for checks that use canvas.width/height
        getImageData: (x, y, width, height) => {
          return new ImageData(this.frameBufferUint8ClampedView, this.width, this.height);
        }
      };
    }
    
    // Set up flipState as a no-op for Node
    this.flipState = true;
  };

  setupForBrowser(id, title, buildShapesFn, canvasCodeFn, testDescription) {
    this.flipState = true;
    
    // Helper function to create centered labels
    const createLabel = (text) => {
      const label = document.createElement('div');
      label.textContent = text;
      label.className = 'canvas-label';
      return label;
    };

    // Create container with anchor
    this.container = document.createElement('div');
    this.container.className = 'test-container';
    this.container.id = id;
    
    // Add divider
    const divider = document.createElement('hr');
    this.container.appendChild(divider);
    
    // Add top link
    const topLink = document.createElement('div');
    topLink.className = 'top-link-container';
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = '\u2191 top';  // Unicode escape for ↑
    link.className = 'top-link';
    topLink.appendChild(link);
    this.container.appendChild(topLink);
    
    // Add title
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.className = 'test-title';
    this.container.appendChild(titleElement);
    
    // Add description if provided
    if (testDescription) {
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = testDescription;
      descriptionElement.className = 'test-description';
      this.container.appendChild(descriptionElement);
    }
    
    // Create canvases
    this.canvasOfSwRender = this.createCanvas('sw');
    this.canvasOfCanvasRender = this.createCanvas('canvas');
    this.canvasOfComparison = this.createCanvas('display');
    
    // Add mouse event listeners for inspection
    this.canvasOfSwRender.addEventListener('mousemove', (e) => this.handleMouseMove(e, this.canvasOfSwRender));
    this.canvasOfCanvasRender.addEventListener('mousemove', (e) => this.handleMouseMove(e, this.canvasOfCanvasRender));
    this.canvasOfSwRender.addEventListener('mouseout', () => this.handleMouseOut());
    this.canvasOfCanvasRender.addEventListener('mouseout', () => this.handleMouseOut());
    
    // Set cursor style
    this.canvasOfSwRender.style.cursor = 'crosshair';
    this.canvasOfCanvasRender.style.cursor = 'crosshair';
    
    // Create wrapper divs and hash containers
    this.swWrapper = document.createElement('div');
    this.swWrapper.className = 'canvas-wrapper';
    this.canvasWrapper = document.createElement('div');
    this.canvasWrapper.className = 'canvas-wrapper';
    this.displayWrapper = document.createElement('div');
    this.displayWrapper.className = 'canvas-wrapper';
    
    // Create labels
    this.swLabel = createLabel('Software Renderer');
    this.canvasLabel = createLabel('HTML5 Canvas');

    // Create label containers for the display canvas
    this.displayLabelContainer = document.createElement('div');
    this.displayLabelContainer.className = 'display-label-container';

    // Label for alternating view
    this.displayAltLabel = createLabel('Alternating View (SW)'); // Initial state
    this.displayLabelContainer.appendChild(this.displayAltLabel);

    // Container and labels for magnifier view
    this.displayMagContainer = document.createElement('div');
    this.displayMagContainer.className = 'magnifier-label-container';
    this.displayMagContainer.style.display = 'none'; // Initially hidden

    this.displayMagSwLabel = createLabel('Magnified SW');
    this.displayMagCanvasLabel = createLabel('Magnified Canvas');
    this.displayMagContainer.appendChild(this.displayMagSwLabel);
    this.displayMagContainer.appendChild(this.displayMagCanvasLabel);

    this.displayLabelContainer.appendChild(this.displayMagContainer);

    // Create hash containers
    this.swHashContainer = document.createElement('div');
    this.swHashContainer.className = 'hash-container';
    
    this.canvasHashContainer = document.createElement('div');
    this.canvasHashContainer.className = 'hash-container';
    
    // Add canvases and hashes to their wrappers
    this.swWrapper.appendChild(this.swLabel); // Add SW label
    this.swWrapper.appendChild(this.canvasOfSwRender);
    this.swWrapper.appendChild(this.swHashContainer);
    
    this.canvasWrapper.appendChild(this.canvasLabel); // Add Canvas label
    this.canvasWrapper.appendChild(this.canvasOfCanvasRender);
    this.canvasWrapper.appendChild(this.canvasHashContainer);
    
    this.displayWrapper.appendChild(this.displayLabelContainer); // Add display label container
    this.displayWrapper.appendChild(this.canvasOfComparison);
    
    // Add wrappers to container
    this.container.appendChild(this.swWrapper);
    this.container.appendChild(this.canvasWrapper);
    this.container.appendChild(this.displayWrapper);
    
    // Get contexts
    this.canvasCtxOfSwRender = this.canvasOfSwRender.getContext('2d');
    this.canvasCtxOfCanvasRender = this.canvasOfCanvasRender.getContext('2d');
    this.canvasCtxOfComparison = this.canvasOfComparison.getContext('2d');
    
    // Create outer container for counter and buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '20px';
    
    // Create counter container
    const counterContainer = document.createElement('div');
    
    // Add current iteration label
    const currentLabel = document.createElement('label');
    currentLabel.textContent = 'Current Iteration #1 | ';
    currentLabel.style.marginRight = '10px';
    this.currentLabel = currentLabel;  // Store reference to update it later
    counterContainer.appendChild(currentLabel);
    
    const counterLabel = document.createElement('label');
    counterLabel.textContent = 'Next iteration #: ';
    counterContainer.appendChild(counterLabel);
    
    this.iterationCounter = document.createElement('input');
    this.iterationCounter.type = 'text';
    this.iterationCounter.value = '1';
    this.iterationCounter.style.width = '70px';
    this.iterationCounter.style.marginLeft = '5px';
    counterContainer.appendChild(this.iterationCounter);
    
    controlsContainer.appendChild(counterContainer);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';
    
    // Add buttons to button container
    const runButton = document.createElement('button');
    runButton.textContent = '1 iteration';
    runButton.onclick = () => this.render(buildShapesFn, canvasCodeFn);
    runButton.className = 'action-button';
    
    // Add run 10 iterations button
    const run10Button = document.createElement('button');
    run10Button.textContent = '10 iterations';
    run10Button.onclick = () => this.runMultipleIterations(10);
    run10Button.className = 'action-button';

    // Add run 100 iterations button
    const run100Button = document.createElement('button');
    run100Button.textContent = '100 iterations';
    run100Button.onclick = () => this.runMultipleIterations(100);
    run100Button.className = 'action-button';

    // Add a button to collect defects on 1000 iterations
    const run1000Button = document.createElement('button');
    run1000Button.textContent = 'Collect defects / 1k iterations';
    run1000Button.onclick = () => this.runMultipleIterations(1000, false);
    run1000Button.className = 'action-button';

    // Add flip button last
    const flipButton = document.createElement('button');
    flipButton.textContent = 'Flip alternating view';
    flipButton.onclick = () => this.flip();
    flipButton.className = 'action-button';
    
    buttonContainer.appendChild(runButton);
    buttonContainer.appendChild(run10Button);
    buttonContainer.appendChild(run100Button);
    buttonContainer.appendChild(run1000Button);
    buttonContainer.appendChild(flipButton);
    controlsContainer.appendChild(buttonContainer);
    
    this.container.appendChild(controlsContainer);
    
    // Add a container for the log
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'log-container';
    this.container.appendChild(this.logContainer);

    // Add checks container
    this.checksContainer = document.createElement('div');
    this.checksContainer.className = 'checks-container';
    this.container.appendChild(this.checksContainer);
    
    // Add errors container
    this.errorsContainer = document.createElement('div');
    this.errorsContainer.className = 'errors-container';
    this.errorsContainer.style.color = 'red';
    this.container.appendChild(this.errorsContainer);
    
    document.body.appendChild(this.container);

    // Add CrispSwCanvas instance if we have a canvasCodeFn
    if (canvasCodeFn) {
        this.crispSwCanvas = new CrispSwCanvas(this.width, this.height);
        this.crispSwCtx = this.crispSwCanvas.getContext('2d');
    }

    // Add required CSS
    const style = document.createElement('style');
    style.textContent = `
      .canvas-wrapper {
        display: inline-block;
        vertical-align: top;
        text-align: center; /* Center content */
        margin-right: 10px; /* Add some space between wrappers */
      }
      .canvas-label {
        font-size: 12px;
        color: #555;
        margin-bottom: 3px;
        font-weight: bold;
      }
      .display-label-container {
        height: 18px; /* Allocate space for the label */
        margin-bottom: 3px;
      }
       .magnifier-label-container {
        display: flex; /* Use flexbox for side-by-side labels */
        justify-content: space-around; /* Distribute space */
        width: 100%;
      }
      .magnifier-label-container .canvas-label {
         flex-basis: 50%; /* Each label takes half the width */
         text-align: center;
      }
      .hash-container {
        font-family: monospace;
        font-size: 12px;
        margin: -5px 0 10px 10px;
        color: #666;
        background: white;
        padding: 2px 5px;
        display: block;
        border-radius: 3px;
        width: fit-content;
      }
    `;
    document.head.appendChild(style);
  }

  createCanvas(name) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.className = 'test-canvas';
    canvas.title = `${this.id}-${name}`;
    return canvas;
  }

  clearFrameBuffer() {
    this.frameBufferUint8ClampedView.fill(0);
  }

  updateSWRenderOutput() {
    const imageData = new ImageData(this.frameBufferUint8ClampedView, this.width, this.height);
    this.canvasCtxOfSwRender.putImageData(imageData, 0, 0);
    if (this.canvasCtxOfSwRender.getHashString) this.updateHashes();
  }

  drawSceneCanvas() {
    this.canvasCtxOfCanvasRender.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtxOfCanvasRender.clearRect(0, 0, this.canvasOfCanvasRender.width, this.canvasOfCanvasRender.height);
    drawShapesImpl(this.shapes, true, this.canvasCtxOfCanvasRender);
    if (this.canvasCtxOfSwRender.getHashString) this.updateHashes();
  }

  drawSceneSW() {
    this.clearFrameBuffer();
    drawShapesImpl(this.shapes, false, null, this.frameBufferUint8ClampedView, this.frameBufferUint32View);
  }

  flip() {
    this.flipState = !this.flipState;
    this.updateFlipOutput();
  }

  updateFlipOutput() {
    this.canvasCtxOfComparison.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtxOfComparison.clearRect(0, 0, this.canvasOfComparison.width, this.canvasOfComparison.height);
    
    if (this.flipState) {
      this.canvasCtxOfComparison.drawImage(this.canvasOfSwRender, 0, 0);
      this.displayAltLabel.textContent = 'Alternating View (SW)'; // Update label text
    } else {
      this.canvasCtxOfComparison.drawImage(this.canvasOfCanvasRender, 0, 0);
      this.displayAltLabel.textContent = 'Alternating View (Canvas)'; // Update label text
    }

    // Ensure correct label visibility for alternating view
    this.displayAltLabel.style.display = 'block';
    this.displayMagContainer.style.display = 'none';
  }

  showError(message) {
    // Common error tracking used in both environments
    if (this.errorCount === undefined) {
      this.errorCount = 0;
    }
    this.errorCount++;
    
    if (!this.errors) {
      this.errors = [];
    }
    this.errors.push(message);
    
    // In Node environment, only log the error if verbose
    if (this.isNode) {
      if (this.verbose) {
        console.error(`ERROR: ${message}`);
      }
      return;
    }
    
    // Browser-specific UI handling
    this.showErrorInBrowser(message);
  }
  
  // Separated browser-specific UI handling into its own method
  showErrorInBrowser(message) {
    // Create and add clear errors button and error count display if not already present
    if (!this.clearErrorsButton) {
      // Create error count element
      this.errorCountDisplay = document.createElement('div');
      this.errorCountDisplay.className = 'error-count';
      this.errorCountDisplay.style.fontWeight = 'bold';
      this.errorCountDisplay.style.marginTop = '10px';
      this.errorCountDisplay.style.marginBottom = '5px';
      this.updateErrorCountDisplay();
      
      // Create clear button
      this.clearErrorsButton = document.createElement('button');
      this.clearErrorsButton.textContent = 'Clear Errors';
      this.clearErrorsButton.className = 'action-button';
      this.clearErrorsButton.onclick = () => this.clearErrors();
      
      // Add elements to container
      this.errorsContainer.appendChild(document.createElement('br'));
      this.errorsContainer.appendChild(this.errorCountDisplay);
      this.errorsContainer.appendChild(this.clearErrorsButton);
    } else {
      // Update the error count display
      this.updateErrorCountDisplay();
    }

    // Get the current iteration number from the label
    const currentIterationNum = this.currentLabel ? 
      this.currentLabel.textContent.match(/Current Iteration #(\d+)/) ?
      parseInt(this.currentLabel.textContent.match(/Current Iteration #(\d+)/)[1]) : 1 : 1;
    
    // Prefix the message with the iteration number
    const prefixedMessage = `Iteration #${currentIterationNum}: ${message}`;
    
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = prefixedMessage; // Using innerHTML to preserve HTML formatting
    errorMessage.className = 'error-message';
    errorMessage.dataset.iterationNum = currentIterationNum;
    
    // Insert at the appropriate position - either after the last error from this iteration
    // or at the top of the errors container
    this.errorsContainer.insertBefore(errorMessage, this.errorCountDisplay);
    
    // Save this as the first error for this iteration if it's the first
    if (!this.firstErrorOfCurrentIteration) {
      this.firstErrorOfCurrentIteration = errorMessage;
    }
  }

  updateErrorCountDisplay() {
    if (this.errorCountDisplay) {
      this.errorCountDisplay.textContent = `Error count: ${this.errorCount}`;
    }
  }
  
  logSceneContents() {
    console.log("Attempting to log scene contents");
    
    // Mark that we've logged scene contents for this iteration
    this.sceneLoggedForCurrentIteration = true;
    
    try {
      if (this.shapes && this.shapes.length > 0) {
        // Log to console for debugging
        console.log("Scene contents when errors occurred:", JSON.stringify(this.shapes, null, 2));
        
        // Get the current iteration number
        const currentIterationNum = this.currentLabel ? 
          this.currentLabel.textContent.match(/Current Iteration #(\d+)/) ?
          parseInt(this.currentLabel.textContent.match(/Current Iteration #(\d+)/)[1]) : 1 : 1;
        
        // Create an easy-to-read scene content message
        let sceneMessage = `Scene Contents for Iteration #${currentIterationNum}:`;
        
        // Format the shape data in a more readable way
        this.shapes.forEach((shape, index) => {
          sceneMessage += `\n\n--- Shape ${index} ---\n`;
          
          // Handle different shape types with specific formatting
          if (shape.type === 'circle') {
            sceneMessage += `Type: Circle\n`;
            sceneMessage += `Center: (${shape.center.x}, ${shape.center.y})\n`;
            sceneMessage += `Radius: ${shape.radius}\n`;
            
            if (shape.strokeWidth) {
              sceneMessage += `Stroke Width: ${shape.strokeWidth}\n`;
              sceneMessage += `Stroke Color: rgba(${shape.strokeColor.r}, ${shape.strokeColor.g}, ${shape.strokeColor.b}, ${shape.strokeColor.a})\n`;
            }
            
            sceneMessage += `Fill Color: rgba(${shape.fillColor.r}, ${shape.fillColor.g}, ${shape.fillColor.b}, ${shape.fillColor.a})`;
          } else {
            // For other shape types, use more compact JSON formatting
            const formattedShape = JSON.stringify(shape, null, 2)
              .replace(/"([^"]+)":/g, '$1:') // Remove quotes around property names
              .replace(/[{},]/g, ''); // Remove braces and commas
            
            sceneMessage += formattedShape;
          }
        });
        
        // Create a visually distinct scene contents container
        const sceneContentDiv = document.createElement('div');
        sceneContentDiv.style.color = '#0066cc';
        sceneContentDiv.style.whiteSpace = 'pre-wrap';
        sceneContentDiv.style.fontFamily = 'monospace';
        sceneContentDiv.style.border = '1px solid #0066cc';
        sceneContentDiv.style.borderRadius = '4px';
        sceneContentDiv.style.backgroundColor = '#f0f8ff';
        sceneContentDiv.style.padding = '10px';
        sceneContentDiv.style.margin = '15px 0';
        sceneContentDiv.textContent = sceneMessage;
        
        // Add a scene contents label
        const contentLabel = document.createElement('div');
        contentLabel.style.fontWeight = 'bold';
        contentLabel.style.marginBottom = '5px';
        contentLabel.style.borderBottom = '1px solid #0066cc';
        contentLabel.style.paddingBottom = '3px';
        contentLabel.textContent = "SCENE CONTENTS:";
        sceneContentDiv.insertBefore(contentLabel, sceneContentDiv.firstChild);
        
        console.log("Created scene content div, about to insert into DOM");
        
        // If we have an error for this iteration, insert after it
        if (this.firstErrorOfCurrentIteration) {
          console.log("Found first error of iteration, inserting scene after it");
          
          // Find all error messages for this iteration
          const iterationNum = this.firstErrorOfCurrentIteration.dataset.iterationNum;
          let lastErrorForIteration = this.firstErrorOfCurrentIteration;
          
          // Find the last error with the same iteration number
          const errors = this.errorsContainer.querySelectorAll('.error-message');
          for (let i = 0; i < errors.length; i++) {
            if (errors[i].dataset.iterationNum === iterationNum) {
              lastErrorForIteration = errors[i];
            }
          }
          
          // Insert the scene contents after the last error for this iteration
          if (lastErrorForIteration.nextSibling) {
            this.errorsContainer.insertBefore(sceneContentDiv, lastErrorForIteration.nextSibling);
          } else {
            this.errorsContainer.appendChild(sceneContentDiv);
          }
        } else {
          // Fallback: Insert at the top of the errors container
          this.errorsContainer.insertBefore(sceneContentDiv, this.errorsContainer.firstChild);
        }
        
        console.log("Scene content added to DOM");
      } else {
        console.warn("Cannot log scene contents: no shapes found", this.shapes);
      }
    } catch (err) {
      console.error("Error while logging scene contents:", err);
    }
  }

  clearErrors() {
    // Reset error count
    this.errorCount = 0;
    
    // Clear the error container
    this.errorsContainer.innerHTML = '';
    
    // Clear references to the UI elements
    this.errorCountDisplay = null;
    this.clearErrorsButton = null;
    
    // Clear the errors array too
    this.errors = [];
  }

  showChecks(functionToRunAllChecks) {
    // Common path - if no checks, clear container in browser mode
    if (!functionToRunAllChecks) {
      if (!this.isNode && this.checksContainer) {
        this.checksContainer.innerHTML = '';
      }
      return;
    }
    
    // Common calculation of checks result
    const result = functionToRunAllChecks(this);
    
    this.showChecksInBrowser(result);
    return result;
  }
  
  // Browser-specific checks display
  showChecksInBrowser(checksResult) {
    if (this.checksContainer) {
      this.checksContainer.innerHTML = checksResult;
    }
  }

  updateHashes() {
    this.swHashContainer.textContent = `Hash: ${this.canvasCtxOfSwRender.getHashString()}`;
    this.canvasHashContainer.textContent = `Hash: ${this.canvasCtxOfCanvasRender.getHashString()}`;
  }

  render(buildShapesFn, canvasCodeFn = null, iterationNumber = null) {
    // Initialize shapes array
    this.shapes = [];
    
    // Call the appropriate environment-specific render method
    if (this.isNode) {
      // For Node environment, reset error tracking (since it's a single run)
      this.errorCount = 0;
      this.errors = [];
      
      // Node.js specific rendering path
      return this.renderInNode(buildShapesFn, canvasCodeFn, iterationNumber);
    } else {
      // Browser specific rendering path
      return this.renderInBrowser(buildShapesFn, canvasCodeFn);
    }
  }

  // Node.js specific rendering implementation
  renderInNode(buildShapesFn, canvasCodeFn = null, iterationNumber = null) {
    // Use the provided iteration number or default to 1
    const currentCount = iterationNumber || 1;
    this.primitiveLogs = ''; // Initialize primitiveLogs

    if (buildShapesFn) {
      // Mock log container for Node
      const nodeLogContainer = {
        innerHTML: '',
        // appendChild is not directly used by buildShapesFn for logging,
        // as it appends to innerHTML. Kept for potential future compatibility
        // or if some part of buildShapesFn might use it, though unlikely for logs.
        appendChild: (text) => {
          if (this.verbose) console.log(text);
          // If appendChild were to be used for logs, it should append to innerHTML:
          // nodeLogContainer.innerHTML += text.toString(); // Or appropriate conversion
        }
      };
      
      // Execute the shape builder
      this.builderReturnValue = buildShapesFn(this.shapes, nodeLogContainer, currentCount);
      this.primitiveLogs = nodeLogContainer.innerHTML; // Capture logs
      this.drawSceneSW();
    }
    else if (canvasCodeFn) {
      // Clear the canvas (to transparent black)
      this.crispSwCtx.clearRect(0, 0, this.canvasOfSwRender.width, this.canvasOfSwRender.height);
      
      // Use CrispSwCanvas for the software-rendered output
      SeededRandom.seedWithInteger(currentCount);
      const swDrawResult = canvasCodeFn(this.crispSwCtx, currentCount);

      // Capture logs if returned by canvasCodeFn
      if (swDrawResult?.logs && Array.isArray(swDrawResult.logs)) {
        this.primitiveLogs = swDrawResult.logs.join('\n');
      }

      // Capture the return value for checks, mirroring the browser logic
      this.builderReturnValue = swDrawResult?.checkData === undefined ? swDrawResult : swDrawResult.checkData;
    }
    
    // Run checks if available
    if (this.functionToRunAllChecks) {
      const results = this.functionToRunAllChecks(this);
      if (this.verbose) {
        console.log('Checks Results:');
        console.log(results);
      }
    }
    
    // Return success/failure status based on error count
    return this.errorCount === 0;
  }
  
  // Export BMP image for Node.js
  exportBMP(outputDir, iterationNum) {
    if (!this.isNode) return;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Get image data
      if (this.canvasCtxOfSwRender && this.canvasCtxOfSwRender.getImageData) {
        const imageData = this.canvasCtxOfSwRender.getImageData(0, 0, this.width, this.height);
        
        // Use the toBMP method to generate the BMP data
        const bmpData = imageData.toBMP();
        
        // Create directory if needed
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save the file
        const filename = `${this.id}-iteration${iterationNum}.bmp`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, bmpData);
        
        if (this.verbose) {
          console.log(`Saved BMP image to ${filepath}`);
        }
        
        return filepath;
      }
    } catch (err) {
      console.error('Error exporting BMP:', err);
    }
    
    return null;
  }

  // Browser specific rendering implementation
  renderInBrowser(buildShapesFn, canvasCodeFn = null) {
    // Update current iteration label to match the next iteration number
    const currentCount = parseInt(this.iterationCounter.value) || 1;
    this.currentLabel.textContent = `Current Iteration #${currentCount}`;
    
    // Increment counter for next iteration
    this.iterationCounter.value = (currentCount + 1).toString();
    
    this.buildShapesFn = buildShapesFn; // Store the function for later use
    this.logContainer.innerHTML = '';
    
    // Track initial error count before rendering
    const initialErrorCount = this.errorCount || 0;
    
    // Reset UI error tracking for this iteration
    this.firstErrorOfCurrentIteration = null;
    this.lastErrorOfCurrentIteration = null;
    
    // Create a flag to track if we need to log scene contents
    this.sceneLoggedForCurrentIteration = false;
    
    if (buildShapesFn) {
      // this returned value is used in the checks/tests
      this.builderReturnValue = buildShapesFn(this.shapes, this.logContainer, currentCount);
      this.drawSceneSW();
      this.updateSWRenderOutput();
      this.drawSceneCanvas();
    }
    else if (canvasCodeFn) {
      // clear both canvases (to transparent black)
      this.canvasCtxOfCanvasRender.clearRect(0, 0, this.canvasOfCanvasRender.width, this.canvasOfCanvasRender.height);
      this.crispSwCtx.clearRect(0, 0, this.canvasOfSwRender.width, this.canvasOfSwRender.height);
      
      // === Software Rendering Pass (use CrispSwCanvas) ===
      SeededRandom.seedWithInteger(currentCount);
      const swDrawResult = canvasCodeFn(this.crispSwCtx, currentCount);
      // Blit the result to the SW canvas
      this.crispSwCtx.blitToCanvas(this.canvasOfSwRender);
      
      // Store the check data part of the result (if any)
      // Checks will access this.builderReturnValue
      this.builderReturnValue = swDrawResult?.checkData === undefined ? swDrawResult : swDrawResult.checkData;
      
      // Handle logs, if returned
      if (swDrawResult?.logs && Array.isArray(swDrawResult.logs)) {
          this.logContainer.innerHTML = swDrawResult.logs.join('<br>\n');
      }      
      
      // === Canvas Rendering Pass (use regular HTML5Canvas)===
      SeededRandom.seedWithInteger(currentCount);
      
      // result/logs ignored for this pass
      canvasCodeFn(this.canvasCtxOfCanvasRender, currentCount);
      
      if (this.canvasCtxOfSwRender.getHashString) this.updateHashes();
    }
    
    this.flipState = true;
    this.updateFlipOutput();
    
    this.showChecks(this.functionToRunAllChecks);
    
    // Important: Check for errors AFTER all checks and tests are complete
    // This ensures all errors have been logged by the time we check
    setTimeout(() => {
      // Check if any new errors occurred and log scene contents if needed
      const finalErrorCount = this.errorCount || 0;

    }, 0); // Using setTimeout with 0 delay ensures this runs after all other operations
    
    // Return success/failure status based on error count
    return this.errorCount === initialErrorCount;
  }

  runMultipleIterations(count, stopAtError = true, onComplete = null) {
    let current = 0;
    this.sceneLoggedForCurrentIteration = false; // Initialize flag
    const initialErrorCount = this.errorCount || 0;

    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.fontFamily = 'monospace';
    // Make all characters have the same width otherwise the grey and black blocks have different widths
    progressBar.style.whiteSpace = 'pre';
    // Insert before the current label
    this.currentLabel.parentNode.insertBefore(progressBar, this.currentLabel);

    const updateProgress = () => {
        const percent = Math.floor((current / count) * 100);
        const filledBoxes = Math.floor((current / count) * 10);
        const progressText = '\u2593'.repeat(filledBoxes) + '\u2591'.repeat(10 - filledBoxes);
        progressBar.textContent = `${progressText} ${percent}%`.padEnd(15);  // Ensure consistent width
    };

    const runFrame = () => {
        try {
            // Track error count before rendering
            const beforeErrorCount = this.errorCount || 0;
            
            // Reset scene logged flag
            this.sceneLoggedForCurrentIteration = false;
            
            this.render(this.buildShapesFn, this.canvasCodeFn);
            current++;
            updateProgress();
            
            // Use a small delay to check for errors after all rendering and checks are complete
            setTimeout(() => {
                // Continue if under count and either not stopping at errors or no new errors
                if (current < count && (!stopAtError || this.errorCount === beforeErrorCount)) {
                    requestAnimationFrame(runFrame);
                } else {
                    // Remove progress bar when done
                    progressBar.remove();
                    if (onComplete) onComplete(); // *** CALL CALLBACK ON NORMAL COMPLETION ***
                }
            }, 0);
            
        } catch (error) {
            this.showError(`Error during multiple iterations: ${error.message}`);
            
            // Log scene contents if there's an error and it hasn't been logged yet
            if (!this.sceneLoggedForCurrentIteration && this.shapes && this.shapes.length > 0) {
                this.logSceneContents();
            }
            
            // Remove progress bar on error if we're stopping
            if (stopAtError) {
                progressBar.remove();
                if (onComplete) onComplete(error); // *** CALL CALLBACK ON ERROR STOP ***
            } else if (current < count) {
                // Continue if not stopping at errors
                requestAnimationFrame(runFrame);
            } else { 
                // Reached end even with errors when not stopping
                progressBar.remove();
                if (onComplete) onComplete(); // *** CALL CALLBACK ON NON-STOP ERROR COMPLETION ***
            }
        }
    };
    requestAnimationFrame(runFrame);
  }

  static createNavigation(theTitle) {
    const nav = document.createElement('div');
    nav.className = 'nav-container';
    
    const title = document.createElement('h1');
    title.textContent = theTitle;
    title.className = 'nav-title';
    nav.appendChild(title);
    
    RenderTest.sections.forEach((section, index) => {
      if (index > 0) {
        nav.appendChild(document.createTextNode(' - '));
      }
      
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = section.title;
      link.className = 'nav-link';
      nav.appendChild(link);
    });

    // Create container for 'Run All' buttons
    const runAllContainer = document.createElement('div');
    runAllContainer.style.marginTop = '15px';
    runAllContainer.style.marginBottom = '10px';
    runAllContainer.style.display = 'flex';
    runAllContainer.style.gap = '10px';
    runAllContainer.style.flexWrap = 'wrap'; // Allow buttons to wrap on smaller screens

    const runAllButtons = []; // To disable/enable them during execution

    // Helper function for sequential execution
    const runAllSequentially = async (actionFn) => {
      const tests = Object.values(RenderTest.registry);
      runAllButtons.forEach(btn => btn.disabled = true); // Disable buttons
      console.log(`Starting batch action for ${tests.length} tests...`);
      for (const test of tests) {
        console.log(`Running action for test: ${test.id}`);
        // Scroll the test into view slightly before running
        test.container.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        // Small delay to allow scrolling before action
        await new Promise(resolve => setTimeout(resolve, 100)); 
        try {
          await actionFn(test);
        } catch (error) {
          console.error(`Error running action for test ${test.id}:`, error);
          // Decide if you want to stop on error or continue
          // break; // Uncomment to stop on first error
        }
         // Optional small delay between tests
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      console.log("Batch action complete.");
      runAllButtons.forEach(btn => btn.disabled = false); // Re-enable buttons
    };

    // Button 1: Run All 1 Iteration
    const runAll1Button = document.createElement('button');
    runAll1Button.textContent = 'Run All: 1 iter';
    runAll1Button.className = 'action-button';
    runAll1Button.onclick = () => runAllSequentially((test) => {
      // Reset iteration counter to 1 for each test before running
      test.iterationCounter.value = '1'; 
      return new Promise(resolve => {
        // render is synchronous but let's wrap in promise for consistency and potential future async render
        test.render(test.buildShapesFn, test.canvasCodeFn); 
        resolve();
      });
    });
    runAllContainer.appendChild(runAll1Button);
    runAllButtons.push(runAll1Button);

    // Button 2: Run All 10 Iterations
    const runAll10Button = document.createElement('button');
    runAll10Button.textContent = 'Run All: 10 iter';
    runAll10Button.className = 'action-button';
    runAll10Button.onclick = () => runAllSequentially((test) => {
      return new Promise((resolve, reject) => {
        try {
          // Pass resolve as the onComplete callback
          test.runMultipleIterations(10, true, resolve);
        } catch (err) {
          // Catch synchronous errors during setup, though unlikely
          reject(err); 
        }
      });
    });
    runAllContainer.appendChild(runAll10Button);
    runAllButtons.push(runAll10Button);

    // Button 3: Run All 100 Iterations
    const runAll100Button = document.createElement('button');
    runAll100Button.textContent = 'Run All: 100 iter';
    runAll100Button.className = 'action-button';
    runAll100Button.onclick = () => runAllSequentially((test) => {
      return new Promise((resolve, reject) => {
        try {
          // Pass resolve as the onComplete callback
          test.runMultipleIterations(100, true, resolve); 
        } catch (err) {
          reject(err);
        }
      });
    });
    runAllContainer.appendChild(runAll100Button);
    runAllButtons.push(runAll100Button);


    // Button 4: Collect All Defects (1k iter)
    const collectAllButton = document.createElement('button');
    collectAllButton.textContent = 'Collect All Defects (1k iter)';
    collectAllButton.className = 'action-button';
    collectAllButton.onclick = () => runAllSequentially((test) => {
      return new Promise((resolve, reject) => {
         try {
          // Pass resolve as the onComplete callback
          test.runMultipleIterations(1000, false, resolve); 
        } catch (err) {
          reject(err);
        }
      });
    });
    runAllContainer.appendChild(collectAllButton);
    runAllButtons.push(collectAllButton);

    // Add the 'Run All' container before the background control
    nav.appendChild(runAllContainer); 

    // Add background control
    const backgroundControl = document.createElement('div');
    backgroundControl.style.marginTop = '10px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'showTransparencyPatternBackground';
    checkbox.checked = true; // default to transparent pattern background
    document.body.classList.add('transparency-pattern');
    
    const label = document.createElement('label');
    label.htmlFor = 'showTransparencyPatternBackground';
    label.textContent = 'Show transparency pattern';
    label.style.marginLeft = '5px';
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('transparency-pattern');
      } else {
        document.body.classList.remove('transparency-pattern');
      }
    });
    
    backgroundControl.appendChild(checkbox);
    backgroundControl.appendChild(label);
    nav.appendChild(backgroundControl);
    
    document.body.insertBefore(nav, document.body.firstChild);
    
    // Add required CSS
    const style = document.createElement('style');
    style.textContent = `
      body {
        background: white;
      }
      .transparency-pattern {
        background-image:
          linear-gradient(45deg, #eee 25%, transparent 25%),
          linear-gradient(-45deg, #eee 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #eee 75%),
          linear-gradient(-45deg, transparent 75%, #eee 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      }
    `;
    document.head.appendChild(style);
  }

  handleMouseMove(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    
    // Switch to magnifier labels
    this.displayAltLabel.style.display = 'none';
    this.displayMagContainer.style.display = 'flex'; // Use flex for the container

    // Clear display canvas
    this.canvasCtxOfComparison.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtxOfComparison.clearRect(0, 0, this.canvasOfComparison.width, this.canvasOfComparison.height);    

    // Get image data from both canvases at the same position
    const swImageData = this.canvasCtxOfSwRender.getImageData(
      Math.max(0, x - Math.floor(RenderTest.GRID_COLUMNS/2)),
      Math.max(0, y - Math.floor(RenderTest.GRID_ROWS/2)),
      RenderTest.GRID_COLUMNS,
      RenderTest.GRID_ROWS
    );

    const canvasImageData = this.canvasCtxOfCanvasRender.getImageData(
      Math.max(0, x - Math.floor(RenderTest.GRID_COLUMNS/2)),
      Math.max(0, y - Math.floor(RenderTest.GRID_ROWS/2)),
      RenderTest.GRID_COLUMNS,
      RenderTest.GRID_ROWS
    );

    // Calculate pixel size for the magnified view
    const pixelSize = Math.min(
      (this.canvasOfComparison.width / 2) / RenderTest.GRID_COLUMNS,
      this.canvasOfComparison.height / RenderTest.GRID_ROWS
    );

    // Function to draw magnified grid
    const drawMagnifiedGrid = (imageData, offsetX) => {
      // Calculate the actual coordinates of the top-left pixel in the source image
      const sourceX = x - Math.floor(RenderTest.GRID_COLUMNS/2);
      const sourceY = y - Math.floor(RenderTest.GRID_ROWS/2);
      
      // Calculate where to start reading from the imageData
      const readOffsetX = Math.max(0, -sourceX);
      const readOffsetY = Math.max(0, -sourceY);
      
      for (let py = 0; py < RenderTest.GRID_ROWS; py++) {
        for (let px = 0; px < RenderTest.GRID_COLUMNS; px++) {
          // Calculate actual source coordinates for this pixel
          const actualX = sourceX + px;
          const actualY = sourceY + py;
          
          // Check if the pixel is within canvas bounds
          const isOutOfBounds = actualX < 0 || actualY < 0 || 
                               actualX >= canvas.width || actualY >= canvas.height;

          if (isOutOfBounds) {
            // Draw grey pixel for out of bounds
            this.canvasCtxOfComparison.fillStyle = 'rgb(128,128,128)';
          } else {
            // Calculate correct index in the imageData
            const dataX = px - readOffsetX;
            const dataY = py - readOffsetY;
            const i = (dataY * RenderTest.GRID_COLUMNS + dataX) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            this.canvasCtxOfComparison.fillStyle = new Color(r, g, b, a).toCSS();
          }

          this.canvasCtxOfComparison.fillRect(
            offsetX + px * pixelSize,
            py * pixelSize,
            pixelSize,
            pixelSize
          );

          // Draw grid lines
          this.canvasCtxOfComparison.strokeStyle = 'rgba(128,128,128,0.5)';
          this.canvasCtxOfComparison.strokeRect(
            offsetX + px * pixelSize,
            py * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }

      // Draw crosshair
      this.canvasCtxOfComparison.strokeStyle = 'red';
      this.canvasCtxOfComparison.lineWidth = 2;
      
      // Vertical line
      this.canvasCtxOfComparison.beginPath();
      this.canvasCtxOfComparison.moveTo(offsetX + (RenderTest.GRID_COLUMNS/2) * pixelSize, 0);
      this.canvasCtxOfComparison.lineTo(offsetX + (RenderTest.GRID_COLUMNS/2) * pixelSize, RenderTest.GRID_ROWS * pixelSize);
      this.canvasCtxOfComparison.stroke();
      
      // Horizontal line
      this.canvasCtxOfComparison.beginPath();
      this.canvasCtxOfComparison.moveTo(offsetX, (RenderTest.GRID_ROWS/2) * pixelSize);
      this.canvasCtxOfComparison.lineTo(offsetX + RenderTest.GRID_COLUMNS * pixelSize, (RenderTest.GRID_ROWS/2) * pixelSize);
      this.canvasCtxOfComparison.stroke();

      // Compute the local mouse coordinates within this grid.
      let localMouseX = Math.floor(RenderTest.GRID_COLUMNS/2);
      let localMouseY = Math.floor(RenderTest.GRID_ROWS/2);
      // Clamp to valid indices
      localMouseX = Math.min(Math.floor(localMouseX), RenderTest.GRID_COLUMNS - 1);
      localMouseY = Math.min(Math.floor(localMouseY), RenderTest.GRID_ROWS - 1);
      const idx = (localMouseY * RenderTest.GRID_COLUMNS + localMouseX) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      const rgbaText = new Color(r, g, b, a).toCSS();

      // Draw color text below grid
      this.canvasCtxOfComparison.font = '12px monospace';
      this.canvasCtxOfComparison.textAlign = 'center';
      this.canvasCtxOfComparison.textBaseline = 'middle';
      const textX = offsetX + (RenderTest.GRID_COLUMNS * pixelSize) / 2;
      const textY = (RenderTest.GRID_ROWS) * pixelSize + pixelSize/2;
      this.canvasCtxOfComparison.fillStyle = 'black';
      this.canvasCtxOfComparison.fillText(rgbaText, textX, textY);
    };

    // Draw left side (SW renderer)
    drawMagnifiedGrid(swImageData, 0);

    // Draw right side (Canvas renderer)
    drawMagnifiedGrid(canvasImageData, this.canvasOfComparison.width / 2);

    // Draw separator line
    this.canvasCtxOfComparison.strokeStyle = 'rgba(128,128,128,0.8)';
    this.canvasCtxOfComparison.lineWidth = 6;
    this.canvasCtxOfComparison.beginPath();
    this.canvasCtxOfComparison.moveTo(this.canvasOfComparison.width / 2, 0);
    this.canvasCtxOfComparison.lineTo(this.canvasOfComparison.width / 2, this.canvasOfComparison.height);
    this.canvasCtxOfComparison.stroke();

    // Add white highlights on the sides of the separator
    this.canvasCtxOfComparison.strokeStyle = 'rgba(255,255,255,0.5)';
    this.canvasCtxOfComparison.lineWidth = 2;
    
    // Left highlight
    this.canvasCtxOfComparison.beginPath();
    this.canvasCtxOfComparison.moveTo(this.canvasOfComparison.width / 2 - 3, 0);
    this.canvasCtxOfComparison.lineTo(this.canvasOfComparison.width / 2 - 3, this.canvasOfComparison.height);
    this.canvasCtxOfComparison.stroke();
    
    // Right highlight
    this.canvasCtxOfComparison.beginPath();
    this.canvasCtxOfComparison.moveTo(this.canvasOfComparison.width / 2 + 3, 0);
    this.canvasCtxOfComparison.lineTo(this.canvasOfComparison.width / 2 + 3, this.canvasOfComparison.height);
    this.canvasCtxOfComparison.stroke();

    // Draw coordinates at top center
    this.canvasCtxOfComparison.font = '14px monospace';
    this.canvasCtxOfComparison.textAlign = 'center';
    this.canvasCtxOfComparison.textBaseline = 'top';
    const coordsText = `(${x}, ${y})`;
    this.canvasCtxOfComparison.fillStyle = 'black';
    this.canvasCtxOfComparison.fillText(coordsText, this.canvasOfComparison.width / 2, 25);
  }

  handleMouseOut() {
    // Restore normal display canvas view (and labels via updateFlipOutput)
    this.updateFlipOutput();
  }
}class RenderTestBuilder {
  constructor() {
    this._id = '';
    this._title = '';
    this._description = '';
    this._shapeBuilder = null;
    this._checks = [];
    this._buildLog = [];
    this._canvasCodeFn = null;
  }

  withId(id) {
    this._id = id;
    return this;
  }

  withTitle(title) {
    this._title = title;
    return this;
  }

  withDescription(description) {
    this._description = description;
    return this;
  }

  addShapes(shapeFunction, ...args) {
    this._shapeBuilder = (shapes, log, currentIterationNumber) => {
      this._buildLog = [];
      return shapeFunction(shapes, log, currentIterationNumber, ...args);
    };
    return this;
  }

  withColorCheckMiddleRow(options) {
    this._checks.push((test) => {
      const swColors = test.renderChecks.checkCountOfUniqueColorsInMiddleRow(
        test.canvasCtxOfSwRender, 
        options.expectedUniqueColors
      );
      
      // In Node environment, we don't have canvas renderer
      let canvasColors = null;
      if (!test.isNode && test.canvasCtxOfCanvasRender) {
        canvasColors = test.renderChecks.checkCountOfUniqueColorsInMiddleRow(
          test.canvasCtxOfCanvasRender, 
          options.expectedUniqueColors
        );
      }
      
      const isCorrect = swColors === options.expectedUniqueColors && 
                       (test.isNode || canvasColors === options.expectedUniqueColors);
      
      const baseMsg = `Middle row unique colors: SW: ${swColors}`;
      return this.formatCheckResult(isCorrect, test.isNode, { 
        node: baseMsg,
        browser: baseMsg + `, Canvas: ${canvasColors}`
      });
    });
    return this;
  }
  
  // Helper method to format check results based on environment
  formatCheckResult(isCorrect, isNodeEnv, messages) {
    if (isNodeEnv) {
      return `${isCorrect ? '✓' : '✗'} ${messages.node}`;
    } else {
      return `${isCorrect ? '&#x2714;' : '&#x2717;'} ${messages.browser}`;
    }
  }
  
  withUniqueColorsCheck(expectedColors) {
    this._checks.push((test) => {
      // Only check the software renderer as specified
      const swColors = test.renderChecks.checkCountOfUniqueColorsInImage(
        test.canvasCtxOfSwRender, 
        expectedColors
      );
      const isCorrect = swColors === expectedColors;
      
      const message = `Total unique colors in SW renderer: ${swColors}`;
      return this.formatCheckResult(isCorrect, test.isNode, { node: message, browser: message });
    });
    return this;
  }

  withSpecklesCheckOnSwCanvas() {
    this._checks.push((test) => {
      // Check only SW renderer for speckles
      const speckleCountSW = test.renderChecks.checkForSpeckles(test.canvasCtxOfSwRender);
      const isCorrect = speckleCountSW === 0;
      
      const message = `Speckle count: SW: ${speckleCountSW}`;
      return this.formatCheckResult(isCorrect, test.isNode, { node: message, browser: message });
    });
    return this;
  }

  withColorCheckMiddleColumn(options) {
    this._checks.push((test) => {
      const swColors = test.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
        test.canvasCtxOfSwRender, 
        options.expectedUniqueColors
      );
      
      // In Node environment, we don't have canvas renderer
      let canvasColors = null;
      if (!test.isNode && test.canvasCtxOfCanvasRender) {
        canvasColors = test.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
          test.canvasCtxOfCanvasRender, 
          options.expectedUniqueColors
        );
      }
      
      const isCorrect = swColors === options.expectedUniqueColors && 
                       (test.isNode || canvasColors === options.expectedUniqueColors);
      
      const baseMsg = `Middle column unique colors: SW: ${swColors}`;
      return this.formatCheckResult(isCorrect, test.isNode, { 
        node: baseMsg,
        browser: baseMsg + `, Canvas: ${canvasColors}`
      });
    });
    return this;
  }

  withExtremesCheck(alphaTolerance = 0) {
    this._checks.push((test) => {
      const extremes = test.builderReturnValue;
      if (!extremes) return "No extremes data available";
      
      // Use the updated checkExtremes that works in both environments
      // For Node, we pass null as the canvas renderer
      const result = test.renderChecks.checkExtremes(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        extremes,
        alphaTolerance
      );
      
      // Determine if the check passed
      const isNodeCorrect = !result.includes("FAIL") && !result.includes("Error") && 
                           (typeof result.errors === 'undefined' || result.errors === 0);
      const isBrowserCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      // Use the common formatter with the appropriate correctness value
      return this.formatCheckResult(
        test.isNode ? isNodeCorrect : isBrowserCorrect,
        test.isNode,
        { node: result, browser: result }
      );
    });
    return this;
  }
  
  withNoGapsInFillEdgesCheck() {
    this._checks.push((test) => {
      const result = test.renderChecks.checkEdgesForGaps(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        false // isStroke = false, check fill
      );
      const isCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      return this.formatCheckResult(isCorrect, test.isNode, { node: result, browser: result });
    });
    return this;
  }
  
  withNoGapsInStrokeEdgesCheck() {
    this._checks.push((test) => {
      const result = test.renderChecks.checkEdgesForGaps(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        true // isStroke = true, check stroke
      );
      const isCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      return this.formatCheckResult(isCorrect, test.isNode, { node: result, browser: result });
    });
    return this;
  }
  
  withContinuousStrokeCheck(options = {}) {
    this._checks.push((test) => {
      const result = test.renderChecks.checkStrokeForHoles(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        options
      );
      // Modified logic to correctly check for continuous strokes
      // If the result contains "continuous with no holes", it's correct
      const isCorrect = result.includes("continuous with no holes");
      
      return this.formatCheckResult(isCorrect, test.isNode, { node: result, browser: result });
    });
    return this;
  }
  
  // Compare pixels with threshold values for RGB and alpha components
  compareWithThreshold(RGBThreshold, alphaThreshold) {
    this._checks.push((test) => {
      // In Node environment, we can't compare with Canvas as it doesn't exist
      if (test.isNode) {
        return this.formatCheckResult(true, true, { 
          node: "Threshold check skipped in Node environment",
          browser: "" // Not used in Node
        });
      } else {
        const result = test.renderChecks.compareWithThreshold(
          test.canvasCtxOfSwRender,
          test.canvasCtxOfCanvasRender,
          RGBThreshold,
          alphaThreshold
        );
        const isCorrect = !result.includes("FAIL") && !result.includes("Error");
        
        return this.formatCheckResult(isCorrect, false, { 
          node: "", // Not used in browser
          browser: result 
        });
      }
    });
    return this;
  }

  // you can pass a function that runs canvas code
  // so instead of passing shapes, you pass a function that runs canvas code
  // and then you can use the canvas code to create the shapes
  runCanvasCode(canvasCodeFn) {
    this._canvasCodeFn = canvasCodeFn;
    return this;
  }

  build() {
    if (!this._id || !this._title || (!this._shapeBuilder && !this._canvasCodeFn)) {
      throw new Error('RenderTestBuilder requires id, title, and shape builder function or canvas code function');
    }

    // if both shapeBuilder and canvasCodeFn are defined, throw an error as well
    if (this._shapeBuilder && this._canvasCodeFn) {
      throw new Error('RenderTestBuilder cannot have both shape builder function and canvas code function');
    }

    // Create checks function that works in both environments
    const functionToRunAllChecks = this._checks.length > 0 ? 
      (test) => {
        const results = this._checks.map(check => check(test));
        return this.formatResultsForEnvironment(results, test.isNode);
      } : null;

    return new RenderTest(
      this._id,
      this._title,
      this._shapeBuilder,
      this._canvasCodeFn,
      functionToRunAllChecks,
      this._description
    );
  }
  
  // Format the results array based on the environment
  formatResultsForEnvironment(results, isNodeEnv) {
    return isNodeEnv ? 
      results.join('\n') : // Plain text for Node
      results.join('<br>'); // HTML for browser
  }
}// Utility function to streamline the registration of high-level tests
// for both visual regression (RenderTestBuilder) and performance testing.

/**
 * Registers a high-level test with RenderTestBuilder and/or the performance test registry.
 *
 * @param {string} filename - The filename of the test script (e.g., "rectangles--S-size--filled--test.js").
 * @param {function} drawFunction - The actual drawing function (e.g., draw_rectangles__S_size__filled).
 * @param {string} category - The category of the test (e.g., "rectangles", "lines", "circles").
 * @param {object} checkConfiguration - An object specifying which checks to apply and their parameters for RenderTestBuilder.
 * @param {object} [performanceTestConfig={}] - Optional configuration overrides for performance test registration.
 */
function registerHighLevelTest(filename, drawFunction, category, checkConfiguration, performanceTestConfig = {}) {
    // --- 1. Derive common properties from filename ---
    // Handle both formats: with .js extension and without
    const baseId = filename.replace(/--test(\.js)?$/, '');
    const parts = baseId.split('--');
    const categoryFromFile = parts[0]; // Category can also be explicitly passed, which is preferred.
    const featureParts = parts.slice(1);

    let titleCategory = category.charAt(0).toUpperCase() + category.slice(1);
    if (category === 'rounded-rects') titleCategory = 'Rounded Rects'; // Handle specific cases
    if (category === 'scene') titleCategory = 'Scene';


    const titleFeatures = featureParts.map(part =>
        part.split('_').map(subPart => subPart.charAt(0).toUpperCase() + subPart.slice(1)).join(' ')
    ).join(' ');

    const defaultTitle = `${titleCategory}: ${titleFeatures}`;
    const defaultDescription = `Test for ${category} with features: ${featureParts.join(', ')}.`;

    const shortFeatures = featureParts.map(part => {
        return part.split('_').map(subPart => {
            if (subPart.length > 4) return subPart.substring(0, 3) + (isNaN(subPart.charAt(3)) ? '.' : subPart.charAt(3));
            return subPart;
        }).join('');
    }).join(' ');
    const perfCategoryAbbrev = category.length > 4 ? category.substring(0,4) : category;
    const defaultPerfDisplayName = `Perf: ${perfCategoryAbbrev.charAt(0).toUpperCase() + perfCategoryAbbrev.slice(1)} ${shortFeatures}`;


    // --- 2. Register with RenderTestBuilder (Visual Tests) ---
    if (typeof RenderTestBuilder === 'function' && typeof define_test_from_registration === 'undefined') {
        // Check for a global flag to prevent re-definition if this util is called multiple times by mistake in a single file context (though it shouldn't)
        // The primary definition should occur directly in the test file by calling this helper.

        let builder = new RenderTestBuilder();

        builder.withId(baseId)
            .withTitle(performanceTestConfig.title || defaultTitle) // Allow override for visual title too
            .withDescription(performanceTestConfig.description || defaultDescription) // Allow override for visual description too
            .runCanvasCode(drawFunction, ...(checkConfiguration && checkConfiguration.drawFunctionArgs ? checkConfiguration.drawFunctionArgs : []));

        // Apply checks based on checkConfiguration
        if (checkConfiguration) {
            if (checkConfiguration.extremes) {
                if (typeof checkConfiguration.extremes === 'object' && checkConfiguration.extremes.tolerance !== undefined) {
                    builder.withExtremesCheck(checkConfiguration.extremes.tolerance);
                } else {
                    builder.withExtremesCheck();
                }
            }
            if (checkConfiguration.uniqueColors) {
                const ucc = checkConfiguration.uniqueColors;
                if (ucc.middleRow) {
                    builder.withColorCheckMiddleRow({
                        expectedUniqueColors: ucc.middleRow.count,
                        tolerance: ucc.middleRow.tolerance,
                        checkInCenterThird: ucc.middleRow.inCenterThird !== undefined ? ucc.middleRow.inCenterThird : false
                    });
                }
                if (ucc.middleColumn) {
                    builder.withColorCheckMiddleColumn({
                        expectedUniqueColors: ucc.middleColumn.count,
                        tolerance: ucc.middleColumn.tolerance,
                        checkInCenterThird: ucc.middleColumn.inCenterThird !== undefined ? ucc.middleColumn.inCenterThird : false
                    });
                }
            }
            if (checkConfiguration.continuousStroke) {
                if (typeof checkConfiguration.continuousStroke === 'object' && checkConfiguration.continuousStroke.tolerance !== undefined) {
                    builder.withContinuousStrokeCheck(checkConfiguration.continuousStroke.tolerance);
                } else {
                    builder.withContinuousStrokeCheck();
                }
            }
            if (checkConfiguration.speckles) {
                 const sc = checkConfiguration.speckles;
                if (typeof sc === 'object') {
                    builder.withSpecklesCheckOnSwCanvas(sc.maxSpeckleSize, sc.tolerance);
                } else { // Assume boolean true
                    builder.withSpecklesCheckOnSwCanvas(); // Uses defaults
                }
            }
            if (checkConfiguration.compare) {
                const cc = checkConfiguration.compare;
                if (typeof cc === 'object') {
                    builder.compareWithThreshold(cc.swTol, cc.refTol, cc.diffTol);
                } else { // Assume boolean true for (0,0,0)
                    builder.compareWithThreshold(0, 0, 0);
                }
            }
             if (checkConfiguration.noOffscreenPixels) {
                builder.withNoOffscreenPixelsCheck();
            }
            if (checkConfiguration.noGapsInFillEdges) {
                builder.withNoGapsInFillEdgesCheck();
            }
            if (checkConfiguration.noGapsInStrokeEdges) {
                builder.withNoGapsInStrokeEdgesCheck();
            }
            if (checkConfiguration.totalUniqueColors) {
                if (typeof checkConfiguration.totalUniqueColors === 'number') {
                    builder.withUniqueColorsCheck(checkConfiguration.totalUniqueColors);
                } else if (typeof checkConfiguration.totalUniqueColors === 'object' && checkConfiguration.totalUniqueColors.count !== undefined) {
                    builder.withUniqueColorsCheck(checkConfiguration.totalUniqueColors.count);
                }
            }
            // Add more checks here as needed, e.g.,
            // if (checkConfiguration.noGapsInStrokeEdges) { builder.withNoGapsInStrokeEdgesCheck(); }
        }
        builder.build();
    }

    // --- 3. Register with Performance Test Registry ---
    if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' && typeof drawFunction === 'function') {
        const perfId = (performanceTestConfig && performanceTestConfig.id) ? performanceTestConfig.id : baseId;
        const perfDisplayName = (performanceTestConfig && performanceTestConfig.displayName) ? performanceTestConfig.displayName : defaultPerfDisplayName;
        const perfDescription = (performanceTestConfig && performanceTestConfig.description) ? performanceTestConfig.description : `Performance test for ${category}: ${featureParts.join(', ')}.`;

        // Avoid duplicate registration if a test file somehow calls this multiple times or is loaded twice.
        // A more robust check would be to see if an object with this perfId already exists.
        const alreadyRegistered = window.PERFORMANCE_TESTS_REGISTRY.some(test => test.id === perfId);

        if (!alreadyRegistered) {
            window.PERFORMANCE_TESTS_REGISTRY.push({
                id: perfId,
                drawFunction: drawFunction,
                displayName: perfDisplayName,
                description: perfDescription,
                category: category
            });
        }
    }
} /**
 * @fileoverview Common helper functions used across multiple high-level test cases.
 * These functions were previously defined individually in test files, causing scope
 * issues when tests are concatenated with IIFE wrapping for Node.js builds.
 */


/**
 * Adjusts width and height to ensure crisp rendering based on stroke width and center position
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} strokeWidth - Width of the stroke
 * @param {Object} center - Center coordinates {x, y}
 * @returns {Object} Adjusted width and height
 */
function adjustDimensionsForCrispStrokeRendering(width, height, strokeWidth, center) {

    // Dimensions should be integers, because non-integer dimensions
    // always produce a non-crisp (i.e. non-grid-aligned) stroke/fill.
    let adjustedWidth = Math.floor(width);
    let adjustedHeight = Math.floor(height);
  
    // FIXING THE WIDTH /////////////////////////////////
  
    // For center's x coordinate at grid points (integer coordinates)
    if (Number.isInteger(center.x)) {
      // For odd strokeWidth, width should be odd
      if (strokeWidth % 2 !== 0) {
        if (adjustedWidth % 2 === 0) adjustedWidth++;
      }
      // For even strokeWidth, width should be even
      else {
        if (adjustedWidth % 2 !== 0) adjustedWidth++;
      }
    }
    // For center's x coordinate at pixels (i.e. *.5 coordinates)
    else if (center.x % 1 === 0.5) {
      // For odd strokeWidth, width should be even
      if (strokeWidth % 2 !== 0) {
        if (adjustedWidth % 2 !== 0) adjustedWidth++;
      }
      // For even strokeWidth, width should be odd
      else {
        if (adjustedWidth % 2 === 0) adjustedWidth++;
      }
    }
  
    // FIXING THE HEIGHT /////////////////////////////////
  
    // For center's y coordinate at grid points (integer coordinates)
    if (Number.isInteger(center.y)) {
      // For odd strokeWidth, height should be odd
      if (strokeWidth % 2 !== 0) {
        if (adjustedHeight % 2 === 0) adjustedHeight++;
      }
      // For even strokeWidth, height should be even
      else {
        if (adjustedHeight % 2 !== 0) adjustedHeight++;
      }
    }
    // For center's y coordinate at pixels (i.e. *.5 coordinates)
    else if (center.y % 1 === 0.5) {
      // For odd strokeWidth, height should be even
      if (strokeWidth % 2 !== 0) {
        if (adjustedHeight % 2 !== 0) adjustedHeight++;
      }
      // For even strokeWidth, height should be odd
      else {
        if (adjustedHeight % 2 === 0) adjustedHeight++;
      }
    }
  
    return {
      width: adjustedWidth,
      height: adjustedHeight
    };
  }
  
  /**
   * Adjusts center coordinates to ensure crisp rendering based on stroke width and dimensions
   * @param {number} centerX - Original center X coordinate
   * @param {number} centerY - Original center Y coordinate
   * @param {number} width - Shape width
   * @param {number} height - Shape height
   * @param {number} strokeWidth - Width of the stroke
   * @returns {Object} Adjusted center coordinates
   */
  function adjustCenterForCrispStrokeRendering(centerX, centerY, width, height, strokeWidth) {
    
    let adjustedX = centerX;
    let adjustedY = centerY;
  
    // For odd strokeWidth
    //   if width/height are even, then the center x/y should be in the middle of the pixel i.e. *.5
    //   if width/height are odd, then the center x/y should be at the grid point i.e. integer
  
    // For even strokeWidth
    //   if width/height are even, then the center x/y should be at the grid point i.e. integer
    //   if width/height are odd, then the center x/y should be in the middle of the pixel i.e. *.5
  
    if (strokeWidth % 2 !== 0) {
      if (width % 2 === 0) {
        adjustedX = Math.floor(centerX) + 0.5;
      } else {
        adjustedX = Math.round(centerX);
      }
  
      if (height % 2 === 0) {
        adjustedY = Math.floor(centerY) + 0.5;
      } else {
        adjustedY = Math.round(centerY);
      }
    }
    else {
      if (width % 2 === 0) {
        adjustedX = Math.round(centerX);
      } else {
        adjustedX = Math.floor(centerX) + 0.5;
      }
  
      if (height % 2 === 0) {
        adjustedY = Math.round(centerY);
      } else {
        adjustedY = Math.floor(centerY) + 0.5;
      }
    }
  
  
  
    return {
      x: adjustedX,
      y: adjustedY
    };
  }
  
  // ============================================================================
  // CIRCLES SECTION
  // ============================================================================
  
  /**
   * Places a center point at pixel boundary (*.5 coordinates) relative to canvas center
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Center coordinates
   */
  function placeCloseToCenterAtPixel(width, height) {
    return {
      centerX: Math.floor(width / 2) + 0.5,
      centerY: Math.floor(height / 2) + 0.5
    };
  }
  
  /**
   * Places a center point at grid intersection (integer coordinates) relative to canvas center
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Center coordinates
   */
  function placeCloseToCenterAtGrid(width, height) {
    return {
      centerX: Math.floor(width / 2),
      centerY: Math.floor(height / 2)
    };
  }
  
  /**
   * Calculates circle parameters with proper positioning and dimensions.
   * This is a refactored version that uses the elegant logic from calculateCircleParameters
   * but adapted for the test context.
   * 
   * @param {Object} options - Configuration options for circle creation
   * @param {number} options.canvasWidth - Canvas width (replaces global renderTestWidth)
   * @param {number} options.canvasHeight - Canvas height (replaces global renderTestHeight)
   * @param {number} options.minRadius - Minimum radius for the circle
   * @param {number} options.maxRadius - Maximum radius for the circle
   * @param {boolean} options.hasStroke - Whether the circle has a stroke
   * @param {number} options.minStrokeWidth - Minimum stroke width (if hasStroke is true)
   * @param {number} options.maxStrokeWidth - Maximum stroke width (if hasStroke is true)
   * @param {boolean} options.randomPosition - Whether to use random positioning
   * @param {number} options.marginX - Horizontal margin from canvas edges
   * @param {number} options.marginY - Vertical margin from canvas edges
   * @returns {Object} Calculated circle parameters: {centerX, centerY, radius, strokeWidth, finalDiameter, atPixel}
   */
  function calculateCircleTestParameters(options) {
    const {
      canvasWidth,
      canvasHeight,
      minRadius = 8,
      maxRadius = 42,
      hasStroke = false,
      minStrokeWidth = 1,
      maxStrokeWidth = 4,
      randomPosition = true,
      marginX = 60,
      marginY = 60
    } = options;
  
    // Randomly choose between grid-centered and pixel-centered
    const atPixel = SeededRandom.getRandom() < 0.5;
    
    // Get initial center point
    let {centerX, centerY} = atPixel
      ? placeCloseToCenterAtPixel(canvasWidth, canvasHeight)
      : placeCloseToCenterAtGrid(canvasWidth, canvasHeight);
    
    // Calculate base diameter
    const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
    const baseRadius = diameter / 2;
    
    // Calculate stroke width
    const maxAllowedStrokeWidth = Math.floor(baseRadius / 1);
    const strokeWidth = hasStroke 
      ? (minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeWidth)))
      : 0;
    
    // Handle random positioning if requested
    if (randomPosition) {
      const totalRadius = baseRadius + (strokeWidth / 2);
      
      // Calculate safe bounds
      const minX = Math.ceil(totalRadius + marginX);
      const maxX = Math.floor(canvasWidth - totalRadius - marginX);
      const minY = Math.ceil(totalRadius + marginY);
      const maxY = Math.floor(canvasHeight - totalRadius - marginY);
      
      // Adjust diameter if circle is too large
      let adjustedDiameter = diameter;
      if (maxX <= minX || maxY <= minY) {
        // Circle is too large, reduce diameter to 1/4 of canvas size
        adjustedDiameter = Math.min(
          Math.floor(canvasWidth / 4),
          Math.floor(canvasHeight / 4)
        );
        
        // Recalculate bounds with reduced diameter
        const newTotalRadius = (adjustedDiameter / 2) + (strokeWidth / 2);
        const newMinX = Math.ceil(newTotalRadius + marginX);
        const newMaxX = Math.floor(canvasWidth - newTotalRadius - marginX);
        const newMinY = Math.ceil(newTotalRadius + marginY);
        const newMaxY = Math.floor(canvasHeight - newTotalRadius - marginY);
        
        // Generate random position within new safe bounds
        centerX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
        centerY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
      } else {
        // Generate random position within original safe bounds
        centerX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
        centerY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
      }
    }
    
    // Adjust dimensions for crisp rendering
    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(
      diameter, diameter, strokeWidth, { x: centerX, y: centerY }
    );
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
    
    return {
      centerX,
      centerY,
      radius,
      strokeWidth,
      finalDiameter,
      atPixel
    };
  }
  
  // ============================================================================
  // RECTANGLES SECTION
  // ============================================================================
  
  /**
   * Calculates rectangle parameters for crisp fill AND stroke rendering.
   * This function ALWAYS generates a stroke width > 0 (minimum 1px, or 2px if ensureEvenStroke is true).
   * 
   * IMPORTANT: This is NOT a generic rectangle function. It's specifically designed for rectangles
   * that have both fill and stroke, which requires consistent center alignment (both coordinates
   * either pixel-centered or grid-centered) to ensure crispness.
   * 
   * @param {Object} options - Configuration options for rectangle creation
   * @param {number} options.canvasWidth - Canvas width
   * @param {number} options.canvasHeight - Canvas height  
   * @param {number} options.minWidth - Minimum width for the rectangle
   * @param {number} options.maxWidth - Maximum width for the rectangle
   * @param {number} options.minHeight - Minimum height for the rectangle
   * @param {number} options.maxHeight - Maximum height for the rectangle
   * @param {number} options.maxStrokeWidth - Maximum stroke width (minimum result will be 1px)
   * @param {boolean} options.ensureEvenStroke - Whether to ensure stroke width is even (minimum becomes 2px)
   * @param {boolean} options.randomPosition - Whether to apply random positioning offset
   * @param {number} options.maxOffsetX - Maximum random X offset (if randomPosition is true)
   * @param {number} options.maxOffsetY - Maximum random Y offset (if randomPosition is true)
   * @returns {Object} Calculated rectangle parameters: {center, adjustedDimensions, strokeWidth}
   */
    function calculateCrispFillAndStrokeRectParams(options) {
    const {
      canvasWidth,
      canvasHeight,
      minWidth = 50,
      maxWidth = canvasWidth * 0.6,
      minHeight = 50, 
      maxHeight = canvasHeight * 0.6,
      maxStrokeWidth = 10,
      ensureEvenStroke = true,
      randomPosition = false,
      maxOffsetX = 100,
      maxOffsetY = 100
    } = options;

    // 1. Generate stroke width
    let strokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidth + 1);
    if (ensureEvenStroke) {
      strokeWidth = strokeWidth % 2 === 0 ? strokeWidth : strokeWidth + 1;
    }

    // 2. Set initial center to canvas center
    let center = { x: canvasWidth / 2, y: canvasHeight / 2 };

    // 3. Randomly choose between grid-centered and pixel-centered
    if (SeededRandom.getRandom() < 0.5) {
      center = { x: center.x + 0.5, y: center.y + 0.5 };
    }

    // 4. Generate rectangle dimensions
    const rectWidth = Math.round(minWidth + SeededRandom.getRandom() * (maxWidth - minWidth));
    const rectHeight = Math.round(minHeight + SeededRandom.getRandom() * (maxHeight - minHeight));

    // 5. Adjust dimensions for crisp rendering
    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, center);

    // 6. Apply random positioning offset if requested (integer amounts preserve crispness)
    if (randomPosition) {
      const xOffset = Math.floor(SeededRandom.getRandom() * maxOffsetX) - Math.floor(maxOffsetX / 2);
      const yOffset = Math.floor(SeededRandom.getRandom() * maxOffsetY) - Math.floor(maxOffsetY / 2);
      center = {
        x: center.x + xOffset,
        y: center.y + yOffset
      };
    }

    return { center, adjustedDimensions, strokeWidth };
  }
  

  // Note: Each test file is wrapped in an IIFE (Immediately Invoked Function Expression)
// to prevent function name collisions. All test files use 'drawTest' as the function name,
// which would overwrite each other in a simple concatenation. IIFEs create separate scopes.
// This avoids the need for unique function names, which would be cumbersome and redundant.

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Test with 12 arcs, each at 90 degrees, using fixed parameters and a grid layout.
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | arcs           | The test calls `ctx.outerStrokeArc` to draw arcs.
 * | Count                  | multi-12       | The test uses nested loops (4 stroke sizes * 3 radii) to draw exactly 12 arcs.
 * | SizeCategory           | mixed          | The radii used are `[20, 40, 60]`, which span size categories 'S' (16-39px) and 'M' (40-79px).
 * | FillStyle              | none           | No fill operation is performed; only `outerStrokeArc` is called.
 * | StrokeStyle            | opaque         | The stroke color alpha value is fixed at 255, making it fully opaque.
 * | StrokeThickness        | mixed          | The test uses a discrete set of stroke widths: `[1, 2, 3, 4]`.
 * | Layout                 | grid           | Arcs are positioned in a clear grid formation using `xOffset` and `yOffset` increments.
 * | CenteredAt             | grid           | The centers of the arcs are set to explicit integer coordinates, aligning them to the pixel grid.
 * | EdgeAlignment          | not-crisp      | No specific logic is used to align strokes to pixel boundaries, leading to anti-aliased edges.
 * | Orientation            | horizontal     | The `startAngle` for all arcs is fixed at 0, representing a consistent horizontal baseline.
 * | ArcAngleExtent         | 90-deg         | The angle extent is fixed at `Math.PI / 2`, which is 90 degrees.
 * | RoundRectRadius        | N/A            | This facet is not applicable to arc shapes.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not involve any clipping operations.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The visual regression mode uses a fixed stroke color of `rgba(200, 100, 100, 255)`.
 * - The performance mode (`isPerformanceRun = true`) uses different, fully randomized parameters for radius,
 *   stroke width, color, and position, which are not reflected in the facets for the visual test.
 *
 */

/**
 * @fileoverview Test definition for 90-degree arcs with various radii and stroke widths.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws 90-degree arcs. 
 * In visual regression mode, it draws a fixed grid of 12 arcs.
 * In performance mode, it draws `instances` number of fully randomized 90-degree arcs.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For this test, it always draws
 *                  the predefined set of 12 arcs for visual regression. For performance, it draws `instances` arcs.
 * @returns {?{logs: string[]}} Logs for the visual regression run.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDrawForPerf = isPerformanceRun ? instances : 0;
    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (!isPerformanceRun) {
        // --- Visual Regression Mode: Draw the fixed grid of 12 arcs ---
        const strokeSizes = [1, 2, 3, 4];
        const radii = [20, 40, 60];
        let xOffset = 150;
        const fixedStrokeColor = new Color(200, 100, 100, 255);
        const fixedStrokeColorStr = fixedStrokeColor.toCSS();

        for (const strokeWidth of strokeSizes) {
            let yOffset = 150;
            for (const radius of radii) {
                const centerX = xOffset;
                const centerY = yOffset;
                const startAngleRad = 0; // 0 degrees
                const endAngleRad = Math.PI / 2;   // 90 degrees

                ctx.strokeStyle = fixedStrokeColorStr;
                ctx.lineWidth = strokeWidth;
                ctx.outerStrokeArc(centerX, centerY, radius, startAngleRad, endAngleRad, false);

                logs.push(
                    `\u25DC 90\u00B0 Arc (Fixed Grid): center=(${centerX},${centerY}), r=${radius}, sw=${strokeWidth}`
                );
                yOffset += radius * 2 + 20;
            }
            xOffset += 120;
        }
        return { logs };

    } else {
        // --- Performance Mode: Draw `numToDrawForPerf` randomized 90-degree arcs ---
        const quadrants = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

        for (let i = 0; i < numToDrawForPerf; i++) {
            // Each arc gets fully random parameters
            const radius = 10 + SeededRandom.getRandom() * 50; // Random radius 10-60
            const strokeWidth = 1 + SeededRandom.getRandom() * 4; // Random stroke width 1-5
            
            // Random starting quadrant for the 90-degree arc
            const startAngleRad = quadrants[Math.floor(SeededRandom.getRandom() * 4)];
            const endAngleRad = startAngleRad + Math.PI / 2;

            const strokeColorObj = getRandomColor("mixed"); // Opaque or semi-transparent random color
            const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';

            // Base position from SeededRandom
            let drawCenterX = SeededRandom.getRandom() * canvasWidth;
            let drawCenterY = SeededRandom.getRandom() * canvasHeight;

            // Additional large random offset for performance test spread (using Math.random)
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
            
            // Ensure it's somewhat on screen (simple clamp)
            drawCenterX = Math.max(radius + strokeWidth, Math.min(drawCenterX, canvasWidth - radius - strokeWidth));
            drawCenterY = Math.max(radius + strokeWidth, Math.min(drawCenterY, canvasHeight - radius - strokeWidth));

            ctx.strokeStyle = strokeColorStr;
            ctx.lineWidth = strokeWidth;
            ctx.outerStrokeArc(drawCenterX, drawCenterY, radius, startAngleRad, endAngleRad, false);
        }
        return null; // No logs for performance run
    }
}

// Register the test
registerHighLevelTest(
    'arc-m12-szMix-fNone-sOpaq-swMix-lytGrid-cenGrid-edgeNotCrisp-ornHoriz-arcADeg90-test',
    drawTest,
    'arcs',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: '90\u00B0 Arcs (Multiple, Fixed Params, Grid Layout)',
        description: 'Tests rendering of 90\u00B0 arcs with various fixed radii and stroke widths in a grid.',
        displayName: 'Perf: 12 90Deg Arcs FixedGrid'
    }
); })();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Test with 5 arcs, all parameters fully randomized.
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | arcs           | The test draws exclusively `arc` shapes using `ctx.fillAndOuterStrokeArc`.
 * | Count                  | multi-5        | The test draws 5 instances in a loop for the visual regression case.
 * | SizeCategory           | mixed          | The radius is randomized in `[15, 65)`, which spans the S and M size categories for circles.
 * | FillStyle              | opaque         | `fillStyle` is set via `getRandomColor()` which produces a fully opaque color. A fill is applied.
 * | StrokeStyle            | opaque         | `strokeStyle` is set via `getRandomColor()` which produces a fully opaque color. A stroke is applied.
 * | StrokeThickness        | 1px-10px       | `lineWidth` is randomized in the range `[1, 11)`, which is categorized as `1px-10px`.
 * | Layout                 | spread         | The 5 arcs are positioned randomly across the canvas using `getRandomPoint()` for each.
 * | CenteredAt             | random         | Arc centers are random floating-point coordinates with no snapping to a grid or pixel centers.
 * | EdgeAlignment          | not-crisp      | Use of random floating-point values for position, size, and stroke width without adjustment results in non-pixel-aligned edges.
 * | Orientation            | random         | Both the start angle and end angle of the arcs are randomized, resulting in random orientations.
 * | ArcAngleExtent         | randomized     | The arc's angular extent is randomized in the range `[90, 360)` degrees.
 * | RoundRectRadius        | N/A            | This facet is not applicable to `arc` shapes.
 * | ContextTranslation     | none           | The test code does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test code does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test code does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test code does not use clipping.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Specific randomization ranges for radius, start/end angles, stroke color. strokeWidth: SR.get()*10+1 => [1,11) => 1-10px. Arc radius [15,65) spans S,M circle categories.
 *
 */

/**
 * @fileoverview Test definition for multiple fully random arcs.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws multiple arcs with fully random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 5 arcs are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 5; // Original test draws 5

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Parameters from getRandomArc()
        // SeededRandom Call 1 & 2 (inside getRandomPoint for x, y)
        const center = getRandomPoint(1, canvasWidth, canvasHeight); 
        // SeededRandom Call 3: radius
        const radius = 15 + SeededRandom.getRandom() * 50; 
        // SeededRandom Call 4: startAngle (degrees)
        const startAngleDeg = SeededRandom.getRandom() * 360;
        // SeededRandom Call 5: endAngle (degrees, relative to start)
        const endAngleDeg = startAngleDeg + SeededRandom.getRandom() * 270 + 90;
        // SeededRandom Call 6: strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        // SeededRandom Call 7: strokeColor
        const strokeColor = getRandomColor("mixed");
        // SeededRandom Call 8: fillColor
        const fillColor = getRandomColor("semitransparent");

        // Convert angles to radians for context arc methods
        const startAngleRad = startAngleDeg * Math.PI / 180;
        const endAngleRad = endAngleDeg * Math.PI / 180;

        let drawCenterX = center.x;
        let drawCenterY = center.y;

        // The getRandomPoint already randomizes position for each arc.
        // No additional Math.random() offset needed for performance mode spreading for this test.

        ctx.fillStyle = fillColor.toCSS();
        ctx.strokeStyle = strokeColor.toCSS();
        ctx.lineWidth = strokeWidth;

        // Use fillAndOuterStrokeArc as both fill and stroke are defined with random colors
        // The polyfill and CrispSwContext method should handle drawing fill then stroke.
        ctx.fillAndOuterStrokeArc(drawCenterX, drawCenterY, radius, startAngleRad, endAngleRad, false);

        if (!isPerformanceRun) { 
            logs.push(
                `RandArc ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, ang=(${startAngleDeg.toFixed(0)}°,${endAngleDeg.toFixed(0)}°), sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'arc-m5-szMix-fOpaq-sOpaq-sw1-10px-lytSpread-cenRand-edgeNotCrisp-ornRand-arcARand-test',
    drawTest,
    'arcs',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Arcs: 5 fully random',
        displayName: 'Arcs: 5 fully random',
        description: 'Test with 5 arcs, all parameters fully randomized.'
    }
); })();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 12 circles with no strokes, only fills, precise alignment, and random parameters/positions.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test exclusively renders circles using `ctx.fillCircle()`.
 * | Count                  | multi-12       | The test draws 12 separate circle instances in its standard (non-performance) mode.
 * | SizeCategory           | mixed          | The radius is randomized in the range [8, 42), which spans the XS (5-15), S (16-39), and M (40-79) size categories.
 * | FillStyle              | mixed         | Fill colors are generated by `getRandomColor("mixed")`, ensuring they are fully opaque.
 * | StrokeStyle            | none           | The test is designed to be "fill-only," and `strokeWidth` is explicitly set to 0.
 * | StrokeThickness        | none           | Consistent with `StrokeStyle` being `none`.
 * | Layout                 | spread         | The 12 circles are positioned independently and randomly across a wide area of the canvas.
 * | CenteredAt             | random         | Each circle's center coordinates are randomized within a large sub-region of the canvas.
 * | EdgeAlignment          | crisp          | The test explicitly uses `adjustDimensionsForCrispStrokeRendering()` to ensure sharp rendering.
 * | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A            | Not applicable for circles.
 * | RoundRectRadius        | N/A            | Not applicable for circles.
 * | ContextTranslation     | none           | The rendering context is not translated (`ctx.translate()` is not used).
 * | ContextRotation        | none           | The rendering context is not rotated (`ctx.rotate()` is not used).
 * | ContextScaling         | none           | The rendering context is not scaled (`ctx.scale()` is not used).
 * | Clipped on shape       | none           | No clipping region is defined or applied in this test.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The specific randomization ranges for radius and fill color are not captured. The radius is randomized within [8, 42), spanning XS, S, and M size categories. The fill color is a random opaque color.
 *
 */

/**
 * @fileoverview Test definition for multiple precise fill-only circles.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws multiple precise, fill-only random circles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 12 circles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 12; // Original test draws 12

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-4 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 8,
            maxRadius: 42,
            hasStroke: false,        // No stroke
            randomPosition: true,    // Enable random positioning
            marginX: 60,
            marginY: 60
        });
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 5: fillColor (opaque or semi-transparent, original used palette indexing)
        const fillColor = getRandomColor("mixed");

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        ctx.fillCircle(drawCenterX, drawCenterY, radius, fillColor);

        if (!isPerformanceRun) { 
            logs.push(
                `PreciseNoStrokeCircle ${i+1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'circle-m12-szMix-fOpaq-sNone-lytSpread-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Multiple Precise Fill-Only Circles (Random Params & Pos)',
        description: 'Tests rendering of 12 circles with no strokes, only fills, precise alignment, and random parameters/positions.',
        displayName: 'Perf: 12 Precise NoStroke RandCircles'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 12 circles with precise pixel alignment, varied strokes and fills, and random positions. Each circle has a randomized radius, position, stroke color/thickness, and fill color.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test renders circles using `ctx.fillAndStrokeCircle`.
 * | Count                  | multi-12       | The code loops 12 times in its visual test mode (`numToDraw` is 12).
 * | SizeCategory           | mixed          | The base radius is randomized in the range [8, 41], spanning XS, S, and M size categories.
 * | FillStyle              | semitransparent| Fill alpha is randomized via `getRandomColor("semitransparent")`, which is always semi-transparent.
 * | StrokeStyle            | mixed          | Stroke alpha is randomized via `getRandomColor("mixed")`, resulting in both opaque and semi-transparent strokes.
 * | StrokeThickness        | 1px-4px        | `strokeWidth` is calculated as an integer in the range [1, 4].
 * | Layout                 | spread         | Each circle is given a unique, randomized position within the canvas, distributing them.
 * | CenteredAt             | random         | The final center coordinates for each circle are randomized integers, not snapped to a grid or pixel center.
 * | EdgeAlignment          | crisp          | The code explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | N/A            | Circles are radially symmetric and have no orientation.
 * | ArcAngleExtent         | N/A            | This facet only applies to `arc` shapes.
 * | RoundRectRadius        | N/A            | This facet only applies to `rounded-rect` shapes.
 * | ContextTranslation     | none           | The test does not call `ctx.translate()`.
 * | ContextRotation        | none           | The test does not call `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not call `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not call `ctx.clip()`.
 * | Clipped on shape count | n/a            | No clipping is applied.
 * | Clipped on shape arrangement | n/a      | No clipping is applied.
 * | Clipped on shape size  | n/a            | No clipping is applied.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The initial centering type (`atPixel` vs. `atGrid`) is determined randomly for each circle but is only used to set a reference point before the final, fully randomized position is calculated. This initial type does not affect the final `CenteredAt` facet, which remains `random`.
 *
 */

/**
 * @fileoverview Test definition for multiple precise random circles with strokes and fills.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws multiple precise random circles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 12 circles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 12; // Original test draws 12

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-5 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 8,
            maxRadius: 42,
            hasStroke: true,         // Has stroke
            minStrokeWidth: 1,
            maxStrokeWidth: 4,
            randomPosition: true,    // Enable random positioning
            marginX: 60,
            marginY: 60
        });
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 6: strokeColor (opaque)
        // The original used palette indexing (i, count) for getRandomColor.
        // Using simpler version here; adjust if color checks (if any were added) fail.
        const strokeColor = getRandomColor("mixed");
        // SR Call 7: fillColor (semi-transparent)
        const fillColor = getRandomColor("semitransparent");

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // The _calculate... function already handles random positioning for each call.
        // In performance mode, each of the `instances` circles will have unique, random parameters.
        // No need for Math.random() here to further offset, as positions are already varied.

        ctx.fillAndStrokeCircle(drawCenterX, drawCenterY, radius, fillColor, strokeWidth, strokeColor);

        if (!isPerformanceRun) { 
            logs.push(
                `PreciseRandCircle ${i+1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'circle-m12-szMix-fSemi-sMix-sw1-4px-lytSpread-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Multiple Precise Random Circles (Stroked & Filled)',
        description: 'Tests rendering of 12 circles with precise pixel alignment, varied strokes and fills, and random positions.',
        displayName: 'Perf: 12 Precise RandCircles'
    }
); 
})();

(function() {
/**
* TEST SUMMARY:
* =================
*
* Description: Test with 8 circles, all parameters fully randomized.
*
*
* ---
*
* | Facet                  | Value          | Reason
* |------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------
* | Shape category         | circles        | The test draws circles using `ctx.fillAndStrokeCircle`.
* | Count                  | multi-8        | The test draws 8 instances in a loop (`numToDraw = isPerformanceRun ? instances : 8`).
* | SizeCategory           | mixed          | Radius is randomized as `15 + SR.get() * 50`, spanning `[15, 65)`, which covers both S (`16-39px`) and M (`40-79px`) size categories.
* | FillStyle              | opaque         | `getRandomColor()` is called for fill, which returns a fully opaque color (alpha=255) by default.
* | StrokeStyle            | opaque         | `getRandomColor()` is called for stroke, which returns a fully opaque color (alpha=255) by default.
* | StrokeThickness        | 1px-10px       | `strokeWidth` is `SR.get() * 10 + 1`, resulting in a continuous range of `[1, 11)`, i.e., 1px to 10px.
* | Layout                 | spread         | `getRandomPoint()` is called for each of the 8 circles, distributing them randomly across the canvas.
* | CenteredAt             | random         | `getRandomPoint()` returns floating-point coordinates with no specific alignment to pixel or grid centers.
* | EdgeAlignment          | not-crisp      | The test uses fully random, floating-point values for position, radius, and stroke, with no crisping logic applied.
* | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
* | ArcAngleExtent         | N/A            | Not applicable for circles.
* | RoundRectRadius        | N/A            | Not applicable for circles.
* | ContextTranslation     | none           | The code contains no calls to `ctx.translate()`.
* | ContextRotation        | none           | The code contains no calls to `ctx.rotate()`.
* | ContextScaling         | none           | The code contains no calls to `ctx.scale()`.
* | Clipped on shape       | none           | The code contains no calls to `ctx.clip()`.
* | Clipped on shape count | n/a            | Clipping is not used.
* | Clipped on shape arrangement | n/a      | Clipping is not used.
* | Clipped on shape size  | n/a            | Clipping is not used.
* | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
*
* ---
*
* UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
* ----------------------------------------------
* The precise randomization ranges for the fill color (`100, 200`) and stroke color (`200, 255`) are not captured in the filename.
*/

/**
 * @fileoverview Test definition for multiple fully random circles.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws multiple circles with fully random parameters (position, size, colors, stroke width).
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 8 circles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 8; // Original test draws 8

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Each parameter is generated fresh for each circle in the loop, ensuring randomness for all.
        
        // SeededRandom Call 1 & 2 (inside getRandomPoint for x, y)
        const center = getRandomPoint(1, canvasWidth, canvasHeight); 
        // SeededRandom Call 3: radius
        const radius = 15 + SeededRandom.getRandom() * 50; 
        // SeededRandom Call 4 & 5 for angles are skipped as we draw a full circle.
        // SeededRandom Call 6: strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        // SeededRandom Call 7: strokeColor
        const strokeColor = getRandomColor("mixed");
        // SeededRandom Call 8: fillColor
        const fillColor = getRandomColor("semitransparent");

        // In performance mode, getRandomPoint already ensures positions are varied across the canvas for each instance.
        // For visual regression, the 8 circles will also be randomly placed by getRandomPoint.
        let drawCenterX = center.x;
        let drawCenterY = center.y;

        if (isPerformanceRun && numToDraw > 1 && i > 0) {
            // While getRandomPoint already randomizes, explicitly use Math.random for subsequent perf instances for wider spread if desired.
            // However, the original getRandomPoint should already suffice for distribution.
            // For this test, as each circle is fully random, including its center from getRandomPoint,
            // additional Math.random() for position is not strictly necessary as in fixed-center tests.
            // The existing SR calls make each circle unique in all aspects.
        }

        ctx.fillAndStrokeCircle(drawCenterX, drawCenterY, radius, fillColor, strokeWidth, strokeColor);

        if (!isPerformanceRun) { // Log all 8 circles in visual regression mode
            logs.push(
                `FullyRandomCircle ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'circle-m8-szMix-fOpaq-sOpaq-sw1-10px-lytSpread-cenRand-edgeNotCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Circle: 8 fully random',
        displayName: 'Perf: 8 FullyRandom Circles',
        description: 'Performance of 8 fully random circles.'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests crisp rendering of a single 1px red stroked circle, centered at a grid crossing.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test draws a circle shape.
 * | Count                  | single         | The test draws a single instance of the shape in its primary visual mode.
 * | SizeCategory           | mixed          | The radius is randomized in the range [10, 74.5], which spans XS, S, and M size categories.
 * | FillStyle              | none           | No fill is applied; only a stroke operation is performed.
 * | StrokeStyle            | opaque         | The stroke color is explicitly set to be fully opaque (alpha = 255).
 * | StrokeThickness        | 1px            | The stroke width is hardcoded to 1 pixel.
 * | Layout                 | centered       | The shape is positioned at the canvas center.
 * | CenteredAt             | grid           | The center coordinates are integers (Math.floor), aligning the center to a grid intersection.
 * | EdgeAlignment          | crisp          | The test name specifies "crisp" and code uses `adjustDimensionsForCrispStrokeRendering`.
 * | Orientation            | N/A            | Circles are rotationally symmetric, so orientation is not an applicable facet.
 * | ArcAngleExtent         | N/A            | This facet is only applicable to arc shapes.
 * | RoundRectRadius        | N/A            | This facet is only applicable to rounded rectangle shapes.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not apply any clipping.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The specific stroke color is a fixed opaque red.
 * - When run in performance mode, the test draws multiple instances at random positions, which differs
 *   from the single, centered instance in visual test mode.
 *
 */

/**
 * @fileoverview Test definition for a single 1px stroked circle centered at a grid point.
 */

// Helper functions _colorObjectToString, placeCloseToCenterAtGrid, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Draws a single 1px stroked circle, centered at a grid point.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp grid-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        const baseDiameter = Math.floor(20 + SeededRandom.getRandom() * 130);
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseDiameter, baseDiameter, 1, { x: centerX, y: centerY });
        const finalDiameter = adjusted.width;
        const radius = finalDiameter / 2;
        
        // Stroke color is fixed red, opaque. Fill is transparent.
        const strokeColor = new Color(255, 0, 0, 255);

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }

        ctx.strokeCircle(drawCenterX, drawCenterY, radius, 1, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `Circle Centered@Grid: center=(${centerX},${centerY}), baseDiam=${baseDiameter}, adjDiam=${finalDiameter}, r=${radius.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // CheckData calculation from original add1PxStrokeCenteredCircleAtGrid
                // These are expected to be inclusive pixel coordinates
                checkData = {
                    leftX: centerX - radius - 0.5,
                    rightX: centerX + radius - 0.5,
                    topY: centerY - radius - 0.5,
                    bottomY: centerY + radius - 0.5
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenGrid-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        totalUniqueColors: 1,
        continuousStroke: true
    },
    {
        title: 'Single 1px Stroked Circle (Crisp, Centered at Grid)',
        description: 'Tests crisp rendering of a single 1px red stroked circle, centered at a grid crossing.',
        displayName: 'Perf: Circle 1px Crisp Grid Center'
        // The description above will also be used for the performance test registry entry.
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests crisp rendering of a single 1px red stroked circle, centered at a pixel center.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test draws a circle shape.
 * | Count                  | single         | The test draws a single shape instance in its primary visual mode.
 * | SizeCategory           | mixed          | The radius is randomized in a range of ~[10, 74.5], spanning the 'S' and 'M' size categories.
 * | FillStyle              | none           | The shape is not filled; only `ctx.strokeCircle()` is called.
 * | StrokeStyle            | opaque         | The stroke color is explicitly set with a full alpha value (255).
 * | StrokeThickness        | 1px            | The `lineWidth` parameter to `strokeCircle` is explicitly set to 1.
 * | Layout                 | centered       | The shape is positioned at the calculated center of the canvas.
 * | CenteredAt             | pixel          | The center coordinates are calculated as `floor(dimension / 2) + 0.5` to align with pixel centers.
 * | EdgeAlignment          | crisp          | The test uses `adjustDimensionsForCrispStrokeRendering` to ensure the final shape edges are sharp.
 * | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A            | Not applicable; this facet is for 'arc' shapes only.
 * | RoundRectRadius        | N/A            | Not applicable; this facet is for 'rounded-rect' shapes only.
 * | ContextTranslation     | none           | `ctx.translate()` is not used.
 * | ContextRotation        | none           | `ctx.rotate()` is not used.
 * | ContextScaling         | none           | `ctx.scale()` is not used.
 * | Clipped on shape       | none           | `ctx.clip()` is not used.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is a fixed, opaque red.
 * - In performance mode, the circle's position is randomized across the canvas, unlike the centered position in the single-instance visual test.
 *
 */

/**
 * @fileoverview Test definition for a single 1px stroked circle centered at a pixel.
 */

// Helper functions _colorObjectToString, placeCloseToCenterAtPixel, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Draws a single 1px stroked circle, centered at a pixel.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp pixel-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Determine center point (e.g., 100.5, 100.5 for pixel centering)
        // Adapting placeCloseToCenterAtPixel(canvasWidth, canvasHeight)
        const centerX = Math.floor(canvasWidth / 2) + 0.5;
        const centerY = Math.floor(canvasHeight / 2) + 0.5;

        // SeededRandom Call 1: diameter base
        const baseDiameter = Math.floor(20 + SeededRandom.getRandom() * 130);
        
        // Adjust dimensions for a 1px stroke centered at the pixel center
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseDiameter, baseDiameter, 1, { x: centerX, y: centerY });
        const finalDiameter = adjusted.width; 
        const radius = finalDiameter / 2;
        
        // Stroke color is fixed red, opaque. Fill is transparent.
        const strokeColor = new Color(255, 0, 0, 255);

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }

        ctx.strokeCircle(drawCenterX, drawCenterY, radius, 1, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `Circle Centered@Pixel: center=(${centerX},${centerY}), baseDiam=${baseDiameter}, adjDiam=${finalDiameter}, r=${radius.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // CheckData calculation from original add1PxStrokeCenteredCircleAtPixel
                checkData = {
                    leftX: centerX - radius - 0.5,
                    rightX: centerX + radius - 0.5,
                    topY: centerY - radius - 0.5,
                    bottomY: centerY + radius - 0.5
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenPx-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        totalUniqueColors: 1,
        continuousStroke: true
    },
    {
        title: 'Single 1px Stroked Circle (Crisp, Centered at Pixel)',
        description: 'Tests crisp rendering of a single 1px red stroked circle, centered at a pixel center.',
        displayName: 'Perf: Circle 1px Crisp Pixel Ctr'
        // The description above will also be used for the performance test registry entry.
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of a single circle with no stroke, only fill. The circle has randomized parameters for its radius and fill color. Its position is centered on the canvas, with the center's alignment randomly chosen to be either on the pixel grid (integer coordinates) or on the pixel center (*.5 coordinates) to test crisp rendering in both scenarios.
 *
 *
 * ---
 *
 * | Facet                        | Value              | Reason
 * |------------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category               | circles            | The test draws a circle using `ctx.fillCircle`.
 * | Count                        | single             | The test logic is designed to draw a single shape instance in its visual test mode.
 * | SizeCategory                 | mixed              | The radius is randomized in the range [10, 225), which spans multiple size categories (S, M, L, XL).
 * | FillStyle                    | opaque             | `getRandomColor()` is called without a specific alpha, resulting in a fully opaque fill.
 * | StrokeStyle                  | none               | The code explicitly sets `hasStroke = false` and `strokeWidth = 0`, and no stroke operation is performed.
 * | StrokeThickness              | none               | Follows from `StrokeStyle` being `none`; `strokeWidth` is 0.
 * | Layout                       | centered           | The circle's center is calculated relative to the canvas center, not at a random spread position.
 * | CenteredAt                   | mixed-pixel-grid   | The center is randomly chosen to be either on the pixel grid (e.g., (10, 20)) or on a pixel center (e.g., (10.5, 20.5)).
 * | EdgeAlignment                | crisp              | The code calls `adjustDimensionsForCrispStrokeRendering()` to ensure edges align with pixel boundaries.
 * | Orientation                  | N/A                | Not applicable to circles.
 * | ArcAngleExtent               | N/A                | Not applicable to circles.
 * | RoundRectRadius              | N/A                | Not applicable to rounded rectangles.
 * | ContextTranslation           | none               | The code does not call `ctx.translate()`.
 * | ContextRotation              | none               | The code does not call `ctx.rotate()`.
 * | ContextScaling               | none               | The code does not call `ctx.scale()`.
 * | Clipped on shape             | none               | The code does not call `ctx.clip()`.
 * | Clipped on shape count       | n/a                | No clipping is applied.
 * | Clipped on shape arrangement | n/a                | No clipping is applied.
 * | Clipped on shape size        | n/a                | No clipping is applied.
 * | Clipped on shape edge alignment | n/a             | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The specific randomization range for the radius is [10, 225).
 * - The fill color is randomized within the RGB range of [100, 200] for each channel.
 * - The "randpos-type" from the original filename is captured by the `CenteredAt` facet; it refers to the random choice between grid and pixel centering.
 *
 */
/**
 * @fileoverview Test definition for a single circle with no stroke and only fill.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single circle with no stroke, only fill.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-2 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: false,        // No stroke
            randomPosition: false    // Centered, not random positioning
        });
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 3: fillColor
        const fillColor = getRandomColor("semitransparent");

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }

        ctx.fillCircle(drawCenterX, drawCenterY, radius, fillColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `SingleNoStrokeCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, centerType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // effectiveRadius is just radius since strokeWidth is 0
                checkData = {
                    leftX: Math.floor(centerX - radius),
                    rightX: Math.floor(centerX - radius + radius * 2 - 1),
                    topY: Math.floor(centerY - radius),
                    bottomY: Math.floor(centerY - radius + radius * 2 - 1)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fOpaq-sNone-lytCenter-cenMixPG-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInFillEdges: true,
        totalUniqueColors: 1,
        speckles: true
    },
    {
        title: 'Single Circle Without Stroke (Crisp, Random Center Type)',
        description: 'Tests rendering of a single circle with no stroke, only fill, random params, and crisp center (grid or pixel).',
        displayName: 'Perf: Circle NoStroke Crisp RandCenterType'
        // The description above will also be used for the performance test registry entry.
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single randomly positioned circle with no stroke, random fill, and crisp rendering. The circle's radius and position are randomized within defined constraints.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test calls `ctx.fillCircle()` to draw the shape.
 * | Count                  | single         | The test logic is designed to draw one primary shape instance per iteration.
 * | SizeCategory           | mixed          | The radius is randomized in the range [10, 225], which spans the S, M, L, and XL size categories.
 * | FillStyle              | semitransparent| `getRandomColor("semitransparent")` is called for the fill, which returns a semitransparent color.
 * | StrokeStyle            | none           | The `strokeWidth` variable is explicitly set to 0 and no stroke operation is performed.
 * | StrokeThickness        | none           | Consistent with `StrokeStyle: none` as `strokeWidth` is 0.
 * | Layout                 | random         | A single shape is placed at a random (x, y) position within calculated canvas margins.
 * | CenteredAt             | random         | The final center coordinates (x, y) are fully randomized, not snapped to a grid or pixel center.
 * | EdgeAlignment          | crisp          | The test explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A            | Not applicable; this facet is for `arcs` only.
 * | RoundRectRadius        | N/A            | Not applicable; this facet is for `rounded-rects` only.
 * | ContextTranslation     | none           | The test does not call `ctx.translate()`.
 * | ContextRotation        | none           | The test does not call `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not call `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping region is defined or applied in this test.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The specific randomization range for the circle's radius is [10, 225]. The fill color is also randomized. The `randpos-explicit` part of the original filename refers to the specific logic that calculates a random position within safe canvas margins to ensure the entire shape is visible.
 *
 */

/**
 * @fileoverview Test definition for a single randomly positioned circle with no stroke.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single randomly positioned circle with no stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-4 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: false,        // No stroke
            randomPosition: true,    // Enable random positioning
            marginX: 10,
            marginY: 10
        });
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 5: fillColor
        const fillColor = getRandomColor("semitransparent");

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // The _calculate... function already handles random positioning for each call.
        // No additional Math.random() needed for spreading in performance mode unless overriding SR logic.

        ctx.fillCircle(drawCenterX, drawCenterY, radius, fillColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RandPosNoStrokeCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // effectiveRadius is just radius since strokeWidth is 0
                checkData = {
                    leftX: Math.floor(centerX - radius),
                    rightX: Math.floor(centerX - radius + radius * 2 - 1),
                    topY: Math.floor(centerY - radius),
                    bottomY: Math.floor(centerY - radius + radius * 2 - 1)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fOpaq-sNone-lytRand-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInFillEdges: true,
        totalUniqueColors: 1,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle Without Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with no stroke, random fill, and crisp center.',
        displayName: 'Perf: Circle RandPos NoStroke Crisp'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Test with a single circle, all parameters fully randomized.
 * 
 * 
 * ---
 * 
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | Draws a circle using ctx.fillAndStrokeCircle.
 * | Count                  | single         | The test is designed to draw one instance in its standard high-level test run.
 * | SizeCategory           | mixed          | The radius is randomized in the range [15, 65), which spans the S (16-39px) and M (40-79px) size categories.
 * | FillStyle              | opaque         | The fill color is generated by getRandomColor(), which produces an opaque color by default.
 * | StrokeStyle            | opaque         | The stroke color is generated by getRandomColor(), which produces an opaque color by default.
 * | StrokeThickness        | 1px-10px       | Stroke width is randomized in the float range [1.0, 11.0), which maps to this facet.
 * | Layout                 | random         | A single circle is placed at a random position on the canvas using getRandomPoint().
 * | CenteredAt             | random         | The circle's center coordinates are fully random floats, not aligned to the pixel or grid centers.
 * | EdgeAlignment          | not-crisp      | The use of random floating-point values for position, radius, and stroke width prevents crisp rendering.
 * | Orientation            | N/A            | Circles are symmetrical and have no inherent orientation.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to circles.
 * | RoundRectRadius        | N/A            | This facet is not applicable to circles.
 * | ContextTranslation     | none           | The test does not use ctx.translate().
 * | ContextRotation        | none           | The test does not use ctx.rotate().
 * | ContextScaling         | none           | The test does not use ctx.scale().
 * | Clipped on shape       | none           | The test does not apply any clipping.
 * | Clipped on shape count | n/a            | No clipping is applied.
 * | Clipped on shape arrangement | n/a      | No clipping is applied.
 * | Clipped on shape size  | n/a            | No clipping is applied.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Specific randomization ranges for radius, fill/stroke colors. strokeWidth: SR.get()*10+1 => [1,11) => 1-10px. Circle radius [15,65) spans S,M categories.
 * 
 */
/**
 * @fileoverview Test definition for a single circle with fully random parameters.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws a single circle with fully random parameters (position, size, colors, stroke width).
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1 & 2 (inside getRandomPoint for x, y)
        const center = getRandomPoint(1, canvasWidth, canvasHeight); 
        // SeededRandom Call 3: radius
        const radius = 15 + SeededRandom.getRandom() * 50; 
        // SeededRandom Call 4 & 5 for angles are skipped as we draw a full circle.
        // SeededRandom Call 6: strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        // SeededRandom Call 7: strokeColor
        const strokeColor = getRandomColor("semitransparent");
        // SeededRandom Call 8: fillColor
        const fillColor = getRandomColor("semitransparent");

        let drawCenterX = center.x;
        let drawCenterY = center.y;

        if (isPerformanceRun && numToDraw > 1) {
            // For multiple instances in perf mode, each already has fully random params including position.
            // No additional Math.random() needed to spread if each SR sequence produces a different center.
            // However, getRandomPoint(1, canvasWidth, canvasHeight) will ensure they are spread.
        }

        ctx.fillAndStrokeCircle(drawCenterX, drawCenterY, radius, fillColor, strokeWidth, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            logs.push(
                `FullyRandomCircle ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fOpaq-sOpaq-sw1-10px-lytRand-cenRand-edgeNotCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        totalUniqueColors: 3,
        //speckles: true,
        noGapsInStrokeEdges: true
    },
    {
        title: 'Circle: fully random',
        displayName: 'Perf: Circle FullyRandom',
        description: 'Performance of a single fully random circle.'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.
 * 
 * 
 * ---
 * 
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles            | The test focuses on rendering a circle.
 * | Count                  | single             | The test draws a single circle instance in its visual verification mode.
 * | SizeCategory           | mixed              | The radius is randomized in a range of [10, 225), which spans multiple T-shirt size categories (S, M, L, XL).
 * | FillStyle              | opaque             | `getRandomColor()` is called for the fill, which defaults to an opaque color (alpha=1.0).
 * | StrokeStyle            | opaque             | `getRandomColor()` is called for the stroke, which also defaults to an opaque color.
 * | StrokeThickness        | 1px-30px           | Stroke width is randomized with `1 + floor(SR.get()*min(30, baseRadius))`, resulting in a range of 1-30px.
 * | Layout                 | centered           | The circle's center coordinates are explicitly calculated to be at the canvas center.
 * | CenteredAt             | mixed-pixel-grid   | A random flag (`atPixel`) determines if the center is on a pixel (`*.5`) or grid (`integer`) line.
 * | EdgeAlignment          | crisp              | The `adjustDimensionsForCrispStrokeRendering()` function is explicitly called to ensure sharp edges.
 * | Orientation            | N/A                | Not applicable to circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A                | Not applicable to circles.
 * | RoundRectRadius        | N/A                | Not applicable to circles.
 * | ContextTranslation     | none               | `ctx.translate()` is not used in this test.
 * | ContextRotation        | none               | `ctx.rotate()` is not used in this test.
 * | ContextScaling         | none               | `ctx.scale()` is not used in this test.
 * | Clipped on shape       | none               | No clipping path is defined or applied in this test.
 * | Clipped on shape count | n/a                | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a          | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a                | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The randomization of the fill and stroke colors is not captured in the filename.
 * - The stroke width's dependency on the circle's radius (`Math.min(30, baseRadius)`) is a nuance not fully captured by the simple `1px-30px` range.
 * - The term "randpos-type" from the original filename referred to the random choice between grid-snapped and pixel-snapped centering, which is now captured by the `CenteredAt` facet.
 * 
 */

/**
 * @fileoverview Test definition for a single random circle with proper pixel alignment.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single random circle with proper pixel alignment.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-3 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: true,         // Has stroke
            minStrokeWidth: 1,
            maxStrokeWidth: 30,
            randomPosition: false,   // Centered, not randomly positioned
            marginX: 10,             // Default margins (not used since randomPosition=false)
            marginY: 10
        });
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 4: strokeColor
        const strokeColor = getRandomColor("semitransparent");
        // SR Call 5: fillColor
        const fillColor = getRandomColor("semitransparent");

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }

        ctx.fillAndStrokeCircle(drawCenterX, drawCenterY, radius, fillColor, strokeWidth, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `SingleRandomCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, centerType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                const effectiveRadius = radius + strokeWidth / 2;
                checkData = {
                    leftX: Math.floor(centerX - effectiveRadius),
                    rightX: Math.floor(centerX - effectiveRadius + effectiveRadius * 2 - 1),
                    topY: Math.floor(centerY - effectiveRadius),
                    bottomY: Math.floor(centerY - effectiveRadius + effectiveRadius * 2 - 1)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fOpaq-sOpaq-sw1-30px-lytCenter-cenMixPG-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInStrokeEdges: true,
        totalUniqueColors: 3,
        speckles: true
    },
    {
        title: 'Single Random Circle (Crisp, Random Center Type)',
        description: 'Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.',
        displayName: 'Perf: Circle SingleRand Crisp RandCenterType'
        // The description above will also be used for the performance test registry entry.
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Tests a single circle with fully randomized parameters for position, size, fill, and stroke. The final rendering is adjusted to ensure the circle's edges are crisp (pixel-aligned).
 * 
 * 
 * ---
 * 
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test draws circles using `ctx.fillAndStrokeCircle()`.
 * | Count                  | single         | The test is designed to draw a single circle instance in its primary visual test mode.
 * | SizeCategory           | mixed          | The `baseRadius` is randomized in a range of [10, 224], spanning multiple size categories (XS-XL).
 * | FillStyle              | semitransparent | `getRandomColor()` is called for the fill with an alpha bracket of [100, 200].
 * | StrokeStyle            | semitransparent | `getRandomColor()` is called for the stroke with an alpha bracket of [150, 230].
 * | StrokeThickness        | 1px-30px       | `strokeWidth` is randomized between a minimum of 1 and a maximum of 30.
 * | Layout                 | random         | The circle's final `(centerX, centerY)` is explicitly randomized within the canvas boundaries.
 * | CenteredAt             | random         | The final center coordinates are determined by the random layout and are not snapped to a grid or pixel.
 * | EdgeAlignment          | crisp          | The code calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | N/A            | Circles are rotationally symmetrical, so this facet is not applicable.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to circles.
 * | RoundRectRadius        | N/A            | This facet is not applicable to circles.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not use clipping.
 * | Clipped on shape count | n/a            | No clipping is used.
 * | Clipped on shape arrangement| n/a       | No clipping is used.
 * | Clipped on shape size  | n/a            | No clipping is used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The `strokeWidth` is randomized from 1px up to a maximum of 30px, but it's also capped by the `baseRadius` of the circle to prevent visual artifacts where the stroke is wider than the radius.
 * - The final position is randomized within the canvas boundaries while respecting a 10px margin.
 * 
 */

/**
 * @fileoverview Test definition for a single randomly positioned circle with stroke.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single randomly positioned circle with stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-5 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: true,         // Has stroke
            minStrokeWidth: 1,
            maxStrokeWidth: 30,
            randomPosition: true,    // Enable random positioning
            marginX: 10,
            marginY: 10
        });
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 6: strokeColor
        const strokeColor = getRandomColor("semitransparent");
        // SR Call 7: fillColor
        const fillColor = getRandomColor("semitransparent");

        // The centerX, centerY from params are already the final random positions for drawing.
        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // For performance test, if we draw many, their properties (radius, stroke, initial center type) are already varied by SeededRandom.
        // The calculateCircleTestParameters already ensures random positioning for each.
        // So, no additional Math.random() for x/y offset needed here unless we want to override the SR-based random positioning.
        // The current setup already provides good distribution and varied parameters per instance.

        ctx.fillAndStrokeCircle(drawCenterX, drawCenterY, radius, fillColor, strokeWidth, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RandPosCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                const effectiveRadius = radius + strokeWidth / 2;
                checkData = {
                    leftX: Math.floor(centerX - effectiveRadius),
                    rightX: Math.floor(centerX - effectiveRadius + effectiveRadius * 2 - 1),
                    topY: Math.floor(centerY - effectiveRadius),
                    bottomY: Math.floor(centerY - effectiveRadius + effectiveRadius * 2 - 1)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fSemi-sSemi-sw1-30px-lytRand-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInStrokeEdges: true,
        totalUniqueColors: 3,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle with Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with random params, crisp stroke/fill.',
        displayName: 'Perf: Circle RandPos Crisp'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: 15 lines, no fill, random stroke, random positions, random orientations.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine()`.
 * | Count                  | multi-15       | The test is configured to draw 15 lines in a loop for its visual regression mode.
 * | SizeCategory           | mixed          | Line start/end points are random within canvas bounds, so line length can vary greatly, spanning all size categories (XS-XL).
 * | FillStyle              | none           | The test only calls `ctx.strokeLine()` and does not use any fill operations.
 * | StrokeStyle            | mixed          | The stroke alpha is randomized in `[150, 255]`, resulting in both opaque (alpha=255) and semi-transparent strokes.
 * | StrokeThickness        | 1px-10px       | `ctx.lineWidth` is set to `Math.floor(SeededRandom.getRandom() * 10) + 1`, yielding an integer in the range [1, 10].
 * | Layout                 | spread         | Each line's start and end points are randomized independently, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to line primitives.
 * | EdgeAlignment          | not-crisp      | Line coordinates are fully random floating-point values with no logic to align them to pixel boundaries.
 * | Orientation            | random         | With both start and end points chosen randomly, the resulting line orientation is also random.
 * | ArcAngleExtent         | N/A            | This facet is only applicable to arc shapes.
 * | RoundRectRadius        | N/A            | This facet is only applicable to rounded rectangle shapes.
 * | ContextTranslation     | none           | The test code does not contain any calls to `ctx.translate()`.
 * | ContextRotation        | none           | The test code does not contain any calls to `ctx.rotate()`.
 * | ContextScaling         | none           | The test code does not contain any calls to `ctx.scale()`.
 * | Clipped on shape       | none           | The test code does not contain any calls to `ctx.clip()`.
 * | Clipped on shape count | n/a            | Clipping is not used in this test.
 * | Clipped on shape arrangement | n/a      | Clipping is not used in this test.
 * | Clipped on shape size  | n/a            | Clipping is not used in this test.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Stroke color has randomized RGB values and an alpha randomized in the range [150, 255]. strokeWidth: floor(SR.get()*10)+1 => 1-10px. Line length [1,~301) spans XS,S,M,L,XL.
 *
 */

/**
 * @fileoverview
 * Test definition for rendering multiple (typically 15 for visual regression,
 * 'instances' count for performance) lines with random thickness, color (including alpha),
 * positions, and orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines with varied properties.
 *   - `RenderTest` handles initial seeding of `SeededRandom.getRandom()`.
 * - `initialCount` Parameter:
 *   - Defines the number of lines for a standard visual test run.
 *   - Passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If provided (not null and > 0), signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - Logging is skipped, and `null` is returned in this mode.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering capability
 *     and visual variety, rather than precise checks.
 */

/**
 * Draws multiple lines with random properties (position, thickness, color).
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const initialCount = 15; // number of lines to draw for visual regression mode (i.e. not in performance mode)
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Use the existing getRandomPoint function with no margin to get points anywhere within canvas boundaries

    // Use existing getRandomColor function - Color instances have toCSS() method

    for (let i = 0; i < lineCount; i++) {
        const start = getRandomPoint(null, canvasWidth, canvasHeight, 0);
        const end = getRandomPoint(null, canvasWidth, canvasHeight, 0);
        const thickness = Math.floor(SeededRandom.getRandom() * 10) + 1; // Thickness 1 to 10
        const colorStr = getRandomColor("mixed").toCSS();

        ctx.lineWidth = thickness;
        ctx.strokeStyle = colorStr;
        // ctx.fillStyle is not relevant for lines unless they have caps that might be filled differently, which is not the case here.

        // --- Single Drawing Block ---
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; Random Line from (${start.x.toFixed(1)}, ${start.y.toFixed(1)}) to (${end.x.toFixed(1)}, ${end.y.toFixed(1)}) thickness: ${thickness}, color: ${colorStr}`);
        }
    }

    if (!isPerformanceRun && logs.length === 0 && lineCount > 0) {
        logs.push('Attempted to draw random lines, but none were generated in the loop.');
    } else if (!isPerformanceRun && lineCount === 0) {
        logs.push('No random lines drawn (lineCount was 0).');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m15-szMix-fNone-sMix-sw1-10px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
    },
    {
        title: 'Lines: Multi-15 No-Fill Random-Stroke Random-Pos Random-Orient',
        displayName: 'Perf: Lines Multi Random Props',
        description: 'Performance test for rendering multiple (default 15, or N from harness) lines with random properties.'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Renders 20 lines with 10px black opaque strokes at random positions and orientations. This test is used for both visual regression and performance measurement.
 * 
 * 
 * ---
 * 
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine`.
 * | Count                  | multi-20       | The test is configured to draw 20 lines in its standard visual regression mode.
 * | SizeCategory           | mixed          | Line length is determined by two random points, resulting in a variable length that spans multiple size categories.
 * | FillStyle              | none           | `ctx.fillStyle` is set to `rgba(0,0,0,0)`, meaning no fill is applied.
 * | StrokeStyle            | opaque         | `ctx.strokeStyle` is set to `rgb(0,0,0)`, which is fully opaque.
 * | StrokeThickness        | 10px           | `ctx.lineWidth` is explicitly set to the constant value `10`.
 * | Layout                 | spread         | 20 lines are drawn, each with independently randomized start/end points, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable for lines, which are defined by endpoints, not a geometric center.
 * | EdgeAlignment          | not-crisp      | The random start and end points result in angled lines that are inherently not pixel-aligned.
 * | Orientation            | random         | The orientation of each line is determined by its two random endpoints, resulting in random angles.
 * | ArcAngleExtent         | N/A            | Not an arc shape.
 * | RoundRectRadius        | N/A            | Not a rounded rectangle shape.
 * | ContextTranslation     | none           | The drawing context is not translated; no `ctx.translate()` is called.
 * | ContextRotation        | none           | The drawing context is not rotated; no `ctx.rotate()` is called.
 * | ContextScaling         | none           | The drawing context is not scaled; no `ctx.scale()` is called.
 * | Clipped on shape       | none           | No clipping region is defined or applied in this test.
 * | Clipped on shape count | n/a            | Not applicable as no clipping is used.
 * | Clipped on shape arrangement | n/a      | Not applicable as no clipping is used.
 * | Clipped on shape size  | n/a            | Not applicable as no clipping is used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The line length is randomized between 1 and ~301 pixels, which spans the XS, S, M, L, and XL size categories. 
 * The position and orientation are fully randomized within the canvas bounds. The stroke color is fixed black.
 */
/**
 * @fileoverview
 * Test definition for rendering multiple (typically 20 for visual regression,
 * 'instances' count for performance) 10px thick, black, opaque stroke lines
 * at random positions and with random orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines.
 *   - `currentIterationNumber` is used to seed `SeededRandom` if drawing the 'initialCount'
 *     of lines (e.g., for visual regression tests where reproducibility of the scene is key).
 *     However, for the core logic of getting random points for lines, this function
 *     directly uses `SeededRandom.getRandom()` as per standard practice, assuming
 *     `RenderTest` handles initial seeding.
 * - `initialCount` Parameter:
 *   - This parameter defines the number of lines to draw for a standard visual test run.
 *   - It's passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If `instances` is provided (not null and > 0), it signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - In this mode, logging is skipped, and `null` is returned.
 *   - `SeededRandom` is still used for coordinates to maintain the nature of the test,
 *     but the sheer number of operations is the focus.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering multiple
 *     lines without specific positional or color checks beyond visual comparison and
 *     performance measurement.
 */

/**
 * Draws multiple 10px thick, black, opaque lines at random positions.
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const initialCount = 20; // number of lines to draw for visual regression mode (i.e. not in performance mode)
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    // Set constant drawing properties
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgb(0,0,0)'; // Opaque black in RGB format
    ctx.fillStyle = 'rgba(0,0,0,0)'; // No fill for lines

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < lineCount; i++) {
        // Use the existing getRandomPoint function with no margin and integer precision to get points anywhere within canvas boundaries
        const start = getRandomPoint(0, canvasWidth, canvasHeight, 0);
        const end = getRandomPoint(0, canvasWidth, canvasHeight, 0);

        // --- Single Drawing Block ---
        // Using strokeLine as it's common in these tests.
        // Assumes it's available/polyfilled on ctx.
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; 10px Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        }
    }

    if (!isPerformanceRun && logs.length === 0) {
        // Ensure logs array is not empty if it wasn't a perf run but no lines were drawn (e.g. initialCount = 0)
        logs.push('No 10px black lines drawn.');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m20-szMix-fNone-sOpaq-sw10px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
    },
    {
        title: 'Lines: Multi-20 No-Fill 10px-Black-Opaque-Stroke Random-Pos Random-Orient',
        // Visual description will be default generated. The one in perf config is more specific to perf.
        displayName: 'Perf: Lines Multi 10px Black Random',
        description: 'Performance test for rendering multiple (default 20, or N from harness) 10px black lines at random positions.'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 20 black, 1px-thick lines. Each line has a randomly chosen start and end point, resulting in random positions, lengths, and orientations.
 *
 *
 * ---
 *
 * | Facet                        | Value          | Reason
 * |------------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category               | lines          | The test draws lines using `ctx.strokeLine` or `ctx.moveTo` and `ctx.lineTo`.
 * | Count                        | multi-20       | In its default visual test mode (`instances` is null), the script draws 20 lines in a loop.
 * | SizeCategory                 | mixed          | Line endpoints are randomized across the canvas, resulting in lengths that span multiple size categories.
 * | FillStyle                    | none           | The code sets `ctx.fillStyle` to be fully transparent `rgba(0, 0, 0, 0)` and no fill is applied.
 * | StrokeStyle                  | opaque         | `ctx.strokeStyle` is set to `'rgb(0, 0, 0)'`, which is a fully opaque black color.
 * | StrokeThickness              | 1px            | `ctx.lineWidth` is hardcoded to `1`.
 * | Layout                       | spread         | The test draws 20 lines with randomized start/end points, distributing them across the canvas.
 * | CenteredAt                   | N/A            | This facet is not applicable for line primitives.
 * | EdgeAlignment                | not-crisp      | Line endpoints are random floating-point coordinates, resulting in non-crisp, anti-aliased rendering.
 * | Orientation                  | random         | Both start and end points are chosen randomly, leading to random line orientations.
 * | ArcAngleExtent               | N/A            | This facet only applies to `arc` shapes.
 * | RoundRectRadius              | N/A            | This facet only applies to `rounded-rect` shapes.
 * | ContextTranslation           | none           | The test code does not contain any calls to `ctx.translate()`.
 * | ContextRotation              | none           | The test code does not contain any calls to `ctx.rotate()`.
 * | ContextScaling               | none           | The test code does not contain any calls to `ctx.scale()`.
 * | Clipped on shape             | none           | The test code does not contain any calls to `ctx.clip()`.
 * | Clipped on shape count       | n/a            | Not applicable as no clipping is performed.
 * | Clipped on shape arrangement | n/a            | Not applicable as no clipping is performed.
 * | Clipped on shape size        | n/a            | Not applicable as no clipping is performed.
 * | Clipped on shape edge alignment | n/a         | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The line length is randomized, resulting in a range of approximately [1, ~301) pixels on a 300x150 canvas,
 * which spans all size categories from XS to XL. The position and orientation are also fully randomized for each line.
 *
 */

/**
 * @fileoverview Test definition for rendering multiple (20 by default) 1px thick, black, opaque
 * lines with random start/end points. Supports a parameter to vary the number of instances.
 *
 * Guiding Principles for this function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - The number of lines drawn can be controlled by the 'instances' parameter.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Each line's position is determined randomly using `getRandomPoint` (which relies on `SeededRandom`).
 *     No additional `Math.random()` offsets are applied on top of this, as the inherent randomness
 *     of `getRandomPoint` serves the purpose for this specific test.
 * - Single Instance / Default Behavior (when 'instances' is null, 0, or negative):
 *   - If 'instances' is null (default), 20 lines are drawn, and logs are collected (matches original behavior).
 *   - If 'instances' is 0 or negative, 1 line is drawn, and logs are collected (for a minimal single run).
 *   - `SeededRandom` (via `getRandomPoint`) is used for all random elements to ensure test reproducibility.
 *   - Returns { logs: string[] }.
 */

/**
 * Draws a specified number of 1px thick, black, opaque lines with random start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @param {?number} instances - Number of lines to draw. If null, defaults to 20.
 *                              If > 0, this many lines are drawn without logging.
 *                              If 0 or negative, 1 line is drawn with logging.
 * @returns {?{ logs: string[] }} Log entries if not in multi-instance mode (instances > 0), otherwise null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isTrueMultiInstance = instances !== null && instances > 0;
    let numIterations;

    if (isTrueMultiInstance) {
        numIterations = instances;
    } else if (instances === null) {
        numIterations = 20; // Default original behavior
    } else { // instances <= 0
        numIterations = 1; // Minimal single run with logging
    }

    let logs = isTrueMultiInstance ? null : [];

    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    // Assume getRandomPoint is available globally (from scene-creation-utils.js).

    // Set fixed drawing properties
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(0, 0, 0)'; // Black
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // No fill

    for (let i = 0; i < numIterations; i++) {
        // getRandomPoint uses SeededRandom for reproducibility of base characteristics.
        // Use margin=0 so lines can extend to canvas edges (matching 5px/10px tests)
        const start = isTrueMultiInstance ?
            {
                x: Math.random() * currentCanvasWidth,
                y: Math.random() * currentCanvasHeight
            } :
            getRandomPoint(0, currentCanvasWidth, currentCanvasHeight, 0);

        const end = isTrueMultiInstance ?
            {
                x: Math.random() * currentCanvasWidth,
                y: Math.random() * currentCanvasHeight
            } :
            getRandomPoint(0, currentCanvasWidth, currentCanvasHeight, 0);

        // Draw the line using the canvas-like API
        if (typeof ctx.strokeLine === 'function') {
            ctx.strokeLine(start.x, start.y, end.x, end.y);
        } else {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }

        if (!isTrueMultiInstance) {
            logs.push(`&#x2500; 1px Black line from (${start.x.toFixed(1)}, ${start.y.toFixed(1)}) to (${end.x.toFixed(1)}, ${end.y.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (isTrueMultiInstance) {
        return null;
    } else {
        return { logs: logs }; // No checkData in this specific test's original design
    }
}

// Register the test
registerHighLevelTest(
    'line-m20-szMix-fNone-sOpaq-sw1px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
        // No drawFunctionArgs needed as the draw function handles null instances to draw 20 lines.
    },
    {
        title: 'Lines: Multi-20 No-Fill 1px-Black-Opaque-Stroke Random-Pos Random-Orient',
        description: 'Tests rendering of 20 black lines (1px width) with random positions/orientations using canvas code.',
        displayName: 'Perf: Lines Multi-20 1px Random'
        // The description above will also be used for the performance test registry entry.
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Renders 20 lines with a 2px black opaque stroke. The lines have random positions and orientations.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws primitives using `ctx.strokeLine()`.
 * | Count                  | multi-20       | The test is configured to draw 20 instances in its standard visual regression mode (`initialCount = 20`).
 * | SizeCategory           | mixed          | Line length is determined by two random points on the canvas, so it can span multiple size categories (XS-XL).
 * | FillStyle              | none           | `ctx.fillStyle` is explicitly set to be fully transparent (`rgba(0,0,0,0)`), and only a stroke operation is performed.
 * | StrokeStyle            | opaque         | `ctx.strokeStyle` is set to `'rgb(0,0,0)'`, which is fully opaque.
 * | StrokeThickness        | 2px            | `ctx.lineWidth` is hardcoded to `2`.
 * | Layout                 | spread         | Multiple lines are drawn with their start and end points chosen randomly, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to lines, which are defined by start and end points, not a center.
 * | EdgeAlignment          | not-crisp      | Lines are drawn at random (often oblique) angles, which inherently prevents crisp pixel grid alignment.
 * | Orientation            | random         | The line's orientation is determined by its two randomly selected endpoints, resulting in a random orientation.
 * | ArcAngleExtent         | N/A            | This facet is only applicable to arc shapes.
 * | RoundRectRadius        | N/A            | This facet is only applicable to rounded rectangle shapes.
 * | ContextTranslation     | none           | The test code does not contain any calls to `ctx.translate()`.
 * | ContextRotation        | none           | The test code does not contain any calls to `ctx.rotate()`.
 * | ContextScaling         | none           | The test code does not contain any calls to `ctx.scale()`.
 * | Clipped on shape       | none           | The test code does not contain any calls to `ctx.clip()`.
 * | Clipped on shape count | n/a            | Clipping is not used in this test.
 * | Clipped on shape arrangement | n/a      | Clipping is not used in this test.
 * | Clipped on shape size  | n/a            | Clipping is not used in this test.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Line length is randomized from 0 to the canvas diagonal length, spanning multiple size categories (XS-XL). Position and orientation are randomized.
 *
 */
/**
 * @fileoverview
 * Test definition for rendering multiple (typically 20 for visual regression,
 * 'instances' count for performance) 2px thick, black, opaque stroke lines
 * at random positions and with random orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines.
 *   - `currentIterationNumber` is used to seed `SeededRandom` if drawing the 'initialCount'
 *     of lines (e.g., for visual regression tests where reproducibility of the scene is key).
 *     However, for the core logic of getting random points for lines, this function
 *     directly uses `SeededRandom.getRandom()` as per standard practice, assuming
 *     `RenderTest` handles initial seeding.
 * - `initialCount` Parameter:
 *   - This parameter defines the number of lines to draw for a standard visual test run.
 *   - It's passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If `instances` is provided (not null and > 0), it signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - In this mode, logging is skipped, and `null` is returned.
 *   - `SeededRandom` is still used for coordinates to maintain the nature of the test,
 *     but the sheer number of operations is the focus.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering multiple
 *     lines without specific positional or color checks beyond visual comparison and
 *     performance measurement.
 */

/**
 * Draws multiple 2px thick, black, opaque lines at random positions.
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const initialCount = 20; // number of lines to draw for visual regression mode (i.e. not in performance mode)
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    // Set constant drawing properties
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(0,0,0)'; // Opaque black in RGB format
    ctx.fillStyle = 'rgba(0,0,0,0)'; // No fill for lines

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < lineCount; i++) {
        // Use the existing getRandomPoint function with no margin and integer precision to get points anywhere within canvas boundaries
        const start = getRandomPoint(0, canvasWidth, canvasHeight, 0);
        const end = getRandomPoint(0, canvasWidth, canvasHeight, 0);

        // --- Single Drawing Block ---
        // Using strokeLine as it's common in these tests.
        // Assumes it's available/polyfilled on ctx.
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; 2px Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        }
    }

    if (!isPerformanceRun && logs.length === 0) {
        // Ensure logs array is not empty if it wasn't a perf run but no lines were drawn (e.g. initialCount = 0)
        logs.push('No 2px black lines drawn.');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m20-szMix-fNone-sOpaq-sw2px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
    },
    {
        title: 'Lines: Multi-20 No-Fill 2px-Black-Opaque-Stroke Random-Pos Random-Orient',
        displayName: 'Perf: Lines Multi 2px Black Random',
        description: 'Performance test for rendering multiple (default 20, or N from harness) 2px black lines at random positions.'
    }
); 
})();

(function() {
/**
* TEST SUMMARY:
* =================
*
* Description: Renders 20 lines with a 3px black opaque stroke. The position and orientation of each line are fully randomized.
*
*
* ---
*
* | Facet                  | Value          | Reason
* |------------------------|----------------|-----------------------------------------------------------------------------------------------------
* | Shape category         | lines          | The test draws line primitives using ctx.strokeLine().
* | Count                  | multi-20       | The test is configured to draw 20 lines in a standard visual test run (initialCount = 20).
* | SizeCategory           | mixed          | Line length is randomized from 0 to canvas diagonal, spanning multiple size categories (XS-XL).
* | FillStyle              | none           | The code explicitly sets fillStyle to transparent ('rgba(0,0,0,0)') and does not call fill methods.
* | StrokeStyle            | opaque         | The code sets strokeStyle to an opaque color ('rgb(0,0,0)').
* | StrokeThickness        | 3px            | The code hardcodes ctx.lineWidth = 3.
* | Layout                 | spread         | Each of the 20 lines has its start/end points randomized, spreading them across the canvas.
* | CenteredAt             | N/A            | This facet is not applicable to lines.
* | EdgeAlignment          | not-crisp      | Endpoints are random integers and lines are not axis-aligned; no specific crisping logic is applied.
* | Orientation            | random         | Both start and end points of each line are chosen randomly, resulting in random orientations.
* | ArcAngleExtent         | N/A            | This facet is not applicable to lines.
* | RoundRectRadius        | N/A            | This facet is not applicable to lines.
* | ContextTranslation     | none           | The code does not use ctx.translate().
* | ContextRotation        | none           | The code does not use ctx.rotate().
* | ContextScaling         | none           | The code does not use ctx.scale().
* | Clipped on shape       | none           | The code does not create or apply any clipping regions.
* | Clipped on shape count | n/a            | Not applicable as there is no clipping.
* | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
* | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
* | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
*
* ---
*
* UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
* ----------------------------------------------
* The primary uncaptured aspect is the specific randomization range for the line length. Since start and end points
* are chosen randomly anywhere on the canvas, the length can vary from 0 up to the canvas diagonal length, which
* is why SizeCategory is 'mixed'.
*
*/

/**
 * @fileoverview
 * Test definition for rendering multiple (typically 20 for visual regression,
 * 'instances' count for performance) 3px thick, black, opaque stroke lines
 * at random positions and with random orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines.
 *   - `currentIterationNumber` is used to seed `SeededRandom` if drawing the 'initialCount'
 *     of lines (e.g., for visual regression tests where reproducibility of the scene is key).
 *     However, for the core logic of getting random points for lines, this function
 *     directly uses `SeededRandom.getRandom()` as per standard practice, assuming
 *     `RenderTest` handles initial seeding.
 * - `initialCount` Parameter:
 *   - This parameter defines the number of lines to draw for a standard visual test run.
 *   - It's passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If `instances` is provided (not null and > 0), it signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - In this mode, logging is skipped, and `null` is returned.
 *   - `SeededRandom` is still used for coordinates to maintain the nature of the test,
 *     but the sheer number of operations is the focus.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering multiple
 *     lines without specific positional or color checks beyond visual comparison and
 *     performance measurement.
 */

/**
 * Draws multiple 3px thick, black, opaque lines at random positions.
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const initialCount = 20; // number of lines to draw for visual regression mode (i.e. not in performance mode)
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    // Set constant drawing properties
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgb(0,0,0)'; // Opaque black in RGB format
    ctx.fillStyle = 'rgba(0,0,0,0)'; // No fill for lines

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < lineCount; i++) {
        // Use the existing getRandomPoint function with no margin and integer precision to get points anywhere within canvas boundaries
        const start = getRandomPoint(0, canvasWidth, canvasHeight, 0);
        const end = getRandomPoint(0, canvasWidth, canvasHeight, 0);

        // --- Single Drawing Block ---
        // Using strokeLine as it's common in these tests.
        // Assumes it's available/polyfilled on ctx.
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; 3px Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        }
    }

    if (!isPerformanceRun && logs.length === 0) {
        // Ensure logs array is not empty if it wasn't a perf run but no lines were drawn (e.g. initialCount = 0)
        logs.push('No 3px black lines drawn.');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m20-szMix-fNone-sOpaq-sw3px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
    },
    {
        title: 'Lines: Multi-20 No-Fill 3px-Black-Opaque-Stroke Random-Pos Random-Orient',
        displayName: 'Perf: Lines Multi 3px Black Random',
        description: 'Performance test for rendering multiple (default 20, or N from harness) 3px black lines at random positions.'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Renders 20 lines with a 5px black opaque stroke at random positions and with random orientations.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine`.
 * | Count                  | multi-20       | The test is configured to draw 20 lines in its default visual regression mode (`initialCount = 20`).
 * | SizeCategory           | mixed          | Line length is determined by two random points on the canvas, leading to a wide, unpredictable range of lengths that spans multiple size categories (XS to XL).
 * | FillStyle              | none           | Lines do not have a fill, and `ctx.fillStyle` is set to be fully transparent. Only a stroke operation is performed.
 * | StrokeStyle            | opaque         | The stroke color is explicitly set to `rgb(0,0,0)`, which is fully opaque.
 * | StrokeThickness        | 5px            | The context's `lineWidth` is hardcoded to 5.
 * | Layout                 | spread         | The start and end points for each of the 20 lines are chosen randomly, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to lines, as their primary anchor points are their ends, not a geometric center.
 * | EdgeAlignment          | not-crisp      | The line coordinates are random integers and the stroke width is odd (5px). No crisping logic is applied, so the final rendered edges are not guaranteed to align with pixel boundaries.
 * | Orientation            | random         | With both start and end points chosen randomly for each line, the resulting orientation is also random.
 * | ArcAngleExtent         | N/A            | Not applicable to lines.
 * | RoundRectRadius        | N/A            | Not applicable to lines.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not apply any clipping regions.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The line length is randomized from 0 up to the canvas diagonal length. The stroke color is fixed to opaque black.
 *
 */

/**
 * @fileoverview
 * Test definition for rendering multiple (typically 20 for visual regression,
 * 'instances' count for performance) 5px thick, black, opaque stroke lines
 * at random positions and with random orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines.
 *   - `currentIterationNumber` is used to seed `SeededRandom` if drawing the 'initialCount'
 *     of lines (e.g., for visual regression tests where reproducibility of the scene is key).
 *     However, for the core logic of getting random points for lines, this function
 *     directly uses `SeededRandom.getRandom()` as per standard practice, assuming
 *     `RenderTest` handles initial seeding.
 * - `initialCount` Parameter:
 *   - This parameter defines the number of lines to draw for a standard visual test run.
 *   - It's passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If `instances` is provided (not null and > 0), it signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - In this mode, logging is skipped, and `null` is returned.
 *   - `SeededRandom` is still used for coordinates to maintain the nature of the test,
 *     but the sheer number of operations is the focus.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering multiple
 *     lines without specific positional or color checks beyond visual comparison and
 *     performance measurement.
 */

/**
 * Draws multiple 5px thick, black, opaque lines at random positions.
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const initialCount = 20; // number of lines to draw for visual regression mode (i.e. not in performance mode)
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    // Set constant drawing properties
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgb(0,0,0)'; // Opaque black in RGB format
    ctx.fillStyle = 'rgba(0,0,0,0)'; // No fill for lines

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < lineCount; i++) {
        // Use the existing getRandomPoint function with no margin and integer precision to get points anywhere within canvas boundaries
        const start = getRandomPoint(0, canvasWidth, canvasHeight, 0);
        const end = getRandomPoint(0, canvasWidth, canvasHeight, 0);

        // --- Single Drawing Block ---
        // Using strokeLine as it's common in these tests.
        // Assumes it's available/polyfilled on ctx.
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; 5px Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        }
    }

    if (!isPerformanceRun && logs.length === 0) {
        // Ensure logs array is not empty if it wasn't a perf run but no lines were drawn (e.g. initialCount = 0)
        logs.push('No 5px black lines drawn.');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m20-szMix-fNone-sOpaq-sw5px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
    },
    {
        title: 'Lines: Multi-20 No-Fill 5px-Black-Opaque-Stroke Random-Pos Random-Orient',
        displayName: 'Perf: Lines Multi 5px Black Random',
        description: 'Performance test for rendering multiple (default 20, or N from harness) 5px black lines at random positions.'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single, horizontal line with a 1px opaque stroke. The line's length is randomized but falls within a range spanning S, M, and L size categories. It is programmatically centered on the canvas and positioned on a half-pixel Y-coordinate to ensure it renders crisply.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine`.
 * | Count                  | single         | The test is designed to draw one line in its primary visual testing mode (`instances` is null).
 * | SizeCategory           | mixed          | Line length is randomized in `[20, 149]`, spanning S (16-39), M (40-79), and L (80-159) categories.
 * | FillStyle              | none           | No fill operation is performed.
 * | StrokeStyle            | opaque         | Stroke is set to a fully opaque color: `rgb(255, 0, 0)`.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is explicitly set to `1`.
 * | Layout                 | centered       | The line's base position is calculated relative to the canvas center.
 * | CenteredAt             | N/A            | Facet is not applicable to lines.
 * | EdgeAlignment          | crisp          | The vertical position is set to `y + 0.5`, a key technique for crisp horizontal 1px lines.
 * | Orientation            | horizontal     | The line is drawn with a constant Y-coordinate, making it perfectly horizontal.
 * | ArcAngleExtent         | N/A            | Not an arc.
 * | RoundRectRadius        | N/A            | Not a rounded rectangle.
 * | ContextTranslation     | none           | The code does not use `ctx.translate()`.
 * | ContextRotation        | none           | The code does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The code does not use `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping is performed.
 * | Clipped on shape count | n/a            | No clipping.
 * | Clipped on shape arrangement | n/a      | No clipping.
 * | Clipped on shape size  | n/a            | No clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is fixed as opaque red (`rgb(255, 0, 0)`).
 * - For reproducibility in single-instance mode, all random values (line length, start/end point swapping) are derived from `SeededRandom`.
 *
 */
/**
 * @fileoverview Test definition for rendering a medium-sized, horizontal, 1px thick,
 * opaque stroke line positioned precisely between pixels.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - Drawing logic is consolidated into a single loop to handle both single and multiple instances,
 *     reducing code duplication.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Positional offsets for each instance are applied directly to the primitive's coordinates
 *     (e.g., line endpoints) rather than using canvas transformations (like `ctx.translate()`).
 *   - The random offsets for these multiple instances are generated using `Math.random()` for simplicity
 *     and potential performance benefits, as the exact reproducibility of these specific offsets
 *     is not considered critical for this mode. The base primitive's characteristics remain
 *     reproducible via `SeededRandom` for the single instance case or base calculations.
 *   - Offsets are integers and aim to keep the primitive visible within the canvas.
 * - Single Instance (when 'instances' is null or <= 0):
 *   - Original behavior is maintained: logs are collected, and checkData is returned.
 *   - `SeededRandom` is used for all random elements to ensure test reproducibility.
 */

/**
 * Draws a single, 1px thick, fully opaque horizontal line centered vertically
 * between pixels, with variable width and potentially swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here but required by signature).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations for base line (using SeededRandom for reproducibility)
    const baseLineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2);
    const baseCenterY = Math.floor(effectiveHeight / 2) + 0.5; // Key: centered *between* pixels vertically
    const baseLeftX = Math.floor(baseCenterX - baseLineWidth / 2);
    const baseRightX = baseLeftX + baseLineWidth;
    const basePixelY = Math.floor(baseCenterY); // The single pixel row involved

    // Set drawing properties once
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentStartX, currentEndX, currentCenterY; // For drawing, declared outside loop for single instance checkData access

    for (let i = 0; i < numIterations; i++) {
        let startX = baseLeftX; // Loop-local for clarity of base points per iteration
        let endX = baseRightX;
        
        // Randomly swap start/end points using SeededRandom for base primitive
        if (SeededRandom.getRandom() < 0.5) {
            [startX, endX] = [endX, startX];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentStartX = startX;
        currentEndX = endX;
        currentCenterY = baseCenterY; // centerY is fixed for a horizontal line

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical.
            const maxOffsetX = effectiveWidth - Math.max(currentStartX, currentEndX);
            const minOffsetX = -Math.min(currentStartX, currentEndX);
            const maxOffsetY = effectiveHeight - 1 - currentCenterY; // -1 because line is on pixel Y
            const minOffsetY = -Math.floor(currentCenterY);

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentStartX += offsetX;
            currentEndX += offsetX;
            currentCenterY += offsetY;
        }

        // --- Single Drawing Block ---
        // Original code used ctx.strokeLine directly. Let's assume it's available or polyfilled.
        ctx.strokeLine(currentStartX, currentCenterY, currentEndX, currentCenterY);
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            logs.push(`&#x2500; 1px Red line from (${currentStartX.toFixed(1)}, ${currentCenterY.toFixed(1)}) to (${currentEndX.toFixed(1)}, ${currentCenterY.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (!isMultiInstance) {
        // For single instance, extremes are based on the un-offsetted line from the single iteration.
        // currentStartX, currentEndX, and basePixelY (derived from baseCenterY) are used.
        const extremes = {
            topY: basePixelY,
            bottomY: basePixelY,
            leftX: Math.min(currentStartX, currentEndX), // Values from the single loop iteration
            rightX: Math.max(currentStartX, currentEndX) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null;
    }
}

// Register the test
registerHighLevelTest(
    'line-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-edgeCrisp-ornHoriz-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        uniqueColors: { 
            middleRow: { count: 1 },
            middleColumn: { count: 1 } // Added MiddleColumn
        }, 
        extremes: true
    },
    {
        title: 'Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Horizontal',
        description: 'Tests crisp rendering of a horizontal 1px line centered between pixels using canvas code.',
        displayName: 'Perf: Lines M 1px Crisp Horizontal'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests the crisp rendering of a single, vertical 1px opaque red line. The line is centered on the canvas, and its length is randomized across S, M, and L size categories. Its horizontal position is set between pixels to test for correct pixel snapping.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws line primitives.
 * | Count                  | single         | The test draws a single line instance in its primary visual mode.
 * | SizeCategory           | mixed          | The line's length is randomized in the range `[20, 149]`, which spans the S `(16-39px)`, M `(40-79px)`, and L `(80-159px)` size categories.
 * | FillStyle              | none           | No fill is applied to the line; `ctx.fillStyle` is set to be fully transparent.
 * | StrokeStyle            | opaque         | The line is stroked with an opaque color (`rgb(255, 0, 0)`), which has an alpha of 1.0.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is explicitly set to `1`.
 * | Layout                 | centered       | The line's geometric center is positioned at the center of the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to lines, as their position is defined by endpoints, not a center point in the same way as circles or rectangles.
 * | EdgeAlignment          | crisp          | The line is vertical and its `x` coordinate is set to a `.5` value (`Math.floor(width / 2) + 0.5`), a key technique for ensuring a 1px vertical line renders crisply on a single column of pixels.
 * | Orientation            | vertical       | The line is drawn with identical start and end `x` coordinates.
 * | ArcAngleExtent         | N/A            | Not applicable to lines.
 * | RoundRectRadius        | N/A            | Not applicable to lines.
 * | ContextTranslation     | none           | The code does not use `ctx.translate()`.
 * | ContextRotation        | none           | The code does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The code does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The code does not use `ctx.clip()`.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The stroke color is hardcoded to be opaque red (`rgb(255, 0, 0)`), which is more specific than the `sOpaq` facet value implies.
 *
 */

/**
 * @fileoverview Test definition for rendering a medium-sized, vertical, 1px thick,
 * opaque stroke line positioned precisely between pixels horizontally.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - Drawing logic is consolidated into a single loop to handle both single and multiple instances,
 *     reducing code duplication.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Positional offsets for each instance are applied directly to the primitive's coordinates
 *     (e.g., line endpoints) rather than using canvas transformations (like `ctx.translate()`).
 *   - The random offsets for these multiple instances are generated using `Math.random()` for simplicity
 *     and potential performance benefits, as the exact reproducibility of these specific offsets
 *     is not considered critical for this mode. The base primitive's characteristics remain
 *     reproducible via `SeededRandom` for the single instance case or base calculations.
 *   - Offsets are integers and aim to keep the primitive visible within the canvas.
 * - Single Instance (when 'instances' is null or <= 0):
 *   - Original behavior is maintained: logs are collected, and checkData is returned.
 *   - `SeededRandom` is used for all random elements to ensure test reproducibility.
 */

/**
 * Draws a single, 1px thick, fully opaque vertical line centered horizontally
 * between pixels, with variable height and potentially swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here but required by signature).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    // Use context dimensions
    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations
    const baseLineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2) + 0.5; // Key: centered *between* pixels horizontally
    const baseCenterY = Math.floor(effectiveHeight / 2);
    const baseTopY = Math.floor(baseCenterY - baseLineHeight / 2);
    const baseBottomY = baseTopY + baseLineHeight; // Canvas lines go up to, but don't include, the end coordinate pixel row for vertical lines.
    const basePixelX = Math.floor(baseCenterX); // The single pixel column involved

    // Set drawing properties once
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Blue, matching original vertical line test
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentCenterX; // Declared outside the loop
    let currentStartY;  // Declared outside the loop
    let currentEndY;    // Declared outside the loop

    for (let i = 0; i < numIterations; i++) {
        let startY = baseTopY; // These are loop-local for clarity of base points per iteration
        let endY = baseBottomY;
        // Randomly swap start/end points for variety (even for single instance)
        if (SeededRandom.getRandom() < 0.5) {
            [startY, endY] = [endY, startY];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentCenterX = baseCenterX;
        currentStartY = startY;
        currentEndY = endY;

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical;
            // speed and simplicity are preferred here.
            const maxOffsetX = effectiveWidth - 1 - currentCenterX; // Use currentCenterX for bounds
            const minOffsetX = -Math.floor(currentCenterX);
            const unoffsettedMaxY = Math.max(startY, endY);
            const unoffsettedMinY = Math.min(startY, endY);
            const maxOffsetY = effectiveHeight - unoffsettedMaxY; 
            const minOffsetY = -unoffsettedMinY;

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentCenterX += offsetX;
            currentStartY += offsetY;
            currentEndY += offsetY;
        }
        // No 'else' block needed here anymore as currentStartY/EndY will hold the correct single-instance values

        // --- Single Drawing Block --- 
        if (typeof ctx.strokeLine === 'function') {
            ctx.strokeLine(currentCenterX, currentStartY, currentCenterX, currentEndY);
        } else {
            ctx.beginPath();
            ctx.moveTo(currentCenterX, currentStartY);
            ctx.lineTo(currentCenterX, currentEndY);
            ctx.stroke();
        }
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            // Log only for the single instance case
            logs.push(`&#x2500; 1px Red line from (${currentCenterX.toFixed(1)}, ${currentStartY.toFixed(1)}) to (${currentCenterX.toFixed(1)}, ${currentEndY.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    // Return results
    if (!isMultiInstance) {
        // Calculate and return the expected extremes (inclusive pixel coordinates)
        // currentStartY and currentEndY hold the values from the single loop iteration
        const extremes = {
            leftX: basePixelX,
            rightX: basePixelX,
            topY: Math.min(currentStartY, currentEndY),
            bottomY: Math.max(currentStartY, currentEndY) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null; // No logs or checkData for multiple instances
    }
}

// Register the test
registerHighLevelTest(
    'line-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-edgeCrisp-ornVert-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        uniqueColors: {
            middleRow: { count: 1 },
            middleColumn: { count: 1 } // Added MiddleColumn
        }, 
        extremes: true
    },
    {
        title: 'Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Vertical',
        description: 'Tests crisp rendering of a vertical 1px line centered between pixels using canvas code.',
        displayName: 'Perf: Lines M 1px Crisp Vertical'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests the crisp rendering of a single horizontal 2px line. The line has a fixed opaque red stroke, no fill, and is centered on the canvas at an integer Y-coordinate (grid line). Its length is randomized, spanning multiple t-shirt size categories (S, M, L).
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | line           | The test draws line primitives using `strokeLine` or `moveTo/lineTo`.
 * | Count                  | single         | The test's primary mode draws one instance per run.
 * | SizeCategory           | mixed          | The code `Math.floor(20 + SeededRandom.getRandom() * 130)` generates a length of [20, 149], which spans the S, M, and L size categories.
 * | FillStyle              | none           | `fillStyle` is explicitly set to transparent and no fill operation is performed.
 * | StrokeStyle            | opaque         | `strokeStyle` is set to `'rgb(255, 0, 0)'`, which is a fully opaque color.
 * | StrokeThickness        | 2px            | `lineWidth` is hardcoded to `2`.
 * | Layout                 | centered       | The line's start and end points are calculated relative to the canvas center.
 * | CenteredAt             | N/A            | This facet is not applicable to line primitives.
 * | EdgeAlignment          | crisp          | The combination of a horizontal orientation, an even `lineWidth` (2px), and an integer Y-coordinate for the center ensures the stroke perfectly covers two pixel rows without anti-aliasing.
 * | Orientation            | horizontal     | The line is drawn with a constant Y-coordinate for both its start and end points.
 * | ArcAngleExtent         | N/A            | Not an arc.
 * | RoundRectRadius        | N/A            | Not a rounded rectangle.
 * | ContextTranslation     | none           | No `ctx.translate()` calls are made.
 * | ContextRotation        | none           | No `ctx.rotate()` calls are made.
 * | ContextScaling         | none           | No `ctx.scale()` calls are made.
 * | Clipped on shape       | none           | No `ctx.clip()` calls are made.
 * | Clipped on shape count | n/a            | No clipping is applied.
 * | Clipped on shape arrangement | n/a      | No clipping is applied.
 * | Clipped on shape size  | n/a            | No clipping is applied.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is specifically fixed to opaque red (`rgb(255, 0, 0)`), which is not captured by the `sOpaq` facet alone.
 *
 */
/**
 * @fileoverview Test definition for rendering a medium-sized, horizontal, 2px thick,
 * opaque stroke line centered at a grid intersection.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - Drawing logic is consolidated into a single loop to handle both single and multiple instances,
 *     reducing code duplication.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Positional offsets for each instance are applied directly to the primitive's coordinates
 *     (e.g., line endpoints) rather than using canvas transformations (like `ctx.translate()`).
 *   - The random offsets for these multiple instances are generated using `Math.random()` for simplicity
 *     and potential performance benefits, as the exact reproducibility of these specific offsets
 *     is not considered critical for this mode. The base primitive's characteristics remain
 *     reproducible via `SeededRandom` for the single instance case or base calculations.
 *   - Offsets are integers and aim to keep the primitive visible within the canvas.
 * - Single Instance (when 'instances' is null or <= 0):
 *   - Original behavior is maintained: logs are collected, and checkData is returned.
 *   - `SeededRandom` is used for all random elements to ensure test reproducibility.
 */

/**
 * Draws a single, 2px thick, fully opaque horizontal line centered vertically
 * at a grid line (integer y-coordinate), with variable width and potentially
 * swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations for base line (using SeededRandom for reproducibility)
    const baseLineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2); // Center at grid crossing
    const baseCenterY = Math.floor(effectiveHeight / 2); // Center at grid crossing
    const baseLeftX = Math.floor(baseCenterX - baseLineWidth / 2);
    const baseRightX = baseLeftX + baseLineWidth;
    const baseTopPixelY = baseCenterY - 1; // Top row for 2px line centered at integer Y
    const baseBottomPixelY = baseCenterY;   // Bottom row

    // Set drawing properties once
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red, matching original
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentStartX, currentEndX, currentCenterY; // For drawing, declared outside loop for single instance checkData access

    for (let i = 0; i < numIterations; i++) {
        let startX = baseLeftX; // Loop-local for clarity of base points per iteration
        let endX = baseRightX;
        
        // Randomly swap start/end points using SeededRandom for base primitive
        if (SeededRandom.getRandom() < 0.5) {
            [startX, endX] = [endX, startX];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentStartX = startX;
        currentEndX = endX;
        currentCenterY = baseCenterY; // centerY is fixed for a horizontal line

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical.
            const maxOffsetX = effectiveWidth - Math.max(currentStartX, currentEndX);
            const minOffsetX = -Math.min(currentStartX, currentEndX);
            const maxOffsetY = effectiveHeight - (baseBottomPixelY + 1); // Ensure 2px line fits
            const minOffsetY = -baseTopPixelY;

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentStartX += offsetX;
            currentEndX += offsetX;
            currentCenterY += offsetY; // This shifts the center of the 2px line
        }

        // --- Single Drawing Block ---
        if (typeof ctx.strokeLine === 'function') {
          ctx.strokeLine(currentStartX, currentCenterY, currentEndX, currentCenterY);
        } else {
          ctx.beginPath();
          ctx.moveTo(currentStartX, currentCenterY);
          ctx.lineTo(currentEndX, currentCenterY);
          ctx.stroke();
        }
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            logs.push(`&#x2500; 2px Red line from (${currentStartX.toFixed(0)}, ${currentCenterY.toFixed(0)}) to (${currentEndX.toFixed(0)}, ${currentCenterY.toFixed(0)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (!isMultiInstance) {
        // For single instance, extremes are based on the un-offsetted line from the single iteration.
        const extremes = {
            topY: baseTopPixelY,       // Uses base pixel Ys derived from un-offsetted baseCenterY
            bottomY: baseBottomPixelY,
            leftX: Math.min(currentStartX, currentEndX), // Values from the single loop iteration
            rightX: Math.max(currentStartX, currentEndX) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null;
    }
}

// Register the test
registerHighLevelTest(
    'line-sgl-szMix-fNone-sOpaq-sw2px-lytCenter-edgeCrisp-ornHoriz-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        uniqueColors: {
            middleRow: { count: 1 },
            middleColumn: { count: 1 } // Added MiddleColumn
        }, 
        extremes: true
    },
    {
        title: 'Lines: M-Size No-Fill 2px-Opaque-Stroke Centered-At-Grid Horizontal',
        description: 'Tests crisp rendering of a horizontal 2px line centered at grid crossing using canvas code.',
        displayName: 'Perf: Lines M 2px Grid Horizontal'
    }
); 
})();

(function() {
/**
* TEST SUMMARY:
* =================
*
* Description: Tests crisp rendering of a single, vertical, 2px-thick opaque line centered on a grid line.
*
*
* ---
*
* | Facet                  | Value          | Reason
* |------------------------|----------------|-----------------------------------------------------------------------------------------------------
* | Shape category         | lines          | The code draws lines using `ctx.strokeLine`.
* | Count                  | single         | The default test case draws a single line instance.
* | SizeCategory           | mixed          | The line length is randomized in `[20, 149]`, which spans S (`16-39`), M (`40-79`), and L (`80-159`) size categories.
* | FillStyle              | none           | No fill is applied to the line.
* | StrokeStyle            | opaque         | The stroke is a solid, opaque red color (`rgb(255, 0, 0)`).
* | StrokeThickness        | 2px            | `ctx.lineWidth` is explicitly set to `2`.
* | Layout                 | centered       | The line is positioned relative to the canvas center.
* | CenteredAt             | N/A            | This facet is not applicable to lines as per the project's convention.
* | EdgeAlignment          | crisp          | The line has a 2px (even) width and is drawn on an integer x-coordinate, ensuring its edges align with pixel boundaries.
* | Orientation            | vertical       | The line is drawn with identical start and end x-coordinates.
* | ArcAngleExtent         | N/A            | Not an arc.
* | RoundRectRadius        | N/A            | Not a rounded rectangle.
* | ContextTranslation     | none           | `ctx.translate()` is not used.
* | ContextRotation        | none           | `ctx.rotate()` is not used.
* | ContextScaling         | none           | `ctx.scale()` is not used.
* | Clipped on shape       | none           | `ctx.clip()` is not used.
* | Clipped on shape count | n/a            | No clipping.
* | Clipped on shape arrangement | n/a      | No clipping.
* | Clipped on shape size  | n/a            | No clipping.
* | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
*
* ---
*
* UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
* ----------------------------------------------
* The stroke color is a fixed opaque red.
*
*/
/**
 * @fileoverview Test definition for rendering a medium-sized, vertical, 2px thick,
 * opaque stroke line centered at a grid intersection.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - Drawing logic is consolidated into a single loop to handle both single and multiple instances,
 *     reducing code duplication.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Positional offsets for each instance are applied directly to the primitive's coordinates
 *     (e.g., line endpoints) rather than using canvas transformations (like `ctx.translate()`).
 *   - The random offsets for these multiple instances are generated using `Math.random()` for simplicity
 *     and potential performance benefits, as the exact reproducibility of these specific offsets
 *     is not considered critical for this mode. The base primitive's characteristics remain
 *     reproducible via `SeededRandom` for the single instance case or base calculations.
 *   - Offsets are integers and aim to keep the primitive visible within the canvas.
 * - Single Instance (when 'instances' is null or <= 0):
 *   - Original behavior is maintained: logs are collected, and checkData is returned.
 *   - `SeededRandom` is used for all random elements to ensure test reproducibility.
 */

/**
 * Draws a single, 2px thick, fully opaque vertical line centered horizontally
 * at a grid line (integer x-coordinate), with variable height and potentially
 * swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations for base line (using SeededRandom for reproducibility)
    const baseLineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2); // Center at grid crossing
    const baseCenterY = Math.floor(effectiveHeight / 2); // Center at grid crossing
    const baseTopY = Math.floor(baseCenterY - baseLineHeight / 2);
    const baseBottomY = baseTopY + baseLineHeight;
    const baseLeftPixelX = baseCenterX - 1;  // Left pixel column for 2px line centered at integer X
    const baseRightPixelX = baseCenterX; // Right pixel column

    // Set drawing properties once
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red, matching original
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentCenterX, currentStartY, currentEndY; // For drawing, declared outside loop for single instance checkData access

    for (let i = 0; i < numIterations; i++) {
        let startY = baseTopY; // Loop-local for clarity of base points per iteration
        let endY = baseBottomY;
        
        // Randomly swap start/end points using SeededRandom for base primitive
        if (SeededRandom.getRandom() < 0.5) {
            [startY, endY] = [endY, startY];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentCenterX = baseCenterX; // centerX is fixed for a vertical line
        currentStartY = startY;
        currentEndY = endY;

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical.
            const maxOffsetX = effectiveWidth - (baseRightPixelX + 1); // Ensure 2px line fits
            const minOffsetX = -baseLeftPixelX;
            const maxOffsetY = effectiveHeight - Math.max(currentStartY, currentEndY);
            const minOffsetY = -Math.min(currentStartY, currentEndY);

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentCenterX += offsetX; // This shifts the center of the 2px line
            currentStartY += offsetY;
            currentEndY += offsetY;
        }

        // --- Single Drawing Block ---
        if (typeof ctx.strokeLine === 'function') {
          ctx.strokeLine(currentCenterX, currentStartY, currentCenterX, currentEndY);
        } else {
          ctx.beginPath();
          ctx.moveTo(currentCenterX, currentStartY);
          ctx.lineTo(currentCenterX, currentEndY);
          ctx.stroke();
        }
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            logs.push(`&#x2500; 2px Red line from (${currentCenterX.toFixed(0)}, ${currentStartY.toFixed(0)}) to (${currentCenterX.toFixed(0)}, ${currentEndY.toFixed(0)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (!isMultiInstance) {
        // For single instance, extremes are based on the un-offsetted line from the single iteration.
        const extremes = {
            leftX: baseLeftPixelX,   // Uses base pixel Xs derived from un-offsetted baseCenterX
            rightX: baseRightPixelX,
            topY: Math.min(currentStartY, currentEndY), // Values from the single loop iteration
            bottomY: Math.max(currentStartY, currentEndY) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null;
    }
}

// Register the test
registerHighLevelTest(
    'line-sgl-szMix-fNone-sOpaq-sw2px-lytCenter-edgeCrisp-ornVert-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        uniqueColors: {
            middleRow: { count: 1 },
            middleColumn: { count: 1 } // Added MiddleColumn
        }, 
        extremes: true
    },
    {
        title: 'Lines: M-Size No-Fill 2px-Opaque-Stroke Centered-At-Grid Vertical',
        description: 'Tests crisp rendering of a vertical 2px line centered at grid crossing using canvas code.',
        displayName: 'Perf: Lines M 2px Grid Vertical'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of multiple axis-aligned rectangles with random sizes, fills (variable alpha), strokes (opaque/semi-transparent, even width), and positions. This test is designed to produce crisp edges by using helper functions to adjust geometry based on stroke width and placement. No rotation is applied.
 *
 *
 * ---
 *
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rectangles         | Test draws rectangles using `ctx.fillRect` and `ctx.strokeRect`.
 * | Count                  | multi-10           | Draws 10 instances in visual regression mode (`numToDraw` defaults to 10).
 * | SizeCategory           | mixed              | `rectWidth`/`rectHeight` are randomized in a range of `[50, ~410]`, spanning M, L, and XL categories.
 * | FillStyle              | semitransparent    | `fillColorObj` is generated with an alpha range of `[100, 200]`, which is always semi-transparent.
 * | StrokeStyle            | mixed              | `strokeColorObj` is generated with an alpha range of `[200, 255]`, including both semi-transparent and opaque values.
 * | StrokeThickness        | mixed              | `strokeWidth` is randomized to an even integer in `[2, 12]`, a discrete set of values.
 * | Layout                 | spread             | Rectangles are distributed by applying a random offset to each instance's calculated center point.
 * | CenteredAt             | mixed-pixel-grid   | The initial placement logic in `calculateCrispFillAndStrokeRectParams` centers on a grid or pixel center.
 * | EdgeAlignment          | crisp              | The test explicitly uses the `adjustDimensionsForCrispStrokeRendering` helper to ensure crisp edges.
 * | Orientation            | square             | Rectangles are axis-aligned (`ornAxial` in new convention).
 * | ArcAngleExtent         | N/A                | Not applicable to rectangles.
 * | RoundRectRadius        | N/A                | Not applicable to standard rectangles.
 * | ContextTranslation     | none               | No `ctx.translate()` calls are made.
 * | ContextRotation        | none               | No `ctx.rotate()` calls are made.
 * | ContextScaling         | none               | No `ctx.scale()` calls are made.
 * | Clipped on shape       | none               | No clipping is applied in this test.
 * | Clipped on shape count | n/a                | No clipping is applied in this test.
 * | Clipped on shape arrangement | n/a          | No clipping is applied in this test.
 * | Clipped on shape size  | n/a                | No clipping is applied in this test.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The fill alpha is specifically randomized within the range `[100, 200]`.
 * - The stroke alpha is specifically randomized within the range `[200, 255]`.
 * - The stroke width is calculated by rounding `SR.get()*10+1` and then forcing the result to be an even number,
 *   resulting in a discrete set of values: `{2, 4, 6, 8, 10, 12}`.
 *
 */

/**
 * @fileoverview Test definition for multiple axis-aligned rectangles with random parameters,
 * matching the new descriptive naming convention.
 */

// Helper functions adjustDimensionsForCrispStrokeRendering, calculateCrispFillAndStrokeRectParams 
// are available from test-helper-functions.js

// _colorObjectToString is now available globally from test-helper-functions.js

/**
 * Draws multiple axis-aligned rectangles with random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it dictates the number of rectangles drawn.
 *                  For visual regression (instances is null/0), 10 rectangles are drawn.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 10; // Original test draws 10

    const logs = [];
    let overallMinLeftX = Infinity;
    let overallMaxRightX = -Infinity;
    let overallMinTopY = Infinity;
    let overallMaxBottomY = -Infinity;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Preserve SeededRandom sequence from original test functions:
        // Calls 1-4 happen inside calculateCrispFillAndStrokeRectParams
        const placement = calculateCrispFillAndStrokeRectParams({
            canvasWidth,
            canvasHeight,
            minWidth: 50,
            maxWidth: canvasWidth * 0.6,
            minHeight: 50,
            maxHeight: canvasHeight * 0.6,
            maxStrokeWidth: 10,
            ensureEvenStroke: true,
            randomPosition: false  // This test applies positioning separately
        });
        let rectCenter = placement.center;
        const rectWidth = placement.adjustedDimensions.width;
        const rectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // Call 5: xOffset
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        // Call 6: yOffset
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;

        let finalDrawCenterX = rectCenter.x + xOffset;
        let finalDrawCenterY = rectCenter.y + yOffset;

        // Call 7: strokeColor (getRandomColor uses SeededRandom internally)
        const strokeColorObj = getRandomColor("mixed"); // Opaque or semi-transparent stroke
        // Call 8: fillColor (getRandomColor uses SeededRandom internally)
        const fillColorObj = getRandomColor("semitransparent");   // Semi-transparent fill

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let geomX = finalDrawCenterX - rectWidth / 2;
        let geomY = finalDrawCenterY - rectHeight / 2;

        if (isPerformanceRun) {
            // For performance, spread shapes widely using Math.random (does not affect SeededRandom sequence)
            // Ensure shape stays somewhat within bounds if its original placement + offset was near edge
            const safeMargin = Math.max(strokeWidth, 10); // A small margin
            geomX = Math.random() * Math.max(0, canvasWidth - rectWidth - safeMargin * 2) + safeMargin;
            geomY = Math.random() * Math.max(0, canvasHeight - rectHeight - safeMargin * 2) + safeMargin;
        } else {
             // Ensure the shape is mostly on canvas for visual test, clipping if necessary
             // This is a simple clamp to avoid errors if random offsets push it too far.
            geomX = Math.max(0 - rectWidth/2, Math.min(geomX, canvasWidth - rectWidth/2));
            geomY = Math.max(0 - rectHeight/2, Math.min(geomY, canvasHeight - rectHeight/2));
        }


        ctx.fillStyle = fillColorStr;
        ctx.fillRect(geomX, geomY, rectWidth, rectHeight);

        if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColorStr;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(geomX, geomY, rectWidth, rectHeight);
        }

        if (!isPerformanceRun) {
            logs.push(`Rect ${i+1}: center=(${finalDrawCenterX.toFixed(1)},${finalDrawCenterY.toFixed(1)}), w=${rectWidth}, h=${rectHeight}, sw=${strokeWidth}`);
            
            // Calculate extremes based on geometry and stroke width
            // These are the geometric boundaries of the stroked area
            const currentRectOuterLeft = geomX - strokeWidth / 2;
            const currentRectOuterRight = geomX + rectWidth + strokeWidth / 2; // one pixel past the end
            const currentRectOuterTop = geomY - strokeWidth / 2;
            const currentRectOuterBottom = geomY + rectHeight + strokeWidth / 2; // one pixel past the end

            overallMinLeftX = Math.min(overallMinLeftX, currentRectOuterLeft);
            overallMaxRightX = Math.max(overallMaxRightX, currentRectOuterRight);
            overallMinTopY = Math.min(overallMinTopY, currentRectOuterTop);
            overallMaxBottomY = Math.max(overallMaxBottomY, currentRectOuterBottom);
        }
    }

    if (isPerformanceRun) {
        return null;
    } else {
        // For withExtremesCheck, expected values are inclusive pixel coordinates.
        // The right/bottom boundary from calculation is typically exclusive, so subtract 1 if it's an integer,
        // or floor if it's subpixel. The guide's examples use Math.floor for subpixel-derived boundaries.
        // And `rightX: x + rectWidth + sw / 2 - 1` (inclusive boundary)
        const checkData = {
            leftX: Math.floor(overallMinLeftX),
            rightX: Math.floor(overallMaxRightX -1), // Adjust to inclusive pixel
            topY: Math.floor(overallMinTopY),
            bottomY: Math.floor(overallMaxBottomY -1)  // Adjust to inclusive pixel
        };
        if (numToDraw === 0) { // Should not happen with numToDraw=10 default but good for safety
             return {logs, checkData: {leftX:0, rightX:0, topY:0, bottomY:0}};
        }
        return { logs, checkData };
    }
}

// Register the test
registerHighLevelTest(
    'rect-m10-szMix-fSemi-sMix-swMix-lytSpread-cenMixPG-edgeCrisp-ornAxial-test',
    drawTest,
    'rectangles',
    {
        extremes: true,
        compare: { swTol: 3, refTol: 1, diffTol: 0 }
    },
    {
        title: 'Rectangles: Axis-aligned, Multiple, Variable Size, Random Fill & Stroke, Random Position, No Rotation',
        description: 'Tests rendering of multiple axis-aligned rectangles with random sizes, fills (variable alpha), strokes (opaque, even width), and positions. No rotation.',
        displayName: 'Perf: Rects AxAlign Multi Random'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of multiple rotated rectangles with random positions, sizes, angles, strokes, and fills.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rectangles     | The test draws rectangles using `ctx.fillRect()` and `ctx.strokeRect()`.
 * | Count                  | multi-5        | The test draws 5 instances in visual regression mode, as defined by `numToDraw`.
 * | SizeCategory           | mixed          | The width and height are randomized in the range `[30, 130)`, which spans the S, M, and L size categories.
 * | FillStyle              | semitransparent| Fill alpha is randomized in the range `[100, 200]` (out of 255), which is always semi-transparent.
 * | StrokeStyle            | mixed          | Stroke alpha is randomized in the range `[200, 255]`, which includes both semi-transparent and fully opaque values.
 * | StrokeThickness        | 1px-10px       | The stroke width is randomized in the range `[1, 11)`, resulting in integer values from 1 to 10.
 * | Layout                 | spread         | The `getRandomPoint()` function is called for each of the 5 instances, spreading them across the canvas.
 * | CenteredAt             | random         | The geometric center of each rectangle is placed at a fully random point on the canvas.
 * | EdgeAlignment          | not-crisp      | The rectangles are rotated by a fully random angle, which prevents crisp edge alignment.
 * | Orientation            | random         | `ctx.rotate()` is used with a fully random angle for each instance.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to rectangle shapes.
 * | RoundRectRadius        | N/A            | This facet is not applicable to non-rounded rectangle shapes.
 * | ContextTranslation     | random         | `ctx.translate()` is called with a random (x, y) point for each rectangle's center.
 * | ContextRotation        | random         | `ctx.rotate()` is called with a random angle for each instance.
 * | ContextScaling         | none           | The `ctx.scale()` function is not used in this test.
 * | Clipped on shape       | none           | No clipping is applied in this test.
 * | Clipped on shape count | n/a            | No clipping is applied in this test.
 * | Clipped on shape arrangement | n/a      | No clipping is applied in this test.
 * | Clipped on shape size  | n/a            | No clipping is applied in this test.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The test is designed to draw 5 instances in visual mode. In performance mode, it draws a variable number of instances and spreads them using `Math.random()` to avoid overdraw, which differs from the `SeededRandom`-based positioning in visual mode. The randomization ranges for colors, dimensions, and rotation are specific to this test's implementation.
 *
 */

/**
 * @fileoverview Test definition for multiple rotated rectangles with random parameters.
 */

// _colorObjectToString, getRandomPoint, and getRandomColor are assumed to be globally available
// from included utility scripts (e.g., random-utils.js) and use SeededRandom internally as needed.

/**
 * Converts a color object to an rgba string.
 * Assumes _colorObjectToString is available from a shared utility or defined in a previous script.
 * If not, it should be defined here:
 * function colorObj ? colorObj.toCSS() : 'rgba(0,0,0,0)' {
 *     if (!colorObj) return 'rgba(0,0,0,0)';
 *     const alpha = (typeof colorObj.a === 'number') ? (colorObj.a / 255).toFixed(3) : 1;
 *     return `rgba(${colorObj.r},${colorObj.g},${colorObj.b},${alpha})`;
 * }
 */

/**
 * Draws multiple rotated rectangles with random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it dictates the number of rectangles drawn.
 *                  For visual regression (instances is null/0), 5 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 *                   (No checkData as original test had no withExtremesCheck).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 5; // Original test draws 5

    const logs = [];
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Preserve SeededRandom sequence from original addRotatedRectangles:
        // 1. center (via getRandomPoint which uses SeededRandom)
        const center = getRandomPoint(1, canvasWidth, canvasHeight);
        
        // 2. width
        const width = 30 + SeededRandom.getRandom() * 100;
        // 3. height
        const height = 30 + SeededRandom.getRandom() * 100;
        // 4. rotation
        const rotation = SeededRandom.getRandom() * Math.PI * 2;
        // 5. strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        
        // 6. strokeColor (getRandomColor uses SeededRandom)
        const strokeColorObj = getRandomColor("mixed"); // Opaque or semi-transparent stroke
        // 7. fillColor (getRandomColor uses SeededRandom)
        const fillColorObj = getRandomColor("semitransparent");   // Semi-transparent fill

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let drawAtX = center.x;
        let drawAtY = center.y;

        if (isPerformanceRun) {
            // For performance, spread shapes widely using Math.random (does not affect SeededRandom sequence)
            drawAtX = Math.random() * canvasWidth;
            drawAtY = Math.random() * canvasHeight;
        }

        ctx.save();
        ctx.translate(drawAtX, drawAtY);
        ctx.rotate(rotation);

        // Draw relative to the new origin (0,0) which is the rectangle's center
        const rectX = -width / 2;
        const rectY = -height / 2;

        ctx.fillStyle = fillColorStr;
        ctx.fillRect(rectX, rectY, width, height);

        if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColorStr;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(rectX, rectY, width, height);
        }
        ctx.restore();

        if (!isPerformanceRun) {
            logs.push(`Rotated Rect ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), w=${width.toFixed(1)}, h=${height.toFixed(1)}, rot=${(rotation * 180 / Math.PI).toFixed(1)}deg, sw=${strokeWidth.toFixed(1)}`);
        }
    }

    if (isPerformanceRun) {
        return null;
    } else {
        // Original test did not have withExtremesCheck, so no checkData is returned.
        return { logs }; 
    }
}

// Register the test
registerHighLevelTest(
    'rect-m5-szMix-fSemi-sMix-sw1-10px-lytSpread-cenRand-edgeNotCrisp-ornRand-ctxTransRand-ctxRotRand-test',
    drawTest,
    'rectangles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Rectangles: Rotated, Multiple, Variable Size & Params, Random Position & Rotation',
        description: 'Tests rendering of multiple rotated rectangles with random positions, sizes, angles, strokes, and fills.',
        displayName: 'Perf: Rects Rotated Multi Random'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of a single, axis-aligned rectangle with a 1px opaque red stroke and no fill. The rectangle has randomized dimensions but is explicitly centered on a grid-line intersection and adjusted to ensure its edges are rendered crisply.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rectangles     | The test draws a rectangle using `ctx.strokeRect()`.
 * | Count                  | single         | The test is designed to draw one rectangle instance in its primary visual regression mode.
 * | SizeCategory           | mixed          | The rectangle's width and height are randomized in the range `[20, 149]`, spanning S, M, and L categories.
 * | FillStyle              | none           | No fill is applied; `fillStyle` is set to be fully transparent and `fillRect()` is not called.
 * | StrokeStyle            | opaque         | `strokeStyle` is set to an opaque color (`rgb(255,0,0)`).
 * | StrokeThickness        | 1px            | `lineWidth` is explicitly set to `1`.
 * | Layout                 | centered       | The rectangle is positioned relative to the center of the canvas.
 * | CenteredAt             | grid           | The center coordinates are calculated to be even integers, aligning with grid line intersections.
 * | EdgeAlignment          | crisp          | The test uses the `adjustDimensionsForCrispStrokeRendering()` helper function to ensure sharp edges.
 * | Orientation            | square         | The rectangle is axis-aligned with no rotation applied.
 * | ArcAngleExtent         | N/A            | Not applicable for a rectangle shape.
 * | RoundRectRadius        | N/A            | Not applicable for a non-rounded rectangle.
 * | ContextTranslation     | none           | `ctx.translate()` is not used.
 * | ContextRotation        | none           | `ctx.rotate()` is not used.
 * | ContextScaling         | none           | `ctx.scale()` is not used.
 * | Clipped on shape       | none           | No clipping path is defined or applied in the test.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The test requires the canvas dimensions to be even numbers for its centering logic to work correctly.
 * - The stroke color is fixed to an explicit, non-random opaque red.
 *
 */
/**
 * @fileoverview
 * Test definition for rendering a single, small-to-medium sized, 1px thick, red, opaque stroked rectangle
 * with no fill, centered at a grid crossing, and with no rotation.
 *
 * Guiding Principles for this draw function:
 * - Reproducibility: Uses SeededRandom for all random elements.
 * - Crispness: Adapts logic for centering and dimension adjustment for crisp 1px stroke.
 * - Checks: Returns extremes data for `withExtremesCheck`.
 * - Pre-conditions: Checks for even canvas dimensions.
 */

/**
 * Draws a single 1px red-stroked rectangle, centered at a grid crossing.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If > 0, draws multiple instances for performance (not primary use here).
 * @returns {?{ logs: string[], checkData: {leftX: number, rightX: number, topY: number, bottomY: number} }} 
 *          Log entries and expected pixel extremes, or null if in multi-instance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test (required by centering logic).");
    }

    const isPerformanceRun = instances !== null && instances > 0;
    const numIterations = 1; // Focus on one precise rectangle
    const numRectsToDraw = isPerformanceRun ? instances : 1;

    let logs = isPerformanceRun ? null : [];
    let checkData = null; // Only to be populated for the single, non-performance run instance

    // --- Base calculations for the archetype rectangle (using SeededRandom for reproducibility) ---
    // Logic adapted from placeCloseToCenterAtGrid
    const cXBase = Math.floor(canvasWidth / 2);
    const cYBase = Math.floor(canvasHeight / 2);
    const baseCenterX = (cXBase % 2 === 0) ? cXBase : cXBase + 1;
    const baseCenterY = (cYBase % 2 === 0) ? cYBase : cYBase + 1;

    // Base Rectangle Dimensions (random but seeded)
    let initialRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    let initialRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

    // Use adjustDimensionsForCrispStrokeRendering for the archetype
    const { width: archetypeRectWidth, height: archetypeRectHeight } = adjustDimensionsForCrispStrokeRendering(
        initialRectWidth, 
        initialRectHeight, 
        1, // strokeWidth
        { x: baseCenterX, y: baseCenterY } // center coordinates
    );

    // Calculate top-left for the archetype rectangle (relative to its center)
    const archetypeX = baseCenterX - archetypeRectWidth / 2;
    const archetypeY = baseCenterY - archetypeRectHeight / 2;
    // --- End base calculations ---

    // Set drawing properties once (they are constant for all instances)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255,0,0)'; // Red, Opaque
    ctx.fillStyle = 'rgba(0,0,0,0)';   // Transparent fill

    for (let i = 0; i < numRectsToDraw; i++) {
        let currentX = archetypeX;
        let currentY = archetypeY;
        let currentCenterX = baseCenterX; // For logging, if needed for this instance
        let currentCenterY = baseCenterY;

        if (isPerformanceRun && i > 0) { // Apply random offsets for subsequent instances in perf mode
            // Max offset should keep the shape mostly within canvas. Simplified for this example.
            const maxOffsetX = canvasWidth - archetypeRectWidth - 10; // 10px buffer
            const minOffsetX = 10;
            const maxOffsetY = canvasHeight - archetypeRectHeight - 10;
            const minOffsetY = 10;

            // Use Math.random() for offsets in perf mode for speed, reproducibility of offsets isn't paramount here.
            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX - archetypeX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY - archetypeY;
            
            currentX += offsetX; 
            currentY += offsetY;
            currentCenterX += offsetX; // Keep track of the effective center for this instance if logging was active
            currentCenterY += offsetY;
        } else if (!isPerformanceRun) {
            // This is the single instance for visual regression and checkData calculation
            // Log and set checkData only for this one instance.
            logs.push(`&#x25A1; 1px Red Stroked Rectangle at (${currentX.toFixed(1)}, ${currentY.toFixed(1)}), size ${archetypeRectWidth}x${archetypeRectHeight}, centered at (${currentCenterX.toFixed(1)}, ${currentCenterY.toFixed(1)})`);
            
            checkData = {
                leftX: Math.floor(currentX),                       
                rightX: Math.floor(currentX + archetypeRectWidth),     
                topY: Math.floor(currentY),                        
                bottomY: Math.floor(currentY + archetypeRectHeight)
            };
        }

        // --- Single Drawing Block ---
        ctx.strokeRect(currentX, currentY, archetypeRectWidth, archetypeRectHeight);
        // --- End Single Drawing Block ---
    }

    if (isPerformanceRun) return null;
    // For non-performance run, checkData and logs for the single drawn instance are returned
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'rect-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenGrid-edgeCrisp-ornAxial-test',
    drawTest,
    'rectangles',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Rectangles: S-Size No-Fill 1px-Red-Opaque-Stroke Centered-At-Grid No-Rotation',
        description: 'Tests a single 1px red stroked rectangle, centered on grid lines, with even dimensions.',
        displayName: 'Perf: Rect S 1px Red Centered Grid'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of a single 1px red stroked rectangle with no fill. The rectangle is centered at a pixel center (X.5, Y.5 coordinates) and its dimensions are adjusted to ensure crisp rendering.
 *
 *
 * ---
 *
 * | Facet                      | Value          | Reason
 * |----------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category             | rectangles     | The test calls `ctx.strokeRect`, which draws rectangles.
 * | Count                      | single         | The test draws a single rectangle in its visual test mode (`instances` is null).
 * | SizeCategory               | mixed          | Rectangle dimensions are randomized in the range `[20, 149]`, which spans S, M, and L categories.
 * | FillStyle                  | none           | `ctx.fillStyle` is set to be fully transparent and `fillRect` is not called.
 * | StrokeStyle                | opaque         | `ctx.strokeStyle` is set to `rgb(255,0,0)`, which is fully opaque red.
 * | StrokeThickness            | 1px            | `ctx.lineWidth` is hardcoded to `1`.
 * | Layout                     | centered       | The rectangle's archetype is positioned relative to the canvas center.
 * | CenteredAt                 | pixel          | The center coordinates are calculated as `floor(dimension/2) + 0.5`, aligning them to pixel centers.
 * | EdgeAlignment              | crisp          | The test uses a pixel-centered position and calls `adjustDimensionsForCrispStrokeRendering`.
 * | Orientation                | square         | The test draws an axis-aligned rectangle with no rotation.
 * | ArcAngleExtent             | N/A            | This facet only applies to `arc` shapes.
 * | RoundRectRadius            | N/A            | This facet only applies to `rounded-rect` shapes.
 * | ContextTranslation         | none           | The test does not call `ctx.translate()`.
 * | ContextRotation            | none           | The test does not call `ctx.rotate()`.
 * | ContextScaling             | none           | The test does not call `ctx.scale()`.
 * | Clipped on shape           | none           | The test does not call `ctx.clip()`.
 * | Clipped on shape count     | n/a            | No clipping is applied.
 * | Clipped on shape arrangement | n/a          | No clipping is applied.
 * | Clipped on shape size      | n/a            | No clipping is applied.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The original filename suggests 'S-size', but the implementation randomizes dimensions across S, M, and L categories, so SizeCategory is correctly 'mixed'.
 * - Stroke color is fixed to opaque red.
 */

/**
 * @fileoverview
 * Test definition for rendering a single, small-to-medium sized, 1px thick, red, opaque stroked rectangle
 * with no fill, centered at a pixel center (X.5, Y.5 coordinates), and with no rotation.
 *
 * Guiding Principles for this draw function:
 * - Reproducibility: Uses SeededRandom for all random elements.
 * - Crispness: Center coordinates are X.5, Y.5. `adjustDimensionsForCrispStrokeRendering` is used.
 * - Checks: Returns extremes data for `withExtremesCheck`.
 * - Pre-conditions: Checks for even canvas dimensions (as original test did).
 */

/**
 * Draws a single 1px red-stroked rectangle, centered at a pixel center.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If > 0, draws multiple instances for performance.
 * @returns {?{ logs: string[], checkData: {leftX: number, rightX: number, topY: number, bottomY: number} }} 
 *          Log entries and expected pixel extremes, or null if in multi-instance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test (original test implies this dependency for predictable centering).");
    }

    const isPerformanceRun = instances !== null && instances > 0;
    const numRectsToDraw = isPerformanceRun ? instances : 1;

    let logs = isPerformanceRun ? null : [];
    let checkData = null; 

    // --- Base calculations for the archetype rectangle (using SeededRandom for reproducibility) ---
    // Center is at pixel center (X.5, Y.5)
    const baseCenterX = Math.floor(canvasWidth / 2) + 0.5;
    const baseCenterY = Math.floor(canvasHeight / 2) + 0.5;

    // Base Rectangle Dimensions (random but seeded)
    let initialRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    let initialRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

    // Use adjustDimensionsForCrispStrokeRendering for the archetype.
    // For center at X.5, Y.5 and 1px stroke (odd), dimensions should be even.
    const { width: archetypeRectWidth, height: archetypeRectHeight } = adjustDimensionsForCrispStrokeRendering(
        initialRectWidth, 
        initialRectHeight, 
        1, // strokeWidth
        { x: baseCenterX, y: baseCenterY } // center coordinates are X.5, Y.5
    );

    // Calculate top-left for the archetype rectangle (relative to its center)
    // If baseCenterX is X.5 and archetypeRectWidth is even, then archetypeX will be Y.5
    const archetypeX = baseCenterX - archetypeRectWidth / 2;
    const archetypeY = baseCenterY - archetypeRectHeight / 2;
    // --- End base calculations ---

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255,0,0)'; // Red, Opaque
    ctx.fillStyle = 'rgba(0,0,0,0)';   // Transparent fill

    for (let i = 0; i < numRectsToDraw; i++) {
        let currentX = archetypeX;
        let currentY = archetypeY;
        let currentLogCenterX = baseCenterX; // For logging the original intended center
        let currentLogCenterY = baseCenterY;

        if (isPerformanceRun && i > 0) { 
            // For performance, place the archetype at random top-left *.5 coordinates
            // to cover the whole canvas while maintaining the pixel-alignment characteristic.
            currentX = Math.floor(Math.random() * (canvasWidth - archetypeRectWidth)) + 0.5;
            currentY = Math.floor(Math.random() * (canvasHeight - archetypeRectHeight)) + 0.5;

            // For logging, the *intended* conceptual center of the offset shape might shift
            // This logging part is usually skipped in perf runs anyway but shown for completeness if it were active.
            // currentLogCenterX = currentX + archetypeRectWidth / 2;
            // currentLogCenterY = currentY + archetypeRectHeight / 2;
        } else if (!isPerformanceRun) {
            logs.push(`&#x25A1; 1px Red Stroked Rectangle at (${currentX.toFixed(1)}, ${currentY.toFixed(1)}), size ${archetypeRectWidth}x${archetypeRectHeight}, centered at (${baseCenterX.toFixed(1)}, ${baseCenterY.toFixed(1)})`);
            
            checkData = {
                leftX: Math.floor(currentX),                       
                rightX: Math.floor(currentX + archetypeRectWidth),     
                topY: Math.floor(currentY),                        
                bottomY: Math.floor(currentY + archetypeRectHeight)
            };
        }

        ctx.strokeRect(currentX, currentY, archetypeRectWidth, archetypeRectHeight);
    }

    if (isPerformanceRun) return null;
    return { logs, checkData }; 
}

// Register the test
registerHighLevelTest(
    'rect-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenPx-edgeCrisp-ornAxial-test',
    drawTest,
    'rectangles',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Rectangles: S-Size No-Fill 1px-Red-Opaque-Stroke Centered-At-Pixel No-Rotation',
        description: 'Tests a single 1px red stroked rectangle, centered at pixel centers (X.5,Y.5), with adjusted even dimensions.',
        displayName: 'Perf: Rect S 1px Red Centered Pixel'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single axis-aligned rectangle with random dimensions, stroke width, and semi-transparent colors, mimicking original low-level logic including color generation.
 *
 *
 * ---
 *
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rectangles         | The code uses `fillRect` and `strokeRect` to draw rectangles.
 * | Count                  | single             | In visual test mode, the `for` loop is explicitly broken after one iteration, drawing a single shape.
 * | SizeCategory           | mixed              | The rectangle's dimensions are randomized in a `[20, 120]` pixel range, which spans S, M, and L categories.
 * | FillStyle              | semitransparent    | The fill color alpha is randomized in `[100, 200]` (out of 255), which is always semi-transparent.
 * | StrokeStyle            | mixed              | The stroke color alpha is randomized in `[200, 255]`, so it can be either semi-transparent or fully opaque.
 * | StrokeThickness        | mixed              | The stroke width is randomized to be one of the even numbers `{2, 4, 6, 8, 10, 12}`.
 * | Layout                 | random             | The single shape's final position is determined by applying a random offset from the canvas center.
 * | CenteredAt             | mixed-pixel-grid   | The code explicitly randomizes the geometric center between integer (`grid`) and half-pixel (`pixel`) coordinates.
 * | EdgeAlignment          | crisp              | The code makes an explicit call to `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | square             | The test draws an axis-aligned rectangle with no rotation.
 * | ArcAngleExtent         | N/A                | Not applicable to rectangles.
 * | RoundRectRadius        | N/A                | Not applicable to non-rounded rectangles.
 * | ContextTranslation     | none               | No call to `ctx.translate()`.
 * | ContextRotation        | none               | No call to `ctx.rotate()`.
 * | ContextScaling         | none               | No call to `ctx.scale()`.
 * | Clipped on shape       | none               | No clipping is performed.
 * | Clipped on shape count | n/a                | No clipping is performed.
 * | Clipped on shape arrangement | n/a          | No clipping is performed.
 * | Clipped on shape size  | n/a                | No clipping is performed.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Fill is semi-transparent (alpha 100-200). Stroke is mixed opaque/semi (alpha 200-255). EdgeAlignment is crisp via helper function.
 * CenteredAt is mixed-pixel-grid. strokeWidth is even numbers in [2,12]. Rect dims [20,120] span S,M,L categories.
 * In performance mode, positions are fully random across the canvas, overriding the `random` (offset-based) layout.
 */
/**
 * @fileoverview
 * Test definition for rendering a single, medium-sized, axis-aligned rectangle.
 * This version aims to replicate the logic from the original low-level test's
 * addAxisAlignedRectangles, including its direct use of getRandomColor.
 *
 * Guiding Principles for this draw function:
 * - Reproducibility: Uses SeededRandom for all random elements of the archetype.
 * - Properties: Derived from adapted logic of placeRoundedRectWithFillAndStrokeBothCrisp and addAxisAlignedRectangles.
 * - Checks: Returns extremes data for `withExtremesCheck`.
 * - Performance: Draws multiple instances at random positions in performance mode.
 */

// Color instances from getRandomColor have toCSS() method

/**
 * Draws a single axis-aligned rectangle based on original low-level test logic, or multiple for performance.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @param {?number} instances - Optional. If > 0, draws multiple instances for performance.
 * @returns {?{ logs: string[], checkData: object }} 
 *          Log entries and data for checks, or null if in multi-instance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = isPerformanceRun ? null : [];
    let checkData = null; 


    for (let i = 0; i < numToDraw; i++) {
        // --- Generate ALL properties for EACH rectangle instance using SeededRandom ---
        const maxStrokeWidthRand = 10; // Max stroke width for randomization, as per original logic source
        let currentStrokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidthRand + 1);
        currentStrokeWidth = currentStrokeWidth % 2 === 0 ? currentStrokeWidth : currentStrokeWidth + 1;

        let currentCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
        if (SeededRandom.getRandom() < 0.5) { // Randomize if center is on grid or pixel center
            currentCenter = { x: currentCenter.x + 0.5, y: currentCenter.y + 0.5 };
        }

        // M-size: 20-120px, as per performance test guidelines
        const minDimM = 20;
        const maxDimM = 120;
        let currentInitialRectWidth = Math.floor(minDimM + SeededRandom.getRandom() * (maxDimM - minDimM + 1));
        let currentInitialRectHeight = Math.floor(minDimM + SeededRandom.getRandom() * (maxDimM - minDimM + 1));

        const { 
            width: currentDrawWidth, 
            height: currentDrawHeight 
        } = adjustDimensionsForCrispStrokeRendering(currentInitialRectWidth, currentInitialRectHeight, currentStrokeWidth, currentCenter);

        // Apply random offsets to this instance's calculated center
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        currentCenter.x += xOffset;
        currentCenter.y += yOffset;

        const fillObj = getRandomColor("semitransparent");
        const strokeObj = getRandomColor("mixed");
        const currentFillColor = fillObj.toCSS();
        const currentStrokeColor = strokeObj.toCSS();
        // --- End property generation for this instance ---

        let finalDrawX = currentCenter.x - currentDrawWidth / 2;
        let finalDrawY = currentCenter.y - currentDrawHeight / 2;
        let centerForLog = { ...currentCenter };

        if (isPerformanceRun) {
            // Apply an additional large random offset for spread, using Math.random()
            // This offset is applied to the already SeededRandom-derived position of the rect's center
            finalDrawX = Math.floor(Math.random() * (canvasWidth - currentDrawWidth));
            finalDrawY = Math.floor(Math.random() * (canvasHeight - currentDrawHeight));
            // Update centerForLog if it were to be used in perf logs (not typical)
            centerForLog.x = finalDrawX + currentDrawWidth / 2;
            centerForLog.y = finalDrawY + currentDrawHeight / 2;
        }

        ctx.fillStyle = currentFillColor;
        ctx.fillRect(finalDrawX, finalDrawY, currentDrawWidth, currentDrawHeight);

        ctx.strokeStyle = currentStrokeColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.strokeRect(finalDrawX, finalDrawY, currentDrawWidth, currentDrawHeight);

        if (!isPerformanceRun) { // This will only be true for the first (and only) iteration when not in perf mode
            logs.push(`Drew Axis-Aligned Rectangle at (${finalDrawX.toFixed(1)},${finalDrawY.toFixed(1)}), size ${currentDrawWidth}x${currentDrawHeight}, stroke: ${currentStrokeWidth}px, center: (${centerForLog.x.toFixed(1)}, ${centerForLog.y.toFixed(1)}), fill: ${currentFillColor}, stroke: ${currentStrokeColor}`);
            
            const sw = currentStrokeWidth; 
            checkData = {
                leftX: finalDrawX - sw / 2,
                rightX: finalDrawX + currentDrawWidth + sw / 2 - 1, 
                topY: finalDrawY - sw / 2,
                bottomY: finalDrawY + currentDrawHeight + sw / 2 - 1  
            };
            // For non-performance mode, we only want one rectangle as per original test intent
            break; 
        }
    }

    if (isPerformanceRun && numToDraw > 0 && logs && logs.length > 0) {
      // Clear logs if it was a performance run with actual drawing, as per-instance logs are too verbose.
      // This condition is a bit defensive; logs should ideally be null from the start for perf runs.
      logs = null;
    }

    // If it wasn't a performance run, logs and checkData for the single drawn instance are returned.
    // If it was a performance run, logs would be null.
    return (logs || checkData) ? { logs, checkData } : null; 
}

// Register the test
registerHighLevelTest(
    'rect-sgl-szMix-fSemi-sMix-swMix-lytRand-cenMixPG-edgeCrisp-ornAxial-test',
    drawTest,
    'rectangles',
    {
        extremes: true,
        compare: { swTol: 3, refTol: 1, diffTol: 0 }
    },
    {
        title: 'Rectangles: M-Size Semi-Transparent Fill, Random Semi-Transparent Stroke, Random Position, No Rotation',
        description: 'Tests a single axis-aligned rectangle with random dimensions, stroke width, and semi-transparent colors, mimicking original low-level logic including color generation.',
        displayName: 'Perf: Rect M Axis-Aligned (Original Logic)'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 10 rounded rectangles with 1px opaque strokes, random semi-transparent fills, and crisp center adjustment to ensure pixel-aligned edges.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws rounded rectangles using `ctx.fillRoundRect` and `ctx.strokeRoundRect`.
 * | Count                  | multi-10       | The test draws 10 instances in a loop for visual regression.
 * | SizeCategory           | mixed          | `width` and `height` are randomized in `[50, 150]`, which spans 'M' (40-79px) and 'L' (80-159px) size categories.
 * | FillStyle              | semitransparent| `fillColorObj` is created via `getRandomColor("semitransparent")`, resulting in an alpha channel between 100-200.
 * | StrokeStyle            | opaque         | `strokeColorObj` is created via `getRandomColor("opaque")`, resulting in a fixed alpha of 255.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is hardcoded to `1`.
 * | Layout                 | spread         | The 10 shapes are positioned independently at randomized locations, distributing them across the canvas.
 * | CenteredAt             | mixed-pixel-grid| The center is first rounded to an integer grid, then adjusted by `adjustCenterForCrispStrokeRendering` to a pixel center (`*.5`).
 * | EdgeAlignment          | crisp          | The test explicitly calls `adjustCenterForCrispStrokeRendering` to ensure shape edges align with pixel boundaries.
 * | Orientation            | square         | The rectangles are axis-aligned with no rotation.
 * | ArcAngleExtent         | N/A            | Not an arc.
 * | RoundRectRadius        | randomized     | The corner radius is randomized based on a factor of the shape's smaller dimension.
 * | ContextTranslation     | none           | No calls to `ctx.translate()`.
 * | ContextRotation        | none           | No calls to `ctx.rotate()`.
 * | ContextScaling         | none           | No calls to `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping is applied in this test.
 * | Clipped on shape count | n/a            | No clipping.
 * | Clipped on shape arrangement | n/a      | No clipping.
 * | Clipped on shape size  | n/a            | No clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The specifics of `crisp-center-adj` logic are handled by the `adjustCenterForCrispStrokeRendering` helper function. The fill color is semi-transparent,
 * but the stroke is always fully opaque. The rectangle dimensions are randomized within the range `[50, 150]`, which covers the M and L size categories.
 *
 */
/**
 * @fileoverview Test definition for 10 thin, opaque-stroked rounded rectangles with 1px line width.
 */

// Helper functions getRandomColor, getRandomPoint, roundPoint, adjustCenterForCrispStrokeRendering 
// are available from scene-creation-utils.js and test-helper-functions.js

/**
 * Draws 10 thin, opaque-stroked rounded rectangles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 10 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 10; // Original test draws 10

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1: width
        const width = Math.round(50 + SeededRandom.getRandom() * 100);
        // SeededRandom Call 2: height
        const height = Math.round(50 + SeededRandom.getRandom() * 100);
        
        // SeededRandom Call 3 & 4 (approx, inside getRandomPoint)
        // The starting initialisation of center is a random point, then rounded for grid crossing.
        const randomCenter = getRandomPoint(1, canvasWidth, canvasHeight); // Assuming decimalPlaces=1, then pass canvas W/H
        const centerGrid = roundPoint(randomCenter); // Ensures integer coords for grid alignment before adjustment

        // adjustCenterForCrispStrokeRendering is for a 1px stroke.
        const adjustedCenter = adjustCenterForCrispStrokeRendering(centerGrid.x, centerGrid.y, width, height, 1);

        // SeededRandom Call 5: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2);
        
        // SeededRandom Call 6: strokeColor (opaque)
        const strokeColorObj = getRandomColor("opaque"); 
        // SeededRandom Call 7: fillColor (semi-transparent)
        const fillColorObj = getRandomColor("semitransparent");

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        // For drawing, use the adjusted center and original width/height
        let geomX = adjustedCenter.x - width / 2;
        let geomY = adjustedCenter.y - height / 2;

        if (isPerformanceRun) { // For additional instances in perf mode, spread them out
             if (i > 0) { // Keep first instance as per original logic for potential single-frame visual check
                geomX = Math.random() * Math.max(0, canvasWidth - width);
                geomY = Math.random() * Math.max(0, canvasHeight - height);
             }
        } else { // For visual regression, ensure shapes are reasonably on canvas
            geomX = Math.max(0 - width/4, Math.min(geomX, canvasWidth - width*3/4));
            geomY = Math.max(0 - height/4, Math.min(geomY, canvasHeight - height*3/4 ));
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1; // Fixed 1px stroke

        ctx.fillRoundRect(geomX, geomY, width, height, radius);
        ctx.strokeRoundRect(geomX, geomY, width, height, radius);

        if (!isPerformanceRun) { 
            logs.push(
                `ThinRRect ${i+1}: adjCenter=(${adjustedCenter.x.toFixed(1)},${adjustedCenter.y.toFixed(1)}), W/H=(${width},${height}), r=${radius}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-m10-szMix-fSemi-sOpaq-sw1px-lytSpread-cenMixPG-edgeCrisp-ornAxial-rrrRand-test',
    drawTest,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: '10 Thin Opaque-Stroke Rounded Rectangles (1px, Crisp Center Adj.)',
        description: 'Tests rendering of 10 rounded rectangles with 1px opaque strokes, random fills, and crisp center adjustment.',
        displayName: 'Perf: 10 RRects ThinOpaque AdjCenter'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 6 axis-aligned rounded rectangles. Rectangles have a fixed large corner radius, random semi-transparent fills, and fixed semi-transparent strokes. Their size and position are randomized, but dimensions are adjusted to ensure crisp rendering.
 *
 *
 * ---
 *
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | `rounded-rects`    | Code calls `ctx.fillRoundRect` and `ctx.strokeRoundRect`.
 * | Count                  | `multi-6`          | The test draws 6 instances in its default visual regression mode.
 * | SizeCategory           | `mixed`            | Rectangle dimensions are randomized in a range `[50, ~410)`, spanning the M, L, and XL size categories.
 * | FillStyle              | `semitransparent`  | Fill color is generated by `getRandomColor("semitransparent")`, resulting in an alpha < 255.
 * | StrokeStyle            | `semitransparent`  | Stroke color is hardcoded to `rgba(0, 0, 0, 50)`, which is semi-transparent.
 * | StrokeThickness        | `mixed`            | Stroke width is a randomized even integer between 2 and 42. As it's a set of discrete values, it's `mixed`.
 * | Layout                 | `spread`           | The 6 rectangles are positioned with random offsets, spreading them across the canvas.
 * | CenteredAt             | `mixed-pixel-grid` | The core positioning logic centers the shape on either a grid line or a pixel center to enable crispness.
 * | EdgeAlignment          | `crisp`            | Code explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | `square`           | The test is for axis-aligned rectangles, meaning no rotation.
 * | ArcAngleExtent         | `N/A`              | Not applicable for rectangle shapes.
 * | RoundRectRadius        | `large-cat`        | The corner radius is a fixed value of `40`, which falls into the "large" category.
 * | ContextTranslation     | `none`             | No `ctx.translate()` calls are made.
 * | ContextRotation        | `none`             | No `ctx.rotate()` calls are made.
 * | ContextScaling         | `none`             | No `ctx.scale()` calls are made.
 * | Clipped on shape       | `none`             | No clipping is applied in this test.
 * | Clipped on shape count | `n/a`              | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | `n/a`        | Not applicable as there is no clipping.
 * | Clipped on shape size  | `n/a`              | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | `n/a`     | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The corner radius is specifically fixed at 40px.
 * - The stroke color is fixed at a semi-transparent black (`rgba(0,0,0,50)`).
 * - While the final layout is a `spread`, the underlying logic first aligns the shape to a crisp
 *   pixel/grid center before applying a final random offset.
 *
 */

/**
 * @fileoverview Test definition for multiple large, transparent-stroked rounded rectangles.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCrispFillAndStrokeRectParams are available from test-helper-functions.js


/**
 * Draws multiple large rounded rectangles with transparent strokes.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 6 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 6; // Original test draws 6

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const fixedRadius = 40; // Fixed radius for this test

    for (let i = 0; i < numToDraw; i++) {
        // Calls 1-4 for SeededRandom happen inside calculateCrispFillAndStrokeRectParams
        const placement = calculateCrispFillAndStrokeRectParams({
            canvasWidth,
            canvasHeight,
            minWidth: 50,
            maxWidth: canvasWidth * 0.6,
            minHeight: 50,
            maxHeight: canvasHeight * 0.6,
            maxStrokeWidth: 40,
            ensureEvenStroke: true,
            randomPosition: false          // Test handles the offset separately
        });
        let currentCenter = placement.center; 
        const finalRectWidth = placement.adjustedDimensions.width;
        const finalRectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // SeededRandom Call 5: xOffset
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        // SeededRandom Call 6: yOffset
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        
        const finalCenter = {
            x: currentCenter.x + xOffset,
            y: currentCenter.y + yOffset
        };

        const strokeColorObj = new Color(0, 0, 0, 50); // Fixed: Black, very transparent
        // SeededRandom Call 7: fillColor (semi-transparent)
        const fillColorObj = getRandomColor("semitransparent");

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let geomX = finalCenter.x - finalRectWidth / 2;
        let geomY = finalCenter.y - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) { 
             geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
             geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, fixedRadius);
        if (strokeWidth > 0) {
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, fixedRadius);
        }

        if (!isPerformanceRun) { 
            logs.push(
                `LargeTransRRect ${i+1}: center=(${finalCenter.x.toFixed(1)},${finalCenter.y.toFixed(1)}), W/H=(${finalRectWidth},${finalRectHeight}), r=${fixedRadius}, sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-m6-szMix-fSemi-sSemi-swMix-lytSpread-cenMixPG-edgeCrisp-ornAxial-rrrLrg-test',
    drawTest,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Large Transparent-Stroke Rounded Rectangles (Multiple, Random Params)',
        description: 'Tests rendering of multiple large rounded rectangles with transparent strokes, random fills, and fixed large radius.',
        displayName: 'Perf: 6 Large TranspStroke RRects'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 8 axis-aligned rounded rectangles. The test uses a helper function to ensure crisp rendering by adjusting dimensions and placing the shape's center on a grid or pixel-center boundary. Position, size, stroke, fill, and corner radii are all randomized.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws rounded rectangles using `ctx.fillRoundRect` and `ctx.strokeRoundRect`.
 * | Count                  | multi-8        | The test draws 8 instances when not in performance mode.
 * | SizeCategory           | mixed          | Width/Height are randomized in a range of [50, ~530] which spans M, L, and XL size categories.
 * | FillStyle              | semitransparent| `getRandomColor("semitransparent")` is called for fill, which produces an alpha value in that range.
 * | StrokeStyle            | mixed          | `getRandomColor("mixed")` is called for stroke, producing alpha values that can be opaque (255) or semitransparent.
 * | StrokeThickness        | mixed          | `strokeWidth` is randomized to a discrete set of even integers: 2, 4, 6, 8, 10, 12.
 * | Layout                 | spread         | Positions are randomized within the canvas to distribute the shapes.
 * | CenteredAt             | mixed-pixel-grid | The `initialCenter` has a 50% chance of being on a pixel center (+0.5) or a grid integer coordinate.
 * | EdgeAlignment          | crisp          | The code explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure crisp edges.
 * | Orientation            | square         | The test draws axis-aligned rectangles with no rotation.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to rounded rectangles.
 * | RoundRectRadius        | mixed          | The corner radius is randomized based on the rectangle's randomized dimensions.
 * | ContextTranslation     | none           | `ctx.translate()` is not used.
 * | ContextRotation        | none           | `ctx.rotate()` is not used.
 * | ContextScaling         | none           | `ctx.scale()` is not used.
 * | Clipped on shape       | none           | `ctx.clip()` is not used.
 * | Clipped on shape count | n/a            | Clipping is not used.
 * | Clipped on shape arrangement | n/a      | Clipping is not used.
 * | Clipped on shape size  | n/a            | Clipping is not used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The visual test (`!isPerformanceRun`) uses a combination of pre-calculated center + random offsets, whereas the performance-mode test uses `Math.random()` for layout, which is a slightly different `spread` logic.
 * - The stroke color alpha range of [200, 255] means strokes are either fully opaque or very close to it.
 * - The corner radius is specifically randomized as a factor of the shape's smaller dimension (`Math.min(finalRectWidth, finalRectHeight) * 0.2`).
 */
/**
 * @fileoverview Test definition for multiple axis-aligned rounded rectangles with random parameters.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCrispFillAndStrokeRectParams are available from test-helper-functions.js


/**
 * Draws multiple axis-aligned rounded rectangles with random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 8 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 8; // Original test draws 8

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Calls 1-4 for SeededRandom happen inside calculateCrispFillAndStrokeRectParams
        const placement = calculateCrispFillAndStrokeRectParams({
            canvasWidth,
            canvasHeight,
            minWidth: 50,
            maxWidth: canvasWidth * 0.6,
            minHeight: 50,
            maxHeight: canvasHeight * 0.6,
            maxStrokeWidth: 10,
            ensureEvenStroke: true,
            randomPosition: false  // We'll apply our own offset below
        });
        let currentCenter = placement.center; // This is the center *before* the per-instance random offset
        const finalRectWidth = placement.adjustedDimensions.width;
        const finalRectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // SeededRandom Call 5: xOffset
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        // SeededRandom Call 6: yOffset
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        
        // Apply the random offset to get the final center for this specific rectangle
        const finalCenter = {
            x: currentCenter.x + xOffset,
            y: currentCenter.y + yOffset
        };

        // SeededRandom Call 7: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        // SeededRandom Call 8: strokeColor (semi-transparent or also opaque)
        const strokeColorObj = getRandomColor("mixed"); 
        // SeededRandom Call 9: fillColor (semi-transparent)
        const fillColorObj = getRandomColor("semitransparent");

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let geomX = finalCenter.x - finalRectWidth / 2;
        let geomY = finalCenter.y - finalRectHeight / 2;

        // For performance mode, if drawing multiple instances, ensure the base properties are unique per instance (done by SR calls)
        // then spread them out using Math.random for position only for instances *after the first one for that frame*.
        if (isPerformanceRun && numToDraw > 1) { // Apply to all instances in perf run
             geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
             geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        } else if (!isPerformanceRun) { // For visual regression (numToDraw = 8), ensure shapes are reasonably on canvas
            geomX = Math.max(0 - finalRectWidth / 4, Math.min(geomX, canvasWidth - finalRectWidth * 3/4));
            geomY = Math.max(0 - finalRectHeight / 4, Math.min(geomY, canvasHeight - finalRectHeight* 3/4));
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        if (strokeWidth > 0) {
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        }

        if (!isPerformanceRun) { 
            logs.push(
                `AxAlignedRRect ${i+1}: center=(${finalCenter.x.toFixed(1)},${finalCenter.y.toFixed(1)}), W/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-m8-szMix-fSemi-sMix-swMix-lytSpread-cenMixPG-edgeCrisp-ornAxial-rrrMix-test',
    drawTest,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Axis-Aligned Rounded Rectangles (Multiple, Random Params)',
        description: 'Tests rendering of multiple axis-aligned rounded rectangles with random positions, sizes, strokes, fills, and corner radii.',
        displayName: 'Perf: 8 AxAlign RRects RandParams'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 8 rounded rectangles with no stroke, only fill. The shapes have a fixed size (200x200px) and a large, fixed corner radius (40px). Their positions are randomized but their centers are snapped to the integer grid, and their fills are semi-transparent.
 *
 *
 * ---
 *
 * | Facet                  | Value           | Reason
 * |------------------------|-----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects   | Uses `ctx.fillRoundRect` to draw the shapes.
 * | Count                  | multi-8         | The test draws 8 instances in a loop for the visual regression test.
 * | SizeCategory           | XL              | The fixed side length of 200px falls into the Unified T-Shirt Size Scale's XL range (160-400px).
 * | FillStyle              | semitransparent | Fill color is generated by `getRandomColor("semitransparent")`, resulting in an alpha between ~0.39 and ~0.78.
 * | StrokeStyle            | none            | No stroke is applied; `ctx.strokeRoundRect` is not called and no `strokeStyle` is set.
 * | StrokeThickness        | none            | Follows from `StrokeStyle` being `none`.
 * | Layout                 | spread          | The 8 shapes are distributed across the canvas with randomized center points.
 * | CenteredAt             | grid            | The `randomCenter` point is rounded to the nearest integer, aligning the center with the grid.
 * | EdgeAlignment          | crisp           | The shape has even dimensions (200x200) and is drawn at integer start coordinates with no stroke.
 * | Orientation            | square          | The rectangles are axis-aligned with no rotation applied.
 * | ArcAngleExtent         | N/A             | Not applicable to rounded rectangles.
 * | RoundRectRadius        | large-cat       | The filename cue "large-radius" is confirmed by the `fixedRadius = 40;` in the code.
 * | ContextTranslation     | none            | The test does not use `ctx.translate()`.
 * | ContextRotation        | none            | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none            | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none            | Clipping is not used in this test.
 * | Clipped on shape count | n/a             | Clipping is not used in this test.
 * | Clipped on shape arrangement | n/a       | Clipping is not used in this test.
 * | Clipped on shape size  | n/a             | Clipping is not used in this test.
 * | Clipped on shape edge alignment | n/a    | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The RGB components of the fill color are also randomized within the range [100, 200]. While the center
 * positions are randomized, the final geometry coordinates are clamped to ensure the shapes remain
 * reasonably on-screen during the visual regression test.
 *
 */

/**
 * @fileoverview Test definition for 8 rounded rectangles with no stroke and fixed size/radius.
 */

// Helper functions getRandomColor, getRandomPoint, roundPoint are available from scene-creation-utils.js

/**
 * Draws 8 rounded rectangles with no stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 8 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 8; // Original test draws 8

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    const fixedWidth = 200;
    const fixedHeight = 200;
    const fixedRadius = 40;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1 & 2 (approx, inside getRandomPoint)
        const randomCenter = getRandomPoint(1, canvasWidth, canvasHeight); 
        const center = roundPoint(randomCenter); // Ensures integer coords for grid alignment

        // SeededRandom Call 3: fillColor (semi-transparent)
        const fillColorObj = getRandomColor("semitransparent");
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let geomX = center.x - fixedWidth / 2;
        let geomY = center.y - fixedHeight / 2;

        if (isPerformanceRun && numToDraw > 1) { 
             if (i > 0 || numToDraw > 1) { // Spread all instances in perf mode for this one
                geomX = Math.random() * Math.max(0, canvasWidth - fixedWidth);
                geomY = Math.random() * Math.max(0, canvasHeight - fixedHeight);
            }
        } else { // For visual regression, ensure shapes are reasonably on canvas
            geomX = Math.max(0 - fixedWidth / 4, Math.min(geomX, canvasWidth - fixedWidth * 3/4));
            geomY = Math.max(0 - fixedHeight / 4, Math.min(geomY, canvasHeight - fixedHeight * 3/4));
        }
        
        ctx.fillStyle = fillColorStr;
        // No strokeStyle or lineWidth needed as strokeWidth is 0

        ctx.fillRoundRect(geomX, geomY, fixedWidth, fixedHeight, fixedRadius);
        // No ctx.strokeRoundRect() call

        if (!isPerformanceRun) { 
            logs.push(
                `NoStrokeRRect ${i+1}: center=(${center.x},${center.y}), W/H=(${fixedWidth},${fixedHeight}), r=${fixedRadius}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-m8-xl-fSemi-sNone-lytSpread-cenGrid-edgeCrisp-ornAxial-rrrLrg-test',
    drawTest,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Rounded Rectangles Without Stroke (Multiple, Fixed Size, Random Pos)',
        description: 'Tests rendering of 8 rounded rectangles with no stroke, only fill, fixed size/radius, and random positions.',
        displayName: 'Perf: 8 NoStroke RRects FixedSize RandPos'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests crisp rendering of a single 1px red stroked rounded rectangle, centered at a grid crossing.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws rounded rectangles.
 * | Count                  | single         | The test is designed to draw a single shape instance in visual test mode.
 * | SizeCategory           | mixed          | The base width/height are randomized in [20, 149], which spans S, M, and L size categories.
 * | FillStyle              | none           | The fill color is set to be fully transparent ('rgba(0,0,0,0)').
 * | StrokeStyle            | opaque         | The stroke color is explicitly set to be fully opaque ('rgba(255,0,0,1)').
 * | StrokeThickness        | 1px            | The lineWidth is explicitly set to 1.
 * | Layout                 | centered       | The shape is drawn relative to the canvas center in visual test mode.
 * | CenteredAt             | grid           | The center point is calculated using Math.floor(), resulting in integer coordinates.
 * | EdgeAlignment          | crisp          | The test uses the adjustDimensionsForCrispStrokeRendering() helper to ensure crisp edges.
 * | Orientation            | square         | The shape is drawn with its sides parallel to the canvas axes (axis-aligned).
 * | ArcAngleExtent         | N/A            | This facet is not applicable to rectangles.
 * | RoundRectRadius        | randomized     | The corner radius is randomized using SeededRandom.getRandom().
 * | ContextTranslation     | none           | The test does not use ctx.translate().
 * | ContextRotation        | none           | The test does not use ctx.rotate().
 * | ContextScaling         | none           | The test does not use ctx.scale().
 * | Clipped on shape       | none           | The test does not use clipping.
 * | Clipped on shape count | n/a            | N/A because no clipping is used.
 * | Clipped on shape arrangement | n/a      | N/A because no clipping is used.
 * | Clipped on shape size  | n/a            | N/A because no clipping is used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Stroke color is fixed opaque red. It is axis-aligned. Rectangle dimensions are randomized in the range [20, 149], spanning S, M, and L size categories.
 */

/**
 * @fileoverview Test definition for a single 1px stroked rounded rectangle centered at a grid point.
 */

// Helper functions like _colorObjectToString, getRandomColor, placeCloseToCenterAtGrid, 
// and adjustDimensionsForCrispStrokeRendering are assumed to be globally available
// from included utility scripts (e.g., random-utils.js, scene-creation-utils.js)
// and use SeededRandom internally as needed.

/**
 * Draws a single 1px stroked rounded rectangle, centered at a grid point.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it should draw one primary shape for visual
 *                  regression, and `instances` count for performance, each with unique properties based on SeededRandom.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp grid-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
        // console.warn(msg); // Or throw error as per original checkCanvasHasEvenDimensions if critical
    }

    for (let i = 0; i < numToDraw; i++) {
        // Determine center point (integer coordinates for grid centering)
        // Adapted from placeCloseToCenterAtGrid(canvasWidth, canvasHeight)
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        // SeededRandom Call 1: rectWidth base
        const baseRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
        // SeededRandom Call 2: rectHeight base
        const baseRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

        // Adjust dimensions for a 1px stroke centered at the grid point
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseRectWidth, baseRectHeight, 1, { x: centerX, y: centerY });
        const finalRectWidth = adjusted.width;
        const finalRectHeight = adjusted.height;

        // SeededRandom Call 3: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        
        const strokeColorStr = 'rgba(255,0,0,1)'; // Red, Opaque
        const fillColorStr = 'rgba(0,0,0,0)';   // Transparent

        let geomX = centerX - finalRectWidth / 2;
        let geomY = centerY - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            // For performance, spread additional shapes widely using Math.random for position only
            // Properties (width, height, radius) are already randomized per instance via SeededRandom
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.fillStyle = fillColorStr; // Though transparent, set it for consistency
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1;

        // Use the new polyfilled/context method
        ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);

        if (!isPerformanceRun || i === 0) { // Log and checkData only for the first/single instance
            const currentLogs = [
                `RoundedRect: center=(${centerX},${centerY}), base W/H=(${baseRectWidth},${baseRectHeight}), adj W/H=(${finalRectWidth},${finalRectHeight}), r=${radius}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            // Calculate checkData based on the geometry of the first drawn instance
            if (i === 0) {
                 // For a 1px stroke, the boundary is inclusive of the pixels the stroke touches.
                 // If geomX/geomY are *.5 (typical for crisp 1px stroke), Math.floor gives the pixel coord.
                 // If geomX/geomY are integer, it's also the pixel coord.
                 // The guide's example for *.5 coordinates: Math.floor(x + finalRectWidth)
                checkData = {
                    leftX: Math.floor(geomX),
                    rightX: Math.floor(geomX + finalRectWidth),
                    topY: Math.floor(geomY),
                    bottomY: Math.floor(geomY + finalRectHeight)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; // No logs or checkData for multi-instance perf runs (except potentially first for debugging)
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'roundrect-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenGrid-edgeCrisp-ornAxial-rrrRand-test',
    drawTest,
    'rounded-rects',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Single 1px Stroked Rounded Rectangle (Crisp, Centered at Grid)',
        description: 'Tests crisp rendering of a single 1px red stroked rounded rectangle, centered at a grid crossing.',
        displayName: 'Perf: RRect 1px Crisp Grid Center'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests the crisp rendering of a single, 1px red-stroked rounded rectangle. The shape is centered on a physical pixel's center coordinates to test for precise alignment.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws and registers itself as a 'rounded-rects' test.
 * | Count                  | single         | The test draws a single shape instance in its primary visual regression mode.
 * | SizeCategory           | mixed          | Base rect dimensions are randomized in [20, 149], spanning size categories S, M, and L.
 * | FillStyle              | none           | The test only calls `ctx.strokeRoundRect()` and does not apply a fill.
 * | StrokeStyle            | opaque         | The stroke color is hardcoded to `rgba(255,0,0,1)`, which is fully opaque.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is hardcoded to 1.
 * | Layout                 | centered       | The shape is positioned relative to the canvas center.
 * | CenteredAt             | pixel          | Center coordinates are calculated as `floor(dim / 2) + 0.5`.
 * | EdgeAlignment          | crisp          | The code explicitly uses `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | square         | The rectangle is axis-aligned with no rotation.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to rectangle shapes.
 * | RoundRectRadius        | randomized     | The corner radius is calculated using `SeededRandom.getRandom()`.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not involve clipping.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is not just opaque, it is specifically opaque red. This level of detail is not
 *   captured in the filename facets.
 */

/**
 * @fileoverview Test definition for a single 1px stroked rounded rectangle centered at a pixel.
 */

// Helper functions like _colorObjectToString, getRandomColor, placeCloseToCenterAtPixel, 
// and adjustDimensionsForCrispStrokeRendering are assumed to be globally available
// from included utility scripts (e.g., random-utils.js, scene-creation-utils.js)
// and use SeededRandom internally as needed. 
// parseColor (for polyfills) also assumed global.

/**
 * Draws a single 1px stroked rounded rectangle, centered at a pixel.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it should draw one primary shape for visual
 *                  regression, and `instances` count for performance, each with unique properties based on SeededRandom.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp pixel-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Determine center point (e.g., 100.5, 100.5 for pixel centering)
        // Adapting placeCloseToCenterAtPixel(canvasWidth, canvasHeight) from scene-creation-utils.js
        const centerX = Math.floor(canvasWidth / 2) + 0.5;
        const centerY = Math.floor(canvasHeight / 2) + 0.5;

        // SeededRandom Call 1: rectWidth base
        const baseRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
        // SeededRandom Call 2: rectHeight base
        const baseRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

        // Adjust dimensions for a 1px stroke centered at the pixel center
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseRectWidth, baseRectHeight, 1, { x: centerX, y: centerY });
        const finalRectWidth = adjusted.width;
        const finalRectHeight = adjusted.height;

        // SeededRandom Call 3: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        
        const strokeColorStr = 'rgba(255,0,0,1)'; // Red, Opaque
        // fillColor is transparent, so not explicitly set before strokeRoundRect if it defaults or isn't used by it.
        // If strokeRoundRect also fills, we would need: ctx.fillStyle = 'rgba(0,0,0,0)';

        let geomX = centerX - finalRectWidth / 2;
        let geomY = centerY - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1;
        // Assumes fillStyle is not used by strokeRoundRect or is already transparent.
        // If fillRoundRect also fills, ensure fillStyle is transparent:
        // const originalFillStyle = ctx.fillStyle;
        // ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        // if (originalFillStyle) ctx.fillStyle = originalFillStyle;

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RoundedRect Centered@Pixel: center=(${centerX},${centerY}), base W/H=(${baseRectWidth},${baseRectHeight}), adj W/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, geom=(${geomX.toFixed(1)},${geomY.toFixed(1)})`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                checkData = {
                    leftX: Math.floor(geomX),
                    rightX: Math.floor(geomX + finalRectWidth),
                    topY: Math.floor(geomY),
                    bottomY: Math.floor(geomY + finalRectHeight)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'roundrect-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenPx-edgeCrisp-ornAxial-rrrRand-test',
    drawTest,
    'rounded-rects',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Single 1px Stroked Rounded Rectangle (Crisp, Centered at Pixel)',
        description: 'Tests crisp rendering of a single 1px red stroked rounded rectangle, centered at a pixel center.',
        displayName: 'Perf: RRect 1px Crisp Pixel Center'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single rounded rectangle with random stroke widths (opaque), random fills, centered at a grid crossing, with explicit logic to make it crisp.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws using `ctx.fillRoundRect()` and `ctx.strokeRoundRect()`.
 * | Count                  | single         | The test is designed to draw one shape in its visual regression mode (`instances = null`).
 * | SizeCategory           | mixed          | `baseRectWidth` is randomized in `[50, 50 + 0.6 * canvasWidth]`. With a typical 800px canvas, this spans M, L, and XL size categories.
 * | FillStyle              | semitransparent| Fill color alpha is randomized in `[100, 200]` via `getRandomColor("semitransparent")`.
 * | StrokeStyle            | opaque         | Stroke color alpha is fixed at 255 via `getRandomColor("opaque")`.
 * | StrokeThickness        | 1px-11px       | `strokeWidth` is `Math.round(SeededRandom.getRandom() * 10 + 1)`, which results in an integer range of 1 to 11.
 * | Layout                 | centered       | The shape's reference point is calculated at the canvas center (`Math.floor(canvasWidth / 2)`).
 * | CenteredAt             | grid           | The center coordinates are snapped to integer values (`Math.floor`), aligning them with grid intersections.
 * | EdgeAlignment          | crisp          | The code explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure pixel-perfect edges.
 * | Orientation            | square         | The test draws an axis-aligned rectangle with no rotation applied.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to rectangle shapes.
 * | RoundRectRadius        | randomized     | The corner radius is randomized based on the rectangle's final dimensions.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not use `ctx.clip()`.
 * | Clipped on shape count | n/a            | Clipping is not used.
 * | Clipped on shape arrangement | n/a      | Clipping is not used.
 * | Clipped on shape size  | n/a            | Clipping is not used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 *  - In performance testing mode (`instances > 0`), the layout changes from `centered` to a random `spread`.
 *
 */

/**
 * @fileoverview Test definition for a single centered rounded rectangle with random opaque stroke and random fill, centered at a grid point.
 */

// Helper functions like _colorObjectToString, getRandomColor, placeCloseToCenterAtGrid (implicitly by centerX/Y calc),
// and adjustDimensionsForCrispStrokeRendering are assumed to be globally available.
// parseColor (for polyfills) also assumed global.

/**
 * Draws a single centered rounded rectangle with random opaque stroke and random fill.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it should draw one primary shape for visual
 *                  regression, and `instances` count for performance, each with unique properties based on SeededRandom.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const maxWidth = canvasWidth * 0.6;
    const maxHeight = canvasHeight * 0.6;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp grid-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Center is at grid crossing
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        // SeededRandom Call 1: strokeWidth
        const strokeWidth = Math.round(SeededRandom.getRandom() * 10 + 1);
        // SeededRandom Call 2: baseRectWidth
        const baseRectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
        // SeededRandom Call 3: baseRectHeight
        const baseRectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

        // Adjust dimensions for crisp rendering with the random strokeWidth
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseRectWidth, baseRectHeight, strokeWidth, { x: centerX, y: centerY });
        const finalRectWidth = adjusted.width;
        const finalRectHeight = adjusted.height;

        // SeededRandom Call 4: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        
        // SeededRandom Call 5 (potentially multiple inside getRandomColor): strokeColor (opaque)
        const strokeColorObj = getRandomColor("opaque"); 
        // SeededRandom Call 6 (potentially multiple inside getRandomColor): fillColor (semi-transparent)
        const fillColorObj = getRandomColor("semitransparent");

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let geomX = centerX - finalRectWidth / 2;
        let geomY = centerY - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        // Set styles before drawing
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        // Use the new context methods. Order: fill then stroke.
        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        if (strokeWidth > 0) { // only stroke if there is a stroke width
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        }

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `CenteredRRect: center=(${centerX},${centerY}), baseW/H=(${baseRectWidth},${baseRectHeight}), adjW/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, sw=${strokeWidth.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    // No checkData for extremes, but return logs for visual regression run.
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-sgl-szMix-fSemi-sOpaq-sw1-11px-lytCenter-cenGrid-edgeCrisp-ornAxial-rrrRand-test',
    drawTest,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        uniqueColors: { 
            middleRow: { count: 2 }, // Updated structure
            middleColumn: { count: 2 } // Added from original define
        }, 
        speckles: true
    },
    {
        title: 'Single Centered Rounded Rectangle (Random Opaque Stroke, Random Fill, Grid Center)',
        description: 'Tests a single rounded rectangle with random stroke widths (opaque), random fills, centered at a grid crossing.',
        displayName: 'Perf: RRect RandStroke Opaque Grid Fill'
    }
); 
})();

(function() {
/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single rounded rectangle with random stroke widths and semi-transparent colors, centered crisply (grid or pixel).
 *
 *
 * ---
 *
 * | Facet                  | Value               | Reason
 * |------------------------|---------------------|----------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | `rounded-rects`     | The test renders a rounded rectangle using `ctx.fillRoundRect()` and `ctx.strokeRoundRect()`.
 * | Count                  | `single`            | The test logic draws only one shape instance in visual test mode.
 * | SizeCategory           | `mixed`             | The rectangle's width/height are randomized (e.g., from `50` to `~530px`), spanning M, L, and XL size categories.
 * | FillStyle              | `semitransparent`   | Fill color is set with a random alpha between 50 and 150 (out of 255) using `getRandomColor("semitransparent-light")`.
 * | StrokeStyle            | `semitransparent`   | Stroke color is set with a random alpha between 50 and 150 (out of 255) using `getRandomColor("semitransparent-light")`.
 * | StrokeThickness        | `mixed`             | Stroke width is randomized to be an even number between 2 and 42. A discrete set of values is categorized as 'mixed'.
 * | Layout                 | `centered`          | The shape's position is calculated relative to the canvas center.
 * | CenteredAt             | `mixed-pixel-grid`  | The center has a 50% chance of being on a grid intersection (integer coordinates) or a pixel center (`*.5` coordinates).
 * | EdgeAlignment          | `crisp`             | The test uses the `adjustDimensionsForCrispStrokeRendering()` helper function to ensure sharp edges.
 * | Orientation            | `square`            | The rectangle is always drawn axis-aligned with no rotation.
 * | ArcAngleExtent         | `N/A`               | This facet is not applicable to rectangle shapes.
 * | RoundRectRadius        | `randomized`        | The corner radius is randomized based on a fraction of the rectangle's dimensions.
 * | ContextTranslation     | `none`              | The test code does not contain any calls to `ctx.translate()`.
 * | ContextRotation        | `none`              | The test code does not contain any calls to `ctx.rotate()`.
 * | ContextScaling         | `none`              | The test code does not contain any calls to `ctx.scale()`.
 * | Clipped on shape       | `none`              | The test code does not contain any calls to `ctx.clip()`.
 * | Clipped on shape count | `n/a`               | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | `n/a`         | Not applicable as there is no clipping.
 * | Clipped on shape size  | `n/a`               | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | `n/a`      | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke width is randomized to be an even integer in the range [2, 42].
 * - The rectangle's dimensions are randomized to be in the approximate range of [50, ~530] pixels.
 * - The corner radius is randomized based on the final, crisp-adjusted rectangle dimensions.
 *
 */

/**
 * @fileoverview Test definition for a single centered rounded rectangle with semi-transparent stroke and fill.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCrispFillAndStrokeRectParams are available from test-helper-functions.js


/**
 * Draws a single centered rounded rectangle with semi-transparent stroke and fill.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Calls 1-4 for SeededRandom happen inside calculateCrispFillAndStrokeRectParams
        const placement = calculateCrispFillAndStrokeRectParams({
            canvasWidth,
            canvasHeight,
            minWidth: 50,
            maxWidth: canvasWidth * 0.6,
            minHeight: 50,
            maxHeight: canvasHeight * 0.6,
            maxStrokeWidth: 40,        // Higher max stroke width for this test
            ensureEvenStroke: true,
            randomPosition: false      // Centered positioning
        });
        const center = placement.center;
        const finalRectWidth = placement.adjustedDimensions.width;
        const finalRectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // SeededRandom Call 5: strokeColor (semi-transparent)
        const strokeColorObj = getRandomColor("semitransparent-light"); 
        // SeededRandom Call 6: fillColor (semi-transparent)
        const fillColorObj = getRandomColor("semitransparent-light");
        // SeededRandom Call 7: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);

        const strokeColorStr = strokeColorObj ? strokeColorObj.toCSS() : 'rgba(0,0,0,0)';
        const fillColorStr = fillColorObj ? fillColorObj.toCSS() : 'rgba(0,0,0,0)';

        let geomX = center.x - finalRectWidth / 2;
        let geomY = center.y - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        if (strokeWidth > 0) {
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        }

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `TransparentRRect: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), adjW/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, sw=${strokeWidth.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-sgl-szMix-fSemi-sSemi-swMix-lytCenter-cenMixPG-edgeCrisp-ornAxial-rrrRand-test',
    drawTest,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        uniqueColors: {
            middleRow: { count: 3 },
            middleColumn: { count: 3 }
        },
        speckles: true
    },
    {
        title: 'Single Centered Rounded Rectangle (Semi-Transparent Stroke & Fill, Crisp Center)',
        description: 'Tests a single rounded rectangle with random stroke widths and semi-transparent colors, centered crisply (grid or pixel).',
        displayName: 'Perf: RRect RandTrans Stroke/Fill CrispCenter'
    }
);
})();

(function() {
/**
 * @fileoverview Test definition for a combined scene with all shape types.
 *
 * TEST SUMMARY:
 * =================
 *
 * Description: A test scene combining various shapes. This test draws a large, complex
 * scene by calling numerous individual shape-generating functions (e.g., for lines,
 * rectangles, circles, arcs) to populate the canvas. It serves as a comprehensive
 * integration test for the renderer.
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | mixed          | Draws lines, rectangles, circles, arcs, and rounded-rects.
 * | Count                  | multi          | Draws a large number of shapes in total (15 lines, 10 rects, 40+ rounded-rects, etc.).
 * | SizeCategory           | mixed          | The various shape-generating functions create primitives of many different sizes.
 * | FillStyle              | mixed          | Some shapes are filled (opaque/transparent), others are not (e.g., lines).
 * | StrokeStyle            | mixed          | Some shapes have opaque/transparent strokes, while others have no stroke.
 * | StrokeThickness        | mixed          | Stroke width varies between the different shape types being drawn.
 * | Layout                 | mixed          | Shapes are distributed across the canvas, some in grids, some randomly.
 * | CenteredAt             | N/A            | Not a relevant characteristic for a complex scene with a `mixed` layout.
 * | EdgeAlignment          | mixed          | Combines axis-aligned, rotated, and random shapes, resulting in both crisp and non-crisp edges.
 * | Orientation            | mixed          | Includes axis-aligned, rotated, and randomly oriented shapes.
 * | ArcAngleExtent         | mixed          | Includes both fixed 90-degree arcs and random-angle arcs.
 * | RoundRectRadius        | mixed          | Includes rounded rectangles with various and likely randomized corner radii.
 * | ContextTranslation     | fixed          | Uses `ctx.translate()` to position rectangles before rotation.
 * | ContextRotation        | fixed          | Uses `ctx.rotate()` to draw rotated rectangles.
 * | ContextScaling         | none           | The code does not use `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping is performed in this test.
 * | Clipped on shape count | N/A            | Not applicable as no clipping is performed.
 * | Clipped on shape arrangement | N/A      | Not applicable as no clipping is performed.
 * | Clipped on shape size  | N/A            | Not applicable as no clipping is performed.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Specific shapes included, count of each, actual scene parameters/layout; precise
 * randomization details for each sub-component (size, fill, stroke, etc.) are mixed
 * and not individually captured. SizeCategory remains mixed as shape category is mixed.
 *
 */

// Assumes all individual scene-creation functions (addRandomLines, addAxisAlignedRectangles, etc.)
// and helper functions (_colorObjectToString, getRandomColor, getRandomPoint, etc.) are globally available
// as they are included in the HTML test pages.

/**
 * Draws a combined scene mimicking the original buildScene function.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of full scenes to draw. 
 *                  In visual mode (instances is null/0), one full scene is drawn with original counts.
 *                  In performance mode, `instances` full scenes are drawn.
 * @returns {?{logs: string[]}} Logs for the visual regression run.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numScenesToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    const dummyLog = { innerHTML: '' }; // Original functions write to log.innerHTML

    // Helper to draw shapes from the array populated by original add... functions
    function drawShapesFromArray(shapesArray, context) {
        shapesArray.forEach(shape => {
            const fillColorStr = shape.fillColor ? shape.fillColor.toCSS() : 'rgba(0,0,0,0)'    ;
            const strokeColorStr = shape.strokeColor ? shape.strokeColor.toCSS() : 'rgba(0,0,0,0)'    ;
            context.fillStyle = fillColorStr;
            context.strokeStyle = strokeColorStr;
            context.lineWidth = shape.strokeWidth || (shape.thickness || 0); // Use thickness for lines

            if (shape.type === 'rect') {
                if (shape.rotation && shape.rotation !== 0) {
                    context.save();
                    context.translate(shape.center.x, shape.center.y);
                    context.rotate(shape.rotation);
                    if (shape.fillColor && shape.fillColor.a > 0) {
                        context.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
                    }
                    if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                        context.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
                    }
                    context.restore();
                } else {
                    const x = shape.center.x - shape.width / 2;
                    const y = shape.center.y - shape.height / 2;
                    if (shape.fillColor && shape.fillColor.a > 0) {
                        context.fillRect(x, y, shape.width, shape.height);
                    }
                    if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                        context.strokeRect(x, y, shape.width, shape.height);
                    }
                }
            } else if (shape.type === 'roundedRect') {
                const x = shape.center.x - shape.width / 2;
                const y = shape.center.y - shape.height / 2;
                if (shape.fillColor && shape.fillColor.a > 0) {
                    context.fillRoundRect(x, y, shape.width, shape.height, shape.radius);
                }
                if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                    context.strokeRoundRect(x, y, shape.width, shape.height, shape.radius);
                }
            } else if (shape.type === 'circle') {
                if (shape.fillColor && shape.fillColor.a > 0 && shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                    context.fillAndStrokeCircle(shape.center.x, shape.center.y, shape.radius,
                        shape.fillColor, shape.strokeWidth, shape.strokeColor);
                } else if (shape.fillColor && shape.fillColor.a > 0) {
                    context.fillCircle(shape.center.x, shape.center.y, shape.radius, shape.fillColor);
                } else if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                    context.strokeCircle(shape.center.x, shape.center.y, shape.radius, shape.strokeWidth, shape.strokeColor);
                }
            } else if (shape.type === 'line') {
                context.strokeLine(shape.start.x, shape.start.y, shape.end.x, shape.end.y);
            } else if (shape.type === 'arc') {
                const startAngleRad = (shape.startAngle || 0) * Math.PI / 180;
                const endAngleRad = (shape.endAngle || 0) * Math.PI / 180;
                // Assuming fill implies fill, stroke implies stroke, both implies both
                const hasFill = shape.fillColor && shape.fillColor.a > 0;
                const hasStroke = shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0;

                if (hasFill && hasStroke) {
                    context.fillAndOuterStrokeArc(shape.center.x, shape.center.y, shape.radius, 
                                           startAngleRad, endAngleRad, shape.counterClockwise || false);
                } else if (hasFill) {
                    context.fillArc(shape.center.x, shape.center.y, shape.radius, 
                                  startAngleRad, endAngleRad, shape.counterClockwise || false);
                } else if (hasStroke) {
                    context.outerStrokeArc(shape.center.x, shape.center.y, shape.radius, 
                                    startAngleRad, endAngleRad, shape.counterClockwise || false);
                }
            }
        });
    }

    for (let sceneIdx = 0; sceneIdx < numScenesToDraw; sceneIdx++) {
        const effectiveIterationNumber = currentIterationNumber + sceneIdx;
        let shapes = [];

        // 1. Random Lines (Original count: 15)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRandomLines(shapes, dummyLog, effectiveIterationNumber, 15); 
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 2. Axis Aligned Rectangles (Original count: 5)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addAxisAlignedRectangles(shapes, dummyLog, effectiveIterationNumber, 5);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 3. Rotated Rectangles (Original count: 5)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRotatedRectangles(shapes, dummyLog, effectiveIterationNumber, 5);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 4. Axis-Aligned Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addAxisAlignedRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 5. Large Transparent Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addLargeTransparentRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 6. No-Stroke Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addNoStrokeRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 7. 90-degree Arcs (Original: no count, creates 12)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addNinetyDegreeArcs(shapes, dummyLog, effectiveIterationNumber);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 8. Random Arcs (Original count: 3)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRandomArcs(shapes, dummyLog, effectiveIterationNumber, 3);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 9. Random Circles (Original count: 5)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRandomCircles(shapes, dummyLog, effectiveIterationNumber, 5);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 10. Thin Opaque Stroke Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addThinOpaqueStrokeRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];
        
        if (!isPerformanceRun) { // Log only for the single visual pass (which is sceneIdx = 0)
            logs.push(`Drew combined scene instance ${sceneIdx + 1} based on effective iteration ${effectiveIterationNumber}.`);
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs };
}

// Register the test
registerHighLevelTest(
    'scene-multi-szMix-fMix-sMix-swMix-lytMix-edgeMix-ornMix-arcAMix-rrrMix-ctxTransFixed-ctxRotFixed-test',
    drawTest,
    'scenes',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Scenes: All-shapes-combined',
        displayName: 'Scenes: All-shapes-combined',
        description: 'A test scene combining various shapes. This test draws a large, complex scene by calling numerous individual shape-generating functions (e.g., for lines, rectangles, circles, arcs) to populate the canvas. It serves as a comprehensive integration test for the renderer.'
    }
); })();

/**
 * Node.js Test Runner for Minimal-2D-Js-Software-Renderer - High Level Tests
 * ==========================================================================
 * 
 * This script runs high-level software renderer tests in Node.js without a browser.
 * It uses tests defined in individual test files within tests/browser-tests/test-cases/
 * to run tests via command line.
 */

const fs = require('fs');
const path = require('path');

// Node.js specific version of RenderTest should already be loaded via concatenation

const { exit } = require('process');

function printHelp() {
    console.log(`
  Node.js High-Level Test Runner for Minimal-2D-Js-Software-Renderer
  ===================================================================
  
  Usage: node node-high-level-test-runner.js [options]
  
  Options:
    -i, --id <id>         Test ID to run
    -I, --iteration <num> Specific iteration number to run (uppercase I to avoid clash with id's -i)
    -c, --count <num>     Number of iterations to run
    -r, --range <s-e>     Range of iterations to run (e.g., 1-10)
    -p, --progress        Show progress indicator
    -l, --list            List all available tests
    -o, --output <dir>    Directory to save output images (default: ./test-output-high-level)
    -t, --test            Run one iteration for all tests in the registry
    -v, --verbose         Show detailed test output
    -h, --help            Display this help information
  
  Examples:
    node node-high-level-test-runner.js --list
    node node-high-level-test-runner.js --id=lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient --iteration=5
    node node-high-level-test-runner.js --test --output=./test-output-high-level
    node node-high-level-test-runner.js --id=rectangles--L-size--filled--1px-opaque-stroke--smooth-pixel-pos-and-size--no-rotation --count=100 --progress
    node node-high-level-test-runner.js --id=circles--M-size--filled--no-stroke--smooth-pixel-pos--smooth-radius --range=1-5 --output=./results-high-level
  `);
  }
  
  // Simple argument parser
  function parseArgs(args) {
    const options = {
      output: './test-output-high-level' // Default output directory
    };
    
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--list' || arg === '-l') {
        options.list = true;
      } else if (arg === '--progress' || arg === '-p') {
        options.progress = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--test' || arg === '-t') {
        options.test = true;
      } else if (arg.startsWith('--id=')) {
        options.id = arg.substring(5);
      } else if (arg.startsWith('--iteration=')) { // Keep matching long form
        options.iteration = parseInt(arg.substring(12));
      } else if (arg.startsWith('--count=')) {
        options.count = parseInt(arg.substring(8));
      } else if (arg.startsWith('--range=')) {
        options.range = arg.substring(8);
      } else if (arg.startsWith('--output=')) {
        options.output = arg.substring(9);
      } else if (arg === '--id' || arg === '-i') {
        if (i + 1 < args.length) options.id = args[++i];
      } else if (arg === '--iteration' || arg === '-I') { // Match short form -I
        if (i + 1 < args.length) options.iteration = parseInt(args[++i]);
      } else if (arg === '--count' || arg === '-c') {
        if (i + 1 < args.length) options.count = parseInt(args[++i]);
      } else if (arg === '--range' || arg === '-r') {
        if (i + 1 < args.length) options.range = args[++i];
      } else if (arg === '--output' || arg === '-o') {
        if (i + 1 < args.length) options.output = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        printHelp();
        process.exit(0);
      }
    }
    
    return options;
  }
  
  console.log("[High-Level Runner Base] Script top level reached.");

  // Parse command line arguments
  console.log("[High-Level Runner Base] Parsing arguments...");
  const options = parseArgs(process.argv);
  console.log("[High-Level Runner Base] Arguments parsed:", options);

  // Display help if no arguments provided
  if (process.argv.length <= 2) {
    console.log("[High-Level Runner Base] No arguments, printing help and exiting.");
    printHelp();
    process.exit(0);
  }
  
  // Export image data for tests
  function saveOutputImage(test, iterationNum, outputDir) {
    try {
      // Create output directory if it doesn't exist (specific path for this test)
      const testOutputDir = path.join(outputDir, test.id);
       if (!fs.existsSync(testOutputDir)) {
         fs.mkdirSync(testOutputDir, { recursive: true });
       }

      console.log(`Saving image for test ${test.id}, iteration ${iterationNum} to ${testOutputDir}`);
      
      // Use the built-in exportBMP method, passing the specific directory
      const filePath = test.exportBMP(testOutputDir, iterationNum);
      
      if (filePath) {
        console.log(`  Saved BMP to ${filePath}`);
        return filePath;
      } else {
        console.error(`  Failed to save output image for test ${test.id}, iteration ${iterationNum}`);
        return null;
      }
    } catch (err) {
      console.error(`  Failed to save output image for test ${test.id}, iteration ${iterationNum}: ${err.message}`);
      console.error(err.stack);
      return null;
    }
  }
  
  // Save test results as text
  function saveTestResults(testId, iterationNum, test, outputDir) {
    try {
      // Create output directory if it doesn't exist (specific path for this test)
      const testOutputDir = path.join(outputDir, test.id);
      if (!fs.existsSync(testOutputDir)) {
        fs.mkdirSync(testOutputDir, { recursive: true });
      }
      
      // Create result text
      let resultText = `Test: ${test.title}\n`;
      resultText += `ID: ${testId}\n`;
      resultText += `Iteration: ${iterationNum}\n`;
      resultText += `Errors: ${test.errorCount}\n\n`;

      // Add Primitive Logs
      if (test.primitiveLogs && test.primitiveLogs.length > 0) {
        resultText += 'Primitives Drawn:\n';
        
        let decodedLogs = test.primitiveLogs.replace(/<br\s*\/?>/gi, '\n'); // Convert <br> to \n first
        
        // Decode numeric HTML entities (hex and decimal)
        decodedLogs = decodedLogs.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
        decodedLogs = decodedLogs.replace(/&#([0-9]+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
        
        // Also decode common named entities - &amp; must be last
        decodedLogs = decodedLogs.replace(/&lt;/g, '<');
        decodedLogs = decodedLogs.replace(/&gt;/g, '>');
        decodedLogs = decodedLogs.replace(/&quot;/g, '"');
        decodedLogs = decodedLogs.replace(/&apos;/g, "'");
        decodedLogs = decodedLogs.replace(/&amp;/g, '&');

        const plainTextLogs = decodedLogs
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        resultText += plainTextLogs + '\n\n'; // Add extra newline for separation
      } else {
        resultText += 'Primitives Drawn: None logged.\n\n';
      }
      
      if (test.errorCount > 0) {
        resultText += 'Error Messages:\n';
        test.errors.forEach((error, index) => {
          resultText += `${index + 1}. ${error}\n`;
        });
      }
      
      // Add checks results if available
      if (test.functionToRunAllChecks) {
         // We need to manually execute the check function in Node.js environment
         // It expects the test instance as context.
         let checksLog = "";
         let checkErrorCountBefore = test.errorCount;
         try {
             // Simulate the browser log container (might need refinement if checks use DOM heavily)
             let nodeLogContainer = { innerHTML: "" }; 
             let checkResults = test.functionToRunAllChecks(test, nodeLogContainer); // Pass the test instance
             checksLog = nodeLogContainer.innerHTML; // Capture logs if any check uses it
              // Some checks might return strings or directly call test.showError()
             if (typeof checkResults === 'string' && checkResults) {
                 checksLog += (checksLog ? '\n' : '') + checkResults;
             } else if (test.errorCount > checkErrorCountBefore) {
                 // Errors were added directly via test.showError() during checks
                 checksLog += (checksLog ? '\n' : '') + `Checks resulted in ${test.errorCount - checkErrorCountBefore} new error(s).`;
             } else if (!checksLog) {
                 checksLog = "Checks completed (no specific log output, see errors above if any).";
             }
         } catch (checkErr) {
             checksLog += `\nError during check execution: ${checkErr.message}`;
             console.error(`Error executing checks for ${testId}:`, checkErr);
         }
         resultText += '\nChecks Log:\n';
         resultText += checksLog;
      } else {
         resultText += '\nChecks: No checks configured for this test.\n';
      }
      
      // Save to file
      const logFilename = `iteration${iterationNum}-results.txt`; // Simplified name within test folder
      const logFilePath = path.join(testOutputDir, logFilename);
      fs.writeFileSync(logFilePath, resultText);
      
      console.log(`  Saved results to ${logFilePath}`);
      return logFilePath;
    } catch (err) {
      console.error(`  Failed to save test results for ${testId}, iteration ${iterationNum}: ${err.message}`);
      return null;
    }
  }
  
  // Main execution function
  function main() {
    console.log("[High-Level Runner Base] main() function started.");
    
    // Ensure RenderTest registry exists (it should be populated by concatenated test files)
    const registrySize = Object.keys(RenderTest.registry).length;
    console.log(`[High-Level Runner Base] Found ${registrySize} tests registered.`);
    if (registrySize === 0) {
        console.warn("Warning: No tests found in the registry. Ensure test files were correctly concatenated and executed.");
        // Don't exit immediately, maybe --list was intended
    }


    // Handle --list option to show all tests
    if (options.list) {
      console.log("[High-Level Runner Base] Executing --list command.");
      console.log('Available high-level tests:');
      if (registrySize > 0) {
         Object.keys(RenderTest.registry).sort().forEach(id => {
           const test = RenderTest.registry[id];
           console.log(`  ${id} - ${test.title}`);
         });
      } else {
          console.log("  (No tests registered)");
      }
      process.exit(0);
    }
  
    // Handle --test option to run one iteration for all registered tests
    if (options.test) {
      console.log("[High-Level Runner Base] Executing --test command.");
      console.log('Running one iteration for all registered high-level tests...');
      
      const testIds = Object.keys(RenderTest.registry).sort();
      
      if (testIds.length === 0) {
          console.error("Error: No tests found to run with --test option.");
          process.exit(1);
      }
      
      // Create base output directory if needed
      if (options.output) {
        if (!fs.existsSync(options.output)) {
          fs.mkdirSync(options.output, { recursive: true });
          console.log(`Created output directory: ${options.output}`);
        }
      } else {
          console.log("No output directory specified. Results and images will not be saved.");
      }
      
      let totalTests = testIds.length;
      let passedTests = 0;
      let failedTests = 0;
      
      // Show progress if requested
      const showProgress = options.progress;
      
      // Run all tests with iteration #1
      testIds.forEach((testId, index) => {
        const test = RenderTest.registry[testId];
        const iterationNum = 1; // Always use iteration #1 for the --test option
        
        if (showProgress) {
          const percent = Math.floor((index / totalTests) * 100);
          process.stdout.write(`Progress: ${percent}% [${index}/${totalTests}] - Running ${testId}`);
        } else {
          console.log(`
Running test ${index+1}/${totalTests}: ${testId} - ${test.title}`);
        }
        
        // Set verbosity on the test
        test.verbose = options.verbose;
        
        try {
           // High-level tests primarily use canvasCodeFn
          const success = test.render(null, test.canvasCodeFn, iterationNum); 
          
          if (success && test.errorCount === 0) {
            passedTests++;
            if (options.verbose) {
              console.log(`
${testId} passed (Iteration ${iterationNum})`);
            }
          } else {
            failedTests++;
            // Ensure error count is accurate if render returned true but checks failed
            const finalErrorCount = test.errorCount > 0 ? test.errorCount : (!success ? 1 : 0); 
            console.log(`
${testId} failed with ${finalErrorCount} error(s) (Iteration ${iterationNum})`);
             if (options.verbose && test.errors && test.errors.length > 0) {
                 test.errors.forEach((e, i) => console.log(`  Error ${i+1}: ${e}`));
             }
          }
          
          // Save output regardless of success/failure if output dir is set
          if (options.output) {
            const imagePath = saveOutputImage(test, iterationNum, options.output);
            const resultPath = saveTestResults(testId, iterationNum, test, options.output);
          }
        } catch (err) {
          failedTests++;
          console.error(`
Critical error running test ${testId} (Iteration ${iterationNum}): ${err.message}`);
          if (options.verbose) {
            console.error(err.stack);
          }
           // Attempt to save results even on critical error if possible
           if (options.output && test) {
               test.showError(`Critical execution error: ${err.message}`); // Add error to test object
               console.error(err.stack);
               saveTestResults(testId, iterationNum, test, options.output);
           }
        }
        console.log(`[High-Level Runner Base] --test loop: Finished test ${testId}`);
      });
      
      if (showProgress) {
        process.stdout.write('\rProgress: 100% [Complete]                                                              \n');
      }
      
      // Print summary
      console.log(`\nHigh-Level Test execution complete`);
      console.log(`Total tests run: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${failedTests}`);
      
      // Return appropriate exit code
      process.exit(failedTests > 0 ? 1 : 0);
    }
  
    // Standard single test run mode
    if (!options.id) {
      console.error('Error: Test ID is required. Use --list to see available tests, or use --test to run all tests.');
      process.exit(1);
    }
  
    const testId = options.id;
    const test = RenderTest.registry[testId];
    if (!test) {
      console.error(`Error: Test with ID "${testId}" not found. Use --list to see available tests.`);
      process.exit(1);
    }
  
    // Set verbosity on the test
    test.verbose = options.verbose;
  
    // Determine which iterations to run
    let iterationNumbers = [];
  
    if (options.iteration) {
      iterationNumbers = [parseInt(options.iteration)];
    } else if (options.count) {
      iterationNumbers = Array.from({length: parseInt(options.count)}, (_, i) => i + 1);
    } else if (options.range) {
      const [start, end] = options.range.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start <= 0 || start > end) { // Iterations are 1-based
        console.error('Error: Range must be in format "start-end" with 1 <= start <= end.');
        process.exit(1);
      }
      iterationNumbers = Array.from({length: end - start + 1}, (_, i) => i + start);
    } else {
      // Default to a single iteration
      iterationNumbers = [1];
    }
  
    // Run the test(s)
    console.log(`Running high-level test: ${test.title} (ID: ${testId})`);
    if (iterationNumbers.length === 1) {
        console.log(`Running iteration: #${iterationNumbers[0]}`);
    } else {
        console.log(`Running iterations: ${iterationNumbers[0]} to ${iterationNumbers[iterationNumbers.length - 1]} (${iterationNumbers.length} total)`);
    }
  
    // Show progress if requested
    const showProgress = options.progress && iterationNumbers.length > 1;
    let failedIterations = 0;
    let passedIterations = 0;
  
    // Create base output directory if needed
    if (options.output) {
       if (!fs.existsSync(options.output)) {
           fs.mkdirSync(options.output, { recursive: true });
           console.log(`Created output directory: ${options.output}`);
       }
    } else {
        console.log("No output directory specified. Results and images will not be saved.");
    }

    // Run the iterations
    iterationNumbers.forEach((iterationNum, index) => {

      if (showProgress) {
        const percent = Math.floor(((index + 1) / iterationNumbers.length) * 100);
        process.stdout.write(`Progress: ${percent}% [${index + 1}/${iterationNumbers.length}]`);
      } else if (iterationNumbers.length > 1) {
          console.log(`--- Iteration #${iterationNum} ---`);
      }
  
      try {
          // High-level tests primarily use canvasCodeFn
          const success = test.render(null, test.canvasCodeFn, iterationNum);
          
          if (success && test.errorCount === 0) {
            passedIterations++;
            if (options.verbose) {
              console.log(`
Iteration #${iterationNum} passed`);
            }
            
            // Save output for successful tests as well
            if (options.output) {
              const imagePath = saveOutputImage(test, iterationNum, options.output);
              const resultPath = saveTestResults(testId, iterationNum, test, options.output);
            }
          } else {
            failedIterations++;
            const finalErrorCount = test.errorCount > 0 ? test.errorCount : (!success ? 1 : 0);
            console.log(`
Iteration #${iterationNum} failed with ${finalErrorCount} error(s)`);
             if (options.verbose && test.errors && test.errors.length > 0) {
                 test.errors.forEach((e, i) => console.log(`  Error ${i+1}: ${e}`));
             }
            
            // Save output for failed tests
            if (options.output) {
              const imagePath = saveOutputImage(test, iterationNum, options.output);
              const resultPath = saveTestResults(testId, iterationNum, test, options.output);
            }
          }
      } catch (err) {
          failedIterations++;
          console.error(`
Critical error running test ${testId} (Iteration ${iterationNum}): ${err.message}`);
           if (options.verbose) {
               console.error(err.stack);
           }
            // Attempt to save results even on critical error if possible
            if (options.output && test) {
                test.showError(`Critical execution error: ${err.message}`); // Add error to test object
                console.error(err.stack);
                saveTestResults(testId, iterationNum, test, options.output);
            }
      }
    });
  
    if (showProgress) {
      process.stdout.write('\rProgress: 100% [Complete]                                                              \n');
    }
  
    // Print summary
    console.log(`\nTest execution complete for ${testId}`);
    console.log(`Total Iterations: ${iterationNumbers.length}`);
    console.log(`Passed: ${passedIterations}`);
    console.log(`Failed: ${failedIterations}`);
    
    // Return appropriate exit code
    process.exit(failedIterations > 0 ? 1 : 0);
  }

// No explicit initialization needed here. 
// Test registration happens when the concatenated test files are executed by Node.js
// just before this script's content runs.
// The main() function checks if the registry was populated.

// Append main() call in build script 
//console.log("[High-Level Runner Base] Finished single test run mode.");
console.log('[High-Level Runner Build] About to call main()...');

main();
console.log('[High-Level Runner Build] main() should have been called.');
