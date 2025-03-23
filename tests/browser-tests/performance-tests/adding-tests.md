# Adding New Performance Tests

This guide outlines how to add new performance tests to the testing framework. The process has been fully automated - you only need to implement your test functions and register them.

## Test Architecture

The performance testing framework uses a direct object reference approach, where each test is defined as 
an object with function references and metadata. This eliminates string-based indirection and provides
a more maintainable structure.

## Naming Convention

Tests now follow a standardized naming pattern that clearly indicates shape type, fill size, and stroke size:

### File Naming
Files should follow the pattern: `[shape]-[sizeFill]-fill-[sizeStroke]-stroke-test.js`

Examples:
- `lines-no-fill-L-stroke-test.js`
- `rectangles-M-fill-M-stroke-test.js`
- `circles-M-fill-M-stroke-test.js`

### Size Indicators
Size is indicated using these standardized labels:
- `no`: Not applicable (e.g., lines have no fill)
- `XS`: Extra small
- `S`: Small
- `M`: Medium
- `L`: Large
- `XL`: Extra large

### Function Naming
Functions should follow the pattern: `draw[Shape][SizeFill]Fill[SizeStroke]Stroke`

Examples:
- `drawLinesNoFillLStroke` (for software renderer)
- `drawLinesNoFillLStrokeHTML5` (for HTML5 Canvas)
- `drawRectanglesMFillMStroke`
- `drawCirclesMFillSStroke`

## Step 1: Create a Test File

Create a file following the naming pattern above:

Example for small circles with large stroke:
`circles-S-fill-L-stroke-test.js`

## Step 2: Implement Draw Functions

In your test file, implement both the software renderer and HTML5 Canvas renderer functions:

```javascript
// Circles with small fill and large stroke test functions
function drawCirclesSFillLStroke(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Implementation for software renderer
  }
}

function drawCirclesSFillLStrokeHTML5(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Implementation for HTML5 Canvas
  }
}
```

## Step 3: Register the Test in test-definitions.js

Add your test to the TESTS object in `test-definitions.js`:

```javascript
CIRCLES_S_FILL_L_STROKE: {
  id: 'circles-S-fill-L-stroke',
  swDrawFunction: drawCirclesSFillLStroke,
  html5DrawFunction: drawCirclesSFillLStrokeHTML5,
  displayName: 'Circles (S fill, L stroke)',
  description: 'Tests drawing circles with small fill and large stroke operations.'
}
```

The properties should include:
- `id`: A unique identifier for the test (used internally)
- `swDrawFunction`: Reference to the software renderer implementation
- `html5DrawFunction`: Reference to the HTML5 Canvas implementation
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
<script src="performance-tests/lines-no-fill-L-stroke-test.js"></script>
<script src="performance-tests/rectangles-M-fill-M-stroke-test.js"></script>
<script src="performance-tests/circles-M-fill-M-stroke-test.js"></script>
<script src="performance-tests/circles-S-fill-L-stroke-test.js"></script> <!-- Your new test -->

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
  - Use semi-transparent colors 
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
  - Use semi-transparent colors

- **Circles**:
  - Use radii based on the fill size indicator:
    - XS: 2-8px
    - S: 5-15px
    - M: 10-50px
    - L: 40-100px
    - XL: 80-200px
  - Use stroke widths based on the stroke size indicator (same as rectangles)
  - Use semi-transparent colors