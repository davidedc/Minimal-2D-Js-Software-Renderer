/* CrispSwCanvas for Node.js v1.0.2 */
'use strict';
// Node.js environment setup
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
}class TransformationMatrix {
    constructor() {
        this.elements = new Float64Array([
            1, 0, 0, // first column
            0, 1, 0, // second column
            0, 0, 1 // third column
        ]);
    }

    clone() {
        const clonedMatrix = new TransformationMatrix();
        clonedMatrix.elements.set(this.elements);
        return clonedMatrix;
    }
    
    /**
     * Resets the transformation matrix to the identity matrix
     * @returns {TransformationMatrix} The identity matrix
     */
    reset() {
        this.elements.set([
            1, 0, 0, // first column
            0, 1, 0, // second column
            0, 0, 1 // third column
        ]);
        return this;
    }

    get(row, col) {
        return this.elements[col * 3 + row];
    }

    set(row, col, value) {
        this.elements[col * 3 + row] = value;
    }

    multiply(other) {
        const result = new TransformationMatrix();
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                let sum = 0;
                for (let i = 0; i < 3; i++) {
                    sum += this.get(row, i) * other.get(i, col);
                }
                result.set(row, col, sum);
            }
        }
        return result;
    }

    translate(x, y) {
        const translationMatrix = new TransformationMatrix();
        translationMatrix.elements.set([
            1, 0, 0,
            0, 1, 0,
            x, y, 1
        ]);
        return this.multiply(translationMatrix);
    }

    scale(sx, sy) {
        const scaleMatrix = new TransformationMatrix();
        scaleMatrix.elements.set([
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        ]);
        return this.multiply(scaleMatrix);
    }

    rotate(angleInRadians) {
        const rotationMatrix = new TransformationMatrix();
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        rotationMatrix.elements.set([
            cos, sin, 0,
            -sin, cos, 0,
            0, 0, 1
        ]);
        return this.multiply(rotationMatrix);
    }
}
// Helper function to get scaled line width
function getScaledLineWidth(matrix, baseWidth) {
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
    const scale = Math.max(Math.sqrt(scaleX * scaleY), 0.0001);
    return baseWidth * scale;
}
// Helper function to transform point
function transformPoint(x, y, matrix) {
    const tx = matrix[0] * x + matrix[3] * y + matrix[6];
    const ty = matrix[1] * x + matrix[4] * y + matrix[7];
    return { tx, ty };
}
// Add this helper function to extract rotation angle from transformation matrix
function getRotationAngle(matrix) {
    // For a 2D transformation matrix [a d 0, b e 0, c f 1],
    // the rotation angle can be extracted using atan2(-b, a)
    // matrix[3] is b, matrix[0] is a in column-major order
    return Math.atan2(-matrix[3], matrix[0]);
}
// Add this helper function to get scale factors from matrix
function getScaleFactors(matrix) {
    // For column-major [a d 0, b e 0, c f 1]
    // First column (x-axis): [a, d, 0]
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    // Second column (y-axis): [b, e, 0]
    const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
    return { scaleX, scaleY };
}
// Color parsing and normalization
function parseColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') {
        throw new Error("Invalid color format: must be a string");
    }
    
    colorStr = colorStr.trim().replace(/\s+/g, '');

    // Handle hex colors
    if (colorStr.startsWith('#')) {
        let r, g, b;
        
        if (colorStr.length === 4) {
            // #RGB format
            r = parseInt(colorStr[1] + colorStr[1], 16);
            g = parseInt(colorStr[2] + colorStr[2], 16);
            b = parseInt(colorStr[3] + colorStr[3], 16);
            return normalizeColor(r, g, b, 1);
        } else if (colorStr.length === 7) {
            // #RRGGBB format
            r = parseInt(colorStr.substring(1, 3), 16);
            g = parseInt(colorStr.substring(3, 5), 16);
            b = parseInt(colorStr.substring(5, 7), 16);
            return normalizeColor(r, g, b, 1);
        }
    }

    // Handle rgb/rgba formats
    const rgbMatch = colorStr.match(/^rgb\((\d+),(\d+),(\d+)\)$/i);
    const rgbaMatch = colorStr.match(/^rgba\((\d+),(\d+),(\d+),([0-9]*\.?[0-9]+)\)$/i);

    if (rgbMatch) {
        const [_, r, g, b] = rgbMatch;
        if (r > 255 || g > 255 || b > 255) {
            throw new Error("RGB values must be between 0-255");
        }
        return normalizeColor(+r, +g, +b, 1);
    } else if (rgbaMatch) {
        const [_, r, g, b, a] = rgbaMatch;
        if (r > 255 || g > 255 || b > 255) {
            throw new Error("RGB values must be between 0-255");
        }
        return normalizeColor(+r, +g, +b, +a);
    }
    
    throw new Error(`Invalid color format: ${colorStr}`);
}

