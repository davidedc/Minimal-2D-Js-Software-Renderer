// Performance test definitions
// This file centralizes all test type definitions and their implementation references

// The TESTS object contains all available performance tests with their properties
const TESTS = {
  LINES__NO_FILL__L_OPAQUE_STROKE: {
    id: 'lines--no-fill--L-opaque-stroke',
    drawFunction: draw_lines__no_fill__L_opaque_stroke,
    displayName: 'Lines (no fill, L opaque stroke)',
    description: 'Tests drawing lines with large opaque strokes across the canvas.'
  },
  
  RECTANGLES__M_OPAQUE_FILL__M_OPAQUE_STROKE: {
    id: 'rectangles--M-opaque-fill--M-opaque-stroke',
    drawFunction: draw_rectangles__M_opaque_fill__M_opaque_stroke,
    displayName: 'Rectangles (M opaque fill, M opaque stroke)',
    description: 'Tests drawing rectangles with medium opaque fill and medium opaque stroke operations.'
  },
  
  CIRCLES__M_OPAQUE_FILL__M_OPAQUE_STROKE: {
    id: 'circles--M-opaque-fill--M-opaque-stroke',
    drawFunction: draw_circles__M_opaque_fill__M_opaque_stroke,
    displayName: 'Circles (M opaque fill, M opaque stroke)',
    description: 'Tests drawing circles with medium opaque fill and medium opaque stroke operations.'
  }
};

// TestRunner provides a unified API for working with tests
const TestRunner = {
  // Get all available tests
  getAll: function() {
    return Object.values(TESTS);
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