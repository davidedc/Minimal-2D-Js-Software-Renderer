# Adding New Performance Tests

This guide outlines how to add new performance tests to the testing framework. The process has been fully automated - you only need to implement your test functions and register them.

## Test Architecture

The performance testing framework uses a direct object reference approach, where each test is defined as 
an object with function references and metadata. This eliminates string-based indirection and provides
a more maintainable structure.

## Step 1: Create a Test File

Create a file following the naming pattern: `[size]-[operation]-[shape]-test.js`

Examples:
- `long-stroked-lines-test.js`
- `medium-filled-stroked-rectangles-test.js`
- `medium-filled-stroked-circles-test.js`

## Step 2: Implement Draw Functions

In your test file, implement both the software renderer and HTML5 Canvas renderer functions:

```javascript
// [Test description] functions for performance testing
function draw[Size][Operation][Shape](ctx, count) {
  // Implementation for software renderer
}

function draw[Size][Operation][Shape]HTML5(ctx, count) {
  // Implementation for HTML5 Canvas
}
```

Example:
```javascript
// Small filled circles test functions for performance testing
function drawSmallFilledCircles(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Implementation using the software renderer
  }
}

function drawSmallFilledCirclesHTML5(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Implementation using the HTML5 Canvas
  }
}
```

## Step 3: Register the Test in test-definitions.js

Add your test to the TESTS object in `test-definitions.js`:

```javascript
SMALL_FILLED_CIRCLES: {
  id: 'small-filled-circles',
  swDrawFunction: drawSmallFilledCircles,
  html5DrawFunction: drawSmallFilledCirclesHTML5,
  displayName: 'Small filled circles',
  description: 'Tests drawing small circles with fill operations.'
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
<script src="performance-tests/long-stroked-lines-test.js"></script>
<script src="performance-tests/medium-filled-stroked-rectangles-test.js"></script>
<script src="performance-tests/medium-filled-stroked-circles-test.js"></script>
<script src="performance-tests/small-filled-circles-test.js"></script> <!-- Your new test -->

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
  - Use variable line widths (1-5px)
  - Use semi-transparent colors 
  - Generate random endpoints within canvas dimensions

- **Rectangles**:
  - Use appropriate sizes based on the test type (small/medium/large)
  - Include fill and/or stroke operations as specified in the test name
  - Use variable line widths for strokes (1-5px)
  - Use semi-transparent colors

- **Circles**:
  - Use appropriate radii based on the test type (small/medium/large)
  - Include fill and/or stroke operations as specified in the test name
  - Use variable line widths for strokes
  - Use semi-transparent colors

### Size Guidelines

- **Small**: Typically under 20px
- **Medium**: Typically 20-60px
- **Large**: Typically 60px or larger
- **Long**: For lines, typically spanning a significant portion of the canvas

### Operation Types

- **Stroked**: Uses stroke operations only
- **Filled**: Uses fill operations only
- **Filled & stroked**: Uses both fill and stroke operations