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
}