// Performance test definitions
// This file centralizes all test type definitions and their implementation references

// The TESTS object contains all available performance tests with their properties
const TESTS = {
  // Lines with large stroke
  LINES__M_SIZE__NO_FILL__L_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'lines--M-size--no-fill--L-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_lines__no_fill__L_opaque_stroke__random_pos__random_orient,
    displayName: 'Lines (M size, no fill, L opaque stroke, random pos, random orient)',
    description: 'Tests drawing medium-sized lines with large opaque strokes, random positioning and orientation.'
  },
  
  // Lines with 1px stroke - different orientations
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'lines--M-size--no-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_lines__no_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Lines (M size, no fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing medium-sized lines with 1px opaque strokes, random positioning and orientation.'
  },
  
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__HORIZONTAL_ORIENT: {
    id: 'lines--M-size--no-fill--1px-opaque-stroke--random-pos--horizontal-orient',
    drawFunction: draw_lines__no_fill__1px_opaque_stroke__random_pos__horizontal_orient,
    displayName: 'Lines (M size, no fill, 1px opaque stroke, random pos, horizontal orient)',
    description: 'Tests drawing medium-sized horizontal lines with 1px opaque strokes and random positioning.'
  },
  
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__VERTICAL_ORIENT: {
    id: 'lines--M-size--no-fill--1px-opaque-stroke--random-pos--vertical-orient',
    drawFunction: draw_lines__no_fill__1px_opaque_stroke__random_pos__vertical_orient,
    displayName: 'Lines (M size, no fill, 1px opaque stroke, random pos, vertical orient)',
    description: 'Tests drawing medium-sized vertical lines with 1px opaque strokes and random positioning.'
  },
  
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__SQUARE_ORIENT: {
    id: 'lines--M-size--no-fill--1px-opaque-stroke--random-pos--square-orient',
    drawFunction: draw_lines__no_fill__1px_opaque_stroke__random_pos__square_orient,
    displayName: 'Lines (M size, no fill, 1px opaque stroke, random pos, square orient)',
    description: 'Tests drawing medium-sized horizontal and vertical lines (square patterns) with 1px opaque strokes and random positioning.'
  },
  
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__45DEG_ORIENT: {
    id: 'lines--M-size--no-fill--1px-opaque-stroke--random-pos--45deg-orient',
    drawFunction: draw_lines__no_fill__1px_opaque_stroke__random_pos__45deg_orient,
    displayName: 'Lines (M size, no fill, 1px opaque stroke, random pos, 45deg orient)',
    description: 'Tests drawing medium-sized diagonal lines at 45-degree angles with 1px opaque strokes and random positioning.'
  },
  
  // Rectangles
  RECTANGLES__M_SIZE__OPAQUE_FILL__M_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'rectangles--M-size--opaque-fill--M-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_rectangles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient,
    displayName: 'Rectangles (M size, opaque fill, M opaque stroke, random pos, random orient)',
    description: 'Tests drawing medium-sized rectangles with opaque fill and medium opaque stroke, random positioning and orientation.'
  },
  
  // Circles
  CIRCLES__M_SIZE__OPAQUE_FILL__M_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--M-size--opaque-fill--M-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (M size, opaque fill, M opaque stroke, random pos, random orient)',
    description: 'Tests drawing medium-sized circles with opaque fill and medium opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__XL_SIZE__OPAQUE_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--XL-size--opaque-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__XL_opaque_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (XL size, opaque fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing extra large-sized circles with opaque fill and 1px opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__XL_SIZE__OPAQUE_FILL__XL_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--XL-size--opaque-fill--XL-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__XL_opaque_fill__XL_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (XL size, opaque fill, XL opaque stroke, random pos, random orient)',
    description: 'Tests drawing extra large-sized circles with opaque fill and extra large opaque stroke, random positioning and orientation.'
  },
  
  // Circles with no fill - size variations
  CIRCLES__XS_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--XS-size--no-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__XS_size__no_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (XS size, no fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing extra small-sized circles with no fill and 1px opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__XS_SIZE__NO_FILL__1PX_SEMI_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--XS-size--no-fill--1px-semi-stroke--random-pos--random-orient',
    drawFunction: draw_circles__XS_size__no_fill__1px_semi_stroke__random_pos__random_orient,
    displayName: 'Circles (XS size, no fill, 1px semi-transparent stroke, random pos, random orient)',
    description: 'Tests drawing extra small-sized circles with no fill and 1px semi-transparent stroke, random positioning and orientation.'
  },
  
  CIRCLES__S_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--S-size--no-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__S_size__no_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (S size, no fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing small-sized circles with no fill and 1px opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__S_SIZE__NO_FILL__1PX_SEMI_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--S-size--no-fill--1px-semi-stroke--random-pos--random-orient',
    drawFunction: draw_circles__S_size__no_fill__1px_semi_stroke__random_pos__random_orient,
    displayName: 'Circles (S size, no fill, 1px semi-transparent stroke, random pos, random orient)',
    description: 'Tests drawing small-sized circles with no fill and 1px semi-transparent stroke, random positioning and orientation.'
  },
  
  CIRCLES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--M-size--no-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__M_size__no_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (M size, no fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing medium-sized circles with no fill and 1px opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__M_SIZE__NO_FILL__1PX_SEMI_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--M-size--no-fill--1px-semi-stroke--random-pos--random-orient',
    drawFunction: draw_circles__M_size__no_fill__1px_semi_stroke__random_pos__random_orient,
    displayName: 'Circles (M size, no fill, 1px semi-transparent stroke, random pos, random orient)',
    description: 'Tests drawing medium-sized circles with no fill and 1px semi-transparent stroke, random positioning and orientation.'
  },
  
  CIRCLES__L_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--L-size--no-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__L_size__no_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (L size, no fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing large-sized circles with no fill and 1px opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__L_SIZE__NO_FILL__1PX_SEMI_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--L-size--no-fill--1px-semi-stroke--random-pos--random-orient',
    drawFunction: draw_circles__L_size__no_fill__1px_semi_stroke__random_pos__random_orient,
    displayName: 'Circles (L size, no fill, 1px semi-transparent stroke, random pos, random orient)',
    description: 'Tests drawing large-sized circles with no fill and 1px semi-transparent stroke, random positioning and orientation.'
  },
  
  CIRCLES__XL_SIZE__NO_FILL__1PX_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--XL-size--no-fill--1px-opaque-stroke--random-pos--random-orient',
    drawFunction: draw_circles__XL_size__no_fill__1px_opaque_stroke__random_pos__random_orient,
    displayName: 'Circles (XL size, no fill, 1px opaque stroke, random pos, random orient)',
    description: 'Tests drawing extra large-sized circles with no fill and 1px opaque stroke, random positioning and orientation.'
  },
  
  CIRCLES__XL_SIZE__NO_FILL__1PX_SEMI_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'circles--XL-size--no-fill--1px-semi-stroke--random-pos--random-orient',
    drawFunction: draw_circles__XL_size__no_fill__1px_semi_stroke__random_pos__random_orient,
    displayName: 'Circles (XL size, no fill, 1px semi-transparent stroke, random pos, random orient)',
    description: 'Tests drawing extra large-sized circles with no fill and 1px semi-transparent stroke, random positioning and orientation.'
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