function normalizeColor(r, g, b, a) {
    return {
        r: Math.round(Math.max(0, Math.min(255, r))),
        g: Math.round(Math.max(0, Math.min(255, g))),
        b: Math.round(Math.max(0, Math.min(255, b))),
        // the a must be now transformed to 0-255
        a: Math.max(0, Math.min(255, a * 255))
    };
}

function colorToString(colorOrR, g, b, a) {
    // if a color object is passed, convert it to a string
    // like `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a/255).toFixed(3)})`;
    // otherwise, if the four r,g,b,a parameters are passed, convert them to a string
    // like `rgba(${r}, ${g}, ${b}, ${(a/255).toFixed(3)})`;
    // Note that 3 decimal places should be enough, because the alpha is still 8 bits anyways
    // and 1/255 is the smallest increment for the alpha channel and that is 0.003921....
    // the .replace(/\.?0+$/, '') removes any trailing zeros so that we don't have things like "1.000"
    if (typeof colorOrR === 'object') {
        return `rgba(${colorOrR.r}, ${colorOrR.g}, ${colorOrR.b}, ${(colorOrR.a/255).toFixed(3).replace(/\.?0+$/, '')})`;
    } else {
        return `rgba(${colorOrR}, ${g}, ${b}, ${(a/255).toFixed(3).replace(/\.?0+$/, '')})`;
    }
}/**
 * Represents the state of a CrispSwContext at a point in time.
 * Used for save() and restore() operations.
 */
class ContextState {
    constructor(canvasWidth, canvasHeight, lineWidth, transform, strokeColor, fillColor, globalAlpha, clippingMask) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.lineWidth = lineWidth || 1;
        this.transform = transform || new TransformationMatrix();
        this.strokeColor = strokeColor || { r: 0, g: 0, b: 0, a: 1 };
        this.fillColor = fillColor || { r: 0, g: 0, b: 0, a: 1 };
        this.globalAlpha = globalAlpha || 1.0;
        this.clippingMask = clippingMask || new Uint8Array(Math.ceil(canvasWidth * canvasHeight / 8)).fill(255);
    }

    clone() {
        const clippingMaskCopy = new Uint8Array(this.clippingMask);
        return new ContextState(
            this.canvasWidth, this.canvasHeight,
            this.lineWidth,
            this.transform.clone(),
            { ...this.strokeColor }, { ...this.fillColor },
            this.globalAlpha,
            clippingMaskCopy
        );

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
}class PixelSet {
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
}class ScanlineSpans {
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
// Tolerance for considering an angle to be equivalent to a multiple of 90 degrees
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
}class SWRendererPixel {
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
    this.tempClippingMask[byteIndex] |= (1 << (7 - bitIndex));
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
      if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) return;
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
            if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
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
            if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
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
            if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
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
        if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
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
        if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
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
              (clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
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
              (clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
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

class SWRendererRect {
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
             if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
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
              if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
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
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

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
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

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
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 2 (Check needed for x == y)
      // 3rd octant - lower-right quadrant
      if (p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) {
        if (x !== y) { // Avoid plotting diagonal twice when x == y
          const pixelPos = p2y * width + p2x;
          if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
            frameBuffer32[pixelPos] = packedColor;
          }
        }
      }
      // Point 3
      // 2nd octant - upper-right quadrant
      if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) {
        const pixelPos = p3y * width + p3x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 4
      // 1st octant - upper-right quadrant
      if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) {
        const pixelPos = p4y * width + p4x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 5
      // 8th octant - upper-left quadrant
      if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) {
        const pixelPos = p5y * width + p5x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 6 (Check needed for x == y)
      // 7th octant - upper-left quadrant
      if (p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) {
        if (x !== y) { // Avoid plotting diagonal twice when x == y
          const pixelPos = p6y * width + p6x;
          if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
            frameBuffer32[pixelPos] = packedColor;
          }
        }
      }
      // Point 7
      // 6th octant - lower-left quadrant
      if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) {
        const pixelPos = p7y * width + p7x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 8
      // 5th octant - lower-left quadrant
      if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) {
        const pixelPos = p8y * width + p8x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
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
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

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
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

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
             if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
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
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

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
             if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
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
}// Main CrispSwCanvas class
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
        
        this.tempClippingMask = new Uint8Array(Math.ceil(canvas.width * canvas.height / 8)).fill(0);
        
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
        this.currentState.transform.reset();
    }

    // Style setters
    set fillStyle(style) {
        this.currentState.fillColor = parseColor(style);
    }

    set strokeStyle(style) {
        this.currentState.strokeColor = parseColor(style);
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
        this.tempClippingMask.fill(0);
    }

    fill() {
        throw new Error("fill() is not supported - use fillRect() instead");
    }

    stroke() {
        throw new Error("stroke() is not supported - use strokeRect() instead");
    }
    
    strokeLine(x1, y1, x2, y2) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        
        // Transform points according to current transformation matrix
        const start = transformPoint(x1, y1, state.transform.elements);
        const end = transformPoint(x2, y2, state.transform.elements);
        
        this.lineRenderer.drawLine({
            start: { x: start.tx, y: start.ty },
            end: { x: end.tx, y: end.ty },
            thickness: scaledLineWidth,
            color: state.strokeColor
        });
    }

    clearRect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        this.rectRenderer.clearRect({
            center: { x: center.tx, y: center.ty },
            width: width,
            height: height,
            rotation: rotation
        });
    }

    // as the CrispSwCanvas does not support paths and fill() annd stroke() are not supported,
    // rect() is used for clipping only.
    rect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        this.rectRenderer.drawRect({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: true
        });
    }

    // The clip() function
    // * takes the clippingMask and ANDs it with the tempClippingMask
    // * clears the tempClippingMask to all zeroes
    clip() {
        // to a logical and of the current clippingMask and the tempClippingMask
        // a little bit of bitwise magic like this:
        // this.currentState.clippingMask = this.currentState.clippingMask && this.tempClippingMask;
        // but we need to do it for each byte
        for (let i = 0; i < this.currentState.clippingMask.length; i++) {
            this.currentState.clippingMask[i] = this.currentState.clippingMask[i] & this.tempClippingMask[i];
        }
        // clip() does not close the path, so since we might add more rects to the paths, we cannot clear the tempClippingMask
        // can't do this: this.tempClippingMask.fill(0);
    }


    fillRect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        this.rectRenderer.drawRect({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 },
            fillColor: state.fillColor
        });
    }

    strokeRect(x, y, width, height) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);

        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        this.rectRenderer.drawRect({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor,
            fillColor: { r: 0, g: 0, b: 0, a: 0 }
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
     * @param {number} fillR - Red component of fill color (0-255)
     * @param {number} fillG - Green component of fill color (0-255)
     * @param {number} fillB - Blue component of fill color (0-255)
     * @param {number} fillA - Alpha component of fill color (0-255)
     */
    fillCircle(centerX, centerY, radius, fillR, fillG, fillB, fillA) {
        const state = this.currentState;
        
        // Transform center point according to current transformation matrix
        const center = transformPoint(centerX, centerY, state.transform.elements);
        
        // Apply scale factor to radius
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        
        // Create shape object for the circle
        const circleShape = {
            center: { x: center.tx, y: center.ty },
            radius: scaledRadius,
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 }, // No stroke
            fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
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
     * @param {number} strokeR - Red component of stroke color (0-255)
     * @param {number} strokeG - Green component of stroke color (0-255)
     * @param {number} strokeB - Blue component of stroke color (0-255)
     * @param {number} strokeA - Alpha component of stroke color (0-255)
     */
    strokeCircle(centerX, centerY, radius, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
        const state = this.currentState;
        
        // Transform center point according to current transformation matrix
        const center = transformPoint(centerX, centerY, state.transform.elements);
        
        // Apply scale factor to radius and stroke width
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = getScaledLineWidth(state.transform.elements, strokeWidth);
        
        // Create shape object for the circle
        const circleShape = {
            center: { x: center.tx, y: center.ty },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
            fillColor: { r: 0, g: 0, b: 0, a: 0 } // No fill
        };
        
        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }
    
    /**
     * Fill and stroke a circle with specified colors and stroke width
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {number} fillR - Red component of fill color (0-255)
     * @param {number} fillG - Green component of fill color (0-255)
     * @param {number} fillB - Blue component of fill color (0-255)
     * @param {number} fillA - Alpha component of fill color (0-255)
     * @param {number} strokeWidth - Width of the stroke
     * @param {number} strokeR - Red component of stroke color (0-255)
     * @param {number} strokeG - Green component of stroke color (0-255)
     * @param {number} strokeB - Blue component of stroke color (0-255)
     * @param {number} strokeA - Alpha component of stroke color (0-255)
     */
    fillAndStrokeCircle(
        centerX, centerY, radius,
        fillR, fillG, fillB, fillA,
        strokeWidth,
        strokeR, strokeG, strokeB, strokeA
    ) {
        const state = this.currentState;
        
        // Transform center point according to current transformation matrix
        const center = transformPoint(centerX, centerY, state.transform.elements);
        
        // Apply scale factor to radius and stroke width
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = getScaledLineWidth(state.transform.elements, strokeWidth);
        
        // Create shape object for the circle
        const circleShape = {
            center: { x: center.tx, y: center.ty },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
            fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
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
        const centerTransformed = transformPoint(cx, cy, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        // This is a guess, SWRendererRoundedRect might not support clippingOnly directly
        // or might need a different shape structure for it.
        /*
        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
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
        const centerTransformed = transformPoint(cx, cy, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: state.fillColor, // Use state.fillColor directly
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 }
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
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = transformPoint(cx, cy, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: { r: 0, g: 0, b: 0, a: 0 },
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor // Use state.strokeColor directly
        });
    }

    // --- End Rounded Rectangle Methods ---

    // --- Arc Methods ---

    /**
     * Adds an arc to the current path (for potential clipping or future path system).
     * Angles are in radians.
     * NOTE: Currently, this method is a stub and does not build a persistent path for fill/stroke
     * due to limitations in the generic fill()/stroke() methods of CrispSwContext.
     * For drawing, use fillArc, strokeArc, or fillAndStrokeArc.
     */
    arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        // TODO: Implement path definition for clipping if SWRendererArc supports it,
        // or for a general path store if fill()/stroke() are enhanced.
        throw new Error("CrispSwContext.arc() for path definition/clipping is not yet implemented. Use fillArc/strokeArc for drawing.");
    }

    /**
     * Draws a filled arc (pie slice).
     * Angles are in radians.
     */
    fillArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const centerTransformed = transformPoint(x, y, state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        // For circles, we used Math.max(scaleX, scaleY). For arcs, average might be more appropriate
        // or individual scaling of x/y radii if ellipse arcs were supported. Sticking to simple scaling for now.
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY)); 

        // Convert radians to degrees for SWRendererArc and drawArcCanvas
        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;
        // TODO: Handle anticlockwise if SWRendererArc needs it (it might infer from angle order)

        this.arcRenderer.drawArc({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            // anticlockwise: anticlockwise, // If renderer supports it
            fillColor: state.fillColor, // Assumes globalAlpha is handled by pixelRenderer
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 }
        });
    }

    /**
     * Draws the stroke of an arc.
     * Angles are in radians.
     */
    strokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const centerTransformed = transformPoint(x, y, state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));
        
        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        this.arcRenderer.drawArc({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            // anticlockwise: anticlockwise, 
            fillColor: { r: 0, g: 0, b: 0, a: 0 },
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor // Assumes globalAlpha is handled by pixelRenderer
        });
    }
    
    /**
     * Draws a filled and stroked arc.
     * Angles are in radians.
     */
    fillAndStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const centerTransformed = transformPoint(x, y, state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        this.arcRenderer.drawArc({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            // anticlockwise: anticlockwise, 
            fillColor: state.fillColor,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    // --- End Arc Methods ---
}
/**
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

// Node.js exports - make the essential classes available to importing scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CrispSwCanvas,
    RenderChecks,
  };
}
