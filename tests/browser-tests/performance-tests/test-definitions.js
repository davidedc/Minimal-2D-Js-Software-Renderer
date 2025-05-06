// Performance test definitions
// This file centralizes all test type definitions and their implementation references

// The TESTS object contains all available performance tests with their properties
const TESTS = {
  // High-Level Line Tests
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__CRISP_PIXEL_POS__HORIZONTAL_ORIENT: {
    id: 'lines--M-size--no-fill--1px_opaque_stroke--crisp_pixel_pos--horizontal-orient',
    drawFunction: draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient,
    displayName: 'HL Lines (M, 1px opaque, crisp horizontal)',
    description: 'High-level test: Medium lines, 1px opaque stroke, crisp pixel horizontal orientation.'
  },
  LINES__M_SIZE__NO_FILL__1PX_OPAQUE_STROKE__CRISP_PIXEL_POS__VERTICAL_ORIENT: {
    id: 'lines--M-size--no-fill--1px_opaque_stroke--crisp_pixel_pos--vertical_orient',
    drawFunction: draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient,
    displayName: 'HL Lines (M, 1px opaque, crisp vertical)',
    description: 'High-level test: Medium lines, 1px opaque stroke, crisp pixel vertical orientation.'
  },
  LINES__M_SIZE__NO_FILL__2PX_OPAQUE_STROKE__CENTERED_AT_GRID__HORIZONTAL_ORIENT: {
    id: 'lines--M-size--no-fill--2px-opaque-stroke--centered-at-grid--horizontal-orient',
    drawFunction: draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient,
    displayName: 'HL Lines (M, 2px opaque, grid centered horizontal)',
    description: 'High-level test: Medium lines, 2px opaque stroke, centered at grid, horizontal orientation.'
  },
  LINES__M_SIZE__NO_FILL__2PX_OPAQUE_STROKE__CENTERED_AT_GRID__VERTICAL_ORIENT: {
    id: 'lines--M-size--no-fill--2px-opaque-stroke--centered-at-grid--vertical-orient',
    drawFunction: draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient,
    displayName: 'HL Lines (M, 2px opaque, grid centered vertical)',
    description: 'High-level test: Medium lines, 2px opaque stroke, centered at grid, vertical orientation.'
  },
  LINES__MULTI_20__NO_FILL__1PX_BLACK_OPAQUE_STROKE__RANDOM_POS__RANDOM_ORIENT: {
    id: 'lines--multi_20--no-fill--1px_black_opaque_stroke__random_pos--random_orient',
    drawFunction: draw_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient,
    displayName: 'HL Lines (Multi-20, 1px black opaque, random)',
    description: 'High-level test: Multi-20 lines, 1px black opaque stroke, random position and orientation.'
  },
  // Add other high-level tests here if available for rectangles or circles
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