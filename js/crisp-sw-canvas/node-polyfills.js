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