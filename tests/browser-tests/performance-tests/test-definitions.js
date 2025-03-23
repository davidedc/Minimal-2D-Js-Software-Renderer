// Performance test definitions
// This file centralizes all test type definitions and their implementation references

// The TESTS object contains all available performance tests with their properties
const TESTS = {
  LINES_NO_FILL_L_STROKE: {
    id: 'lines-no-fill-L-stroke',
    swDrawFunction: drawLinesNoFillLStroke,
    html5DrawFunction: drawLinesNoFillLStrokeHTML5,
    displayName: 'Lines (no fill, L stroke)',
    description: 'Tests drawing lines with large strokes across the canvas.'
  },
  
  RECTANGLES_M_FILL_M_STROKE: {
    id: 'rectangles-M-fill-M-stroke',
    swDrawFunction: drawRectanglesMFillMStroke,
    html5DrawFunction: drawRectanglesMFillMStrokeHTML5,
    displayName: 'Rectangles (M fill, M stroke)',
    description: 'Tests drawing rectangles with medium fill and medium stroke operations.'
  },
  
  CIRCLES_M_FILL_M_STROKE: {
    id: 'circles-M-fill-M-stroke',
    swDrawFunction: drawCirclesMFillMStroke,
    html5DrawFunction: drawCirclesMFillMStrokeHTML5,
    displayName: 'Circles (M fill, M stroke)',
    description: 'Tests drawing circles with medium fill and medium stroke operations.'
  }
};

// TestRunner provides a unified API for working with tests
const TestRunner = {
  // Get all available tests
  getAll: function() {
    return Object.values(TESTS);
  },
  
  // Draw with software renderer
  drawWithSoftwareRenderer: function(test, ctx, count) {
    test.swDrawFunction(ctx, count);
  },
  
  // Draw with HTML5 Canvas
  drawWithHtml5Canvas: function(test, ctx, count) {
    test.html5DrawFunction(ctx, count);
  },
  
  // Get test's display name
  getDisplayName: function(test) {
    return test.displayName;
  },
  
  // Get all tests as array - automatically derived from TESTS object
  getAllAsArray: function() {
    return Object.values(TESTS);
  }
};