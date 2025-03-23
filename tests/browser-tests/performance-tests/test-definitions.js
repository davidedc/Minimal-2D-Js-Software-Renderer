// Performance test definitions
// This file centralizes all test type definitions and their implementation references

// The TESTS object contains all available performance tests with their properties
const TESTS = {
  LONG_STROKED_LINES: {
    id: 'long-stroked-lines',
    swDrawFunction: drawLongStrokedLines,
    html5DrawFunction: drawLongStrokedLinesHTML5,
    displayName: 'Long stroked lines',
    description: 'Tests drawing long lines with variable stroke widths across the canvas.'
  },
  
  MEDIUM_FILLED_STROKED_RECTANGLES: {
    id: 'medium-filled-stroked-rectangles',
    swDrawFunction: drawMediumFilledStrokedRectangles,
    html5DrawFunction: drawMediumFilledStrokedRectanglesHTML5,
    displayName: 'Medium filled & stroked rectangles',
    description: 'Tests drawing medium-sized rectangles with both fill and stroke operations.'
  },
  
  MEDIUM_FILLED_STROKED_CIRCLES: {
    id: 'medium-filled-stroked-circles',
    swDrawFunction: drawMediumFilledStrokedCircles,
    html5DrawFunction: drawMediumFilledStrokedCirclesHTML5,
    displayName: 'Medium filled & stroked circles',
    description: 'Tests drawing medium-sized circles with both fill and stroke operations.'
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