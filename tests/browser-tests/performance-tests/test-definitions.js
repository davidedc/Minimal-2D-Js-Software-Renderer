// Performance test definitions
// This file centralizes all test type definitions and their implementation references

// The TESTS object contains all available performance tests with their properties
const TESTS = {
  LINES__NO_FILL__L_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'lines--no-fill--L-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_lines__no_fill__L_opaque_stroke__random_pos__random_orient,
    displayName: 'Lines (no fill, L opaque stroke, random pos, random orient)',
    description: 'Tests drawing lines with large opaque strokes, random positioning and orientation.'
  },
  
  RECTANGLES__M_OPAQUE_FILL__M_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'rectangles--M-opaque-fill--M-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_rectangles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient,
    displayName: 'Rectangles (M opaque fill, M opaque stroke, random pos, random orient)',
    description: 'Tests drawing rectangles with medium opaque fill and medium opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__M_OPAQUE_FILL__M_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--M-opaque-fill--M-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (M opaque fill, M opaque stroke, random pos, random orient)',
    description: 'Tests drawing circles with medium opaque fill and medium opaque stroke, random positioning and orientation.'
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