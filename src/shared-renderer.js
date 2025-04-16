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
const drawShapesImplFn = function(shapes, isCanvas, ctx = null, frameBufferUint8ClampedView) {
  const pixelRenderer = new SWRendererPixel(frameBufferUint8ClampedView, renderTestWidth, renderTestHeight);
  const swLineRenderer = new SWRendererLine(pixelRenderer);
  const swRectRenderer = new SWRendererRect(frameBufferUint8ClampedView, renderTestWidth, renderTestHeight, swLineRenderer, pixelRenderer);
  const swRoundedRectRenderer = new SWRendererRoundedRect(frameBufferUint8ClampedView, renderTestWidth, renderTestHeight, swLineRenderer, pixelRenderer, swRectRenderer);
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

// Define colorToString for Node environment if it's missing
if (typeof colorToString !== 'function') {
  function colorToString(r, g, b, a) {
    if (a === 255 || a === undefined) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    }
  }
}

// Assign the function to the global name expected by the codebase
const drawShapesImpl = drawShapesImplFn;

// Handle different module systems
// In browser, make sure functions are explicitly added to window
// In Node.js, export the functions
if (isNodeEnv && typeof module !== 'undefined' && module.exports) {
  // Node.js - use module.exports
  module.exports = {
    drawShapesImpl: drawShapesImplFn,  // Export the function with the expected name
    colorToString
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
  
  // Only add colorToString if it's not already defined
  if (typeof window.colorToString === 'undefined') {
    window.colorToString = colorToString;
  }
}