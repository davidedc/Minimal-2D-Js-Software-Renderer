// This file is responsible for calling all the test definition functions
// that configure and register the individual high-level tests.

/**
 * Loads and initializes all high-level tests by calling their respective
 * definition functions (from high-level-tests-definitions.js).
 */
function loadCrispnessTests() {
  console.log('Loading High-Level Tests...');

  // Call definition functions for each test.
  // Ensure the corresponding definition file (high-level-tests-definitions.js)
  // and drawing file (high-level-tests-drawing.js) are loaded before this script.

  define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient();

  // --- ADD CALLS FOR OTHER TEST DEFINITIONS HERE --- 
  // e.g., define_rectangles_...();
  // e.g., define_circles_...();

  console.log('High-Level Tests loading complete.');
}

// // Optional: Automatically load tests when the script is parsed.
// // This might be useful depending on how the HTML page includes scripts.
// document.addEventListener('DOMContentLoaded', () => {
//   loadCrispnessTests();
//   // Any post-load actions, like creating navigation, would go here.
// }); 