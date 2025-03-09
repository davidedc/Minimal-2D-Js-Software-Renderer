/**
 * Example Node.js script for using CrispSwCanvas in a command-line environment
 * 
 * This script demonstrates how to:
 * 1. Create a CrispSwCanvas instance in Node.js
 * 2. Use it to render graphics
 * 3. Access pixel data through getImageData()
 * 4. Save the result as a BMP file without any external dependencies
 * 
 * To run:
 * 1. First build the Node.js bundle: ./build-node.sh
 * 2. Then run: node node-canvas-example.js
 */

// Require the bundled CrispSwCanvas library
const { CrispSwCanvas } = require('./build/crisp-sw-canvas-node-v1.0.2.js');
const fs = require('fs');

// Create a mock canvas object since we're not in a browser
class MockCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.title = "Node.js Canvas";
  }
}

// Create a canvas instance
const canvasWidth = 200;
const canvasHeight = 200;
const mockCanvas = new MockCanvas(canvasWidth, canvasHeight);
const swCanvas = new CrispSwCanvas(mockCanvas);

// Get the context for drawing
const ctx = swCanvas.getContext('2d');

// Draw something
ctx.fillStyle = '#ff0000';
ctx.fillRect(50, 50, 100, 100);

ctx.strokeStyle = '#0000ff';
ctx.lineWidth = 5;
ctx.strokeRect(75, 75, 50, 50);

// Get the image data to verify what was drawn
const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

// Analyze the image data
function countNonTransparentPixels(imageData) {
  let count = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] > 0) { // If alpha > 0
      count++;
    }
  }
  return count;
}

console.log(`Canvas size: ${canvasWidth}x${canvasHeight}`);
console.log(`Non-transparent pixels: ${countNonTransparentPixels(imageData)}`);

// Save as BMP file (no external dependencies needed)
function saveBMP(imageData, filename) {
  const { width, height, data } = imageData;
  const fileSize = 54 + 3 * width * height;
  const buffer = Buffer.alloc(fileSize);
  
  // BMP File Header (14 bytes)
  buffer.write('BM', 0);                         // Signature
  buffer.writeUInt32LE(fileSize, 2);             // File size
  buffer.writeUInt32LE(0, 6);                    // Reserved
  buffer.writeUInt32LE(54, 10);                  // Offset to pixel data
  
  // DIB Header (40 bytes)
  buffer.writeUInt32LE(40, 14);                  // DIB header size
  buffer.writeInt32LE(width, 18);                // Width
  buffer.writeInt32LE(-height, 22);              // Height (negative for top-down)
  buffer.writeUInt16LE(1, 26);                   // Color planes
  buffer.writeUInt16LE(24, 28);                  // Bits per pixel (24 - no alpha)
  buffer.writeUInt32LE(0, 30);                   // No compression
  buffer.writeUInt32LE(width * height * 3, 34);  // Image size
  buffer.writeInt32LE(2835, 38);                 // X pixels per meter (~72 DPI)
  buffer.writeInt32LE(2835, 42);                 // Y pixels per meter
  buffer.writeUInt32LE(0, 46);                   // Colors in palette
  buffer.writeUInt32LE(0, 50);                   // Important colors
  
  // Pixel data (24 bits per pixel, BGR format)
  let offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4; // RGBA index
      
      // BMP uses BGR format without alpha
      buffer[offset++] = data[i + 2];  // Blue
      buffer[offset++] = data[i + 1];  // Green
      buffer[offset++] = data[i];      // Red
      
      // No alpha in BMP
    }
    
    // BMP rows must be aligned to 4-byte boundaries
    const padding = (width * 3) % 4;
    if (padding !== 0) {
      offset += 4 - padding;
    }
  }
  
  // Write the file
  fs.writeFileSync(filename, buffer);
  console.log(`Saved output to ${filename}`);
}

// Save the image data as a BMP file
saveBMP(imageData, 'node-canvas-output.bmp');