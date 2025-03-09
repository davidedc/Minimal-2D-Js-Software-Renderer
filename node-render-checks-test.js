/**
 * Test script for verifying that RenderChecks works with CrispSwContext in Node.js
 * 
 * This script:
 * 1. Creates a CrispSwContext
 * 2. Draws some simple shapes
 * 3. Uses RenderChecks to analyze the rendering
 * 
 * To run:
 * node node-render-checks-test.js
 */

// Require the bundled libraries
const { CrispSwCanvas, RenderChecks } = require('./build/crisp-sw-canvas-node-v1.0.2.js');

// Create a mock comparison object for RenderChecks
const mockComparison = {
  showError: (message) => {
    console.error('RENDER ERROR:', message);
  }
};

// Create a canvas and context
class MockCanvas {
  constructor(width, height, title) {
    this.width = width;
    this.height = height;
    this.title = title || 'Test Canvas';
  }
}

// Create a canvas for testing
const canvasWidth = 100;
const canvasHeight = 100;
const mockCanvas = new MockCanvas(canvasWidth, canvasHeight, 'Test Canvas');
const swCanvas = new CrispSwCanvas(mockCanvas);
const ctx = swCanvas.getContext('2d');

// Draw a simple scene
// Red square in the middle
ctx.fillStyle = '#ff0000';
ctx.fillRect(25, 25, 50, 50);

// Blue border
ctx.strokeStyle = '#0000ff';
ctx.lineWidth = 2;
ctx.strokeRect(25, 25, 50, 50);

// Create RenderChecks instance and test it
const renderChecks = new RenderChecks(mockComparison);

// Test unique colors in middle row
console.log('\nTesting unique colors in middle row:');
const uniqueColorsInRow = renderChecks.checkCountOfUniqueColorsInMiddleRow(ctx, null);
console.log(`Found ${uniqueColorsInRow} unique colors in middle row`);

// Test unique colors in middle column
console.log('\nTesting unique colors in middle column:');
const uniqueColorsInColumn = renderChecks.checkCountOfUniqueColorsInMiddleColumn(ctx, null);
console.log(`Found ${uniqueColorsInColumn} unique colors in middle column`);

// Test extremes
console.log('\nTesting image extremes:');
const extremes = renderChecks.findExtremesWithTolerance(ctx);
console.log('Image extremes:', extremes);

// Test for speckles
console.log('\nTesting for speckles:');
const speckleCount = renderChecks.checkForSpeckles(ctx);
console.log(`Found ${speckleCount} speckles`);

// Test total unique colors
console.log('\nTesting total unique colors in image:');
const totalUniqueColors = renderChecks.checkCountOfUniqueColorsInImage(ctx);
console.log(`Found ${totalUniqueColors} unique colors in entire image`);

console.log('\nAll tests complete!');