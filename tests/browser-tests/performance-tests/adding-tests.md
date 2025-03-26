# Adding New Performance Tests

This guide outlines how to add new performance tests to the testing framework. The process has been fully automated - you only need to implement your test functions and register them.

## Test Architecture

The performance testing framework uses a direct object reference approach, where each test is defined as 
an object with function references and metadata. This eliminates string-based indirection and provides
a more maintainable structure.

## Naming Convention

Tests follow a standardized naming pattern that clearly indicates shape type, fill properties (size and opacity), stroke properties (size and opacity), positioning, and orientation:

### File Naming
Files should follow the pattern: `[shape]--[sizeFill]-[opacityFill]-fill--[sizeStroke]-[opacityStroke]-stroke--[positioning]-pos--[orientation]-orient--test.js`

Major sections are separated by double dashes (`--`), while components within sections use single dashes (`-`).

Examples:
- `circles--M-opaque-fill--L-opaque-stroke--random-pos--random-orient--test.js` (medium opaque fill, large opaque stroke, random positioning and orientation)
- `circles--M-semi-fill--L-opaque-stroke--crisp-pos--horizontal-orient--test.js` (medium semi-transparent fill, large opaque stroke, crisp positioning, horizontal orientation)
- `circles--no-fill--L-opaque-stroke--random-pos--45deg-orient--test.js` (no fill, large opaque stroke, random positioning, 45-degree orientation)
- `rectangles--M-opaque-fill--M-semi-stroke--crisp-pos--vertical-orient--test.js` (medium opaque fill, medium semi-transparent stroke, crisp positioning, vertical orientation)
- `lines--no-fill--L-opaque-stroke--random-pos--square-orient--test.js` (lines with large opaque stroke, no fill, random positioning, square orientation)
- `lines--no-fill--1px-opaque-stroke--crisp-pos--horizontal-orient--test.js` (lines with exactly 1-pixel opaque stroke, crisp positioning, horizontal orientation)

### Size Indicators
Size is indicated using these standardized labels:
- `no`: Not applicable or no fill/stroke
- `XS`: Extra small
- `S`: Small
- `M`: Medium
- `L`: Large
- `XL`: Extra large
- `npx`: Explicit pixel size (e.g., `1px`, `2px`, `3px`, etc.) for stroke sizes

### Opacity Indicators
Opacity is indicated using these standardized labels:
- `opaque`: Fully opaque (alpha = 1.0)
- `semi`: Semi-transparent (alpha < 1.0)

### Positioning Indicators
Positioning is indicated using these standardized labels:
- `random`: Random positioning (geometry expressed in any float values)
- `crisp`: Crisp positioning (geometry aligned to the pixel grid for sharp edges)

### Orientation Indicators
Orientation is indicated using these standardized labels:
- `random`: Random orientation
- `horizontal`: Horizontal orientation
- `vertical`: Vertical orientation
- `square`: Square orientation (either horizontal or vertical)
- `45deg`: 45-degree orientation

### Function Naming
Functions should follow the pattern: `draw_[shape]__[sizeFill]_[opacityFill]_fill__[sizeStroke]_[opacityStroke]_stroke__[positioning]_pos__[orientation]_orient`

Function names use underscores, with double underscores matching the double dashes in file names.

Examples:
- `draw_circles__M_opaque_fill__L_opaque_stroke__random_pos__random_orient`
- `draw_circles__no_fill__L_opaque_stroke__crisp_pos__horizontal_orient`
- `draw_rectangles__M_opaque_fill__M_semi_stroke__random_pos__vertical_orient`
- `draw_lines__no_fill__L_opaque_stroke__crisp_pos__45deg_orient`
- `draw_lines__no_fill__1px_opaque_stroke__crisp_pos__horizontal_orient`

## Step 1: Create a Test File

Create a file following the naming pattern above:

Example for small circles with semi-transparent fill and large opaque stroke, crisp positioning and horizontal orientation:
`circles--S-semi-fill--L-opaque-stroke--crisp-pos--horizontal-orient--test.js`

## Step 2: Implement Draw Function

Like so:

```javascript
// Circles with small semi-transparent fill and large opaque stroke, crisp positioning and horizontal orientation
function draw_circles__S_semi_fill__L_opaque_stroke__crisp_pos__horizontal_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Implementation with crisp positioning and horizontal orientation
  }
}

```

## Step 3: Register the Test in test-definitions.js

Add your test to the TESTS object in `test-definitions.js`:

```javascript
CIRCLES__S_SEMI_FILL__L_OPAQUE_STROKE__CRISP_POS__HORIZONTAL_ORIENT: {
  id: 'circles--S-semi-fill--L-opaque-stroke--crisp-pos--horizontal-orient',
  drawFunction: draw_circles__S_semi_fill__L_opaque_stroke__crisp_pos__horizontal_orient,
  displayName: 'Circles (S semi fill, L opaque stroke, crisp pos, horizontal orient)',
  description: 'Tests drawing circles with small semi-transparent fill, large opaque stroke, crisp positioning and horizontal orientation.'
}
```

The properties should include:
- `id`: A unique identifier for the test (matching the file name without the -test.js suffix)
- `drawFunction`: Reference to the implementation
- `displayName`: Human-readable name that appears on the button
- `description`: Longer description of what the test evaluates

That's it! The framework will automatically:
- Include your test in the test collection
- Generate a button for your test in the UI
- Add event listeners for the button
- Run your test when the button is clicked or when "All Tests" is selected

## Step 4: Update Script References

Ensure your test file is included in the HTML, **before** the test-definitions.js file:

```html
<!-- Load test implementation files first -->
<script src="performance-tests/lines--no-fill--L-opaque-stroke--random-pos--random-orient--test.js"></script>
<script src="performance-tests/rectangles--M-opaque-fill--M-opaque-stroke--random-pos--random-orient--test.js"></script>
<script src="performance-tests/circles--M-opaque-fill--M-opaque-stroke--random-pos--random-orient--test.js"></script>
<script src="performance-tests/circles--S-semi-fill--L-opaque-stroke--crisp-pos--horizontal-orient--test.js"></script> <!-- Your new test -->

<!-- Then load the test definitions that reference those implementations -->
<script src="performance-tests/test-definitions.js"></script>
<script src="performance-tests/performance-ui.js"></script>
```

The correct loading order is critical:
1. All test implementation files must be loaded first
2. Then the test-definitions.js file, which references the implementations
3. Finally the UI code that uses the test definitions

## Code Guidelines for Different Test Types

### Standardized Parameters

When implementing drawing functions, follow these guidelines for consistent results:

- **Lines**: 
  - Use variable line widths based on the stroke size indicator
  - Use opacity based on the stroke opacity indicator
  - Generate random endpoints within canvas dimensions

- **Rectangles**:
  - Use sizes based on the fill size indicator: 
    - XS: 5-15px
    - S: 10-30px
    - M: 20-120px
    - L: 100-300px
    - XL: 200-500px
  - Use stroke widths based on the stroke size indicator:
    - XS: 1px
    - S: 1-2px
    - M: 2-5px
    - L: 5-10px
    - XL: 10-20px
  - Use opacity based on the fill and stroke opacity indicators:
    - opaque: alpha = 1.0
    - semi: alpha = 0.2-0.8 (randomly chosen)

- **Circles**:
  - Use radii based on the fill size indicator:
    - XS: 2-8px
    - S: 5-15px
    - M: 10-50px
    - L: 40-100px
    - XL: 80-200px
  - Use stroke widths based on the stroke size indicator (same as rectangles)
  - Use opacity based on the fill and stroke opacity indicators (same as rectangles)