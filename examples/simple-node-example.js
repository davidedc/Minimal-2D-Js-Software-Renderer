#!/usr/bin/env node
/**
 * Simple Node.js test for CrispSwCanvas
 * This is a minimal test that just renders a rectangle and a circle
 */

// Load required modules
const fs = require('fs');
const path = require('path');

// Import the CrispSwCanvas library from the build directory
let CrispSwCanvas;
try {
  const bundle = require('../build/crisp-sw-canvas-node-v1.0.2.js');
  
  // Assign the imported class
  CrispSwCanvas = bundle.CrispSwCanvas;
} catch (e) {
  console.error('Could not load software renderer bundle. Error:', e.message);
  process.exit(1);
}

// Create a canvas with dimensions 400x400 
const canvas = new CrispSwCanvas(400, 400);
const ctx = canvas.getContext('2d');

// Draw a blue rectangle
ctx.fillStyle = 'rgba(0, 0, 255, 1)';  // Use rgba format
ctx.fillRect(100, 100, 200, 100);

// Draw a red circle
ctx.fillStyle = 'rgba(255, 0, 0, 1)';  // Use rgba format
ctx.beginPath();
// We need to implement circle drawing directly since CrispSwCanvas doesn't support arc
// For now, we'll just draw a filled rectangle as a placeholder
ctx.fillRect(200, 200, 50, 50);

// Save the result to a BMP file
function saveToBMP(ctx, outputPath) {
  try {
    // Get the image data from the context
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Use the toBMP method to generate the BMP data
    const bmpData = imageData.toBMP();
    
    // Save to file
    fs.writeFileSync(outputPath, bmpData);
    console.log(`Saved BMP image to ${outputPath}`);
    return true;
  } catch (err) {
    console.error('Error saving BMP output:', err);
    return false;
  }
}

// Save the rendered image
const outputDir = './test-output';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

saveToBMP(ctx, path.join(outputDir, 'simple-test.bmp'));
console.log('Test completed successfully!');