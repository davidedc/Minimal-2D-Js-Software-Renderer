# Adding High-Level Tests to the Performance Suite

This guide outlines how to make test files from the `tests/browser-tests/test-cases/` directory usable within the Performance Test suite (`performance-tests.html`). The performance suite now uses a self-registration mechanism, where each test script declares itself to the performance testing environment.

## Overview of the New System

The performance testing framework (`performance-tests.html`) no longer uses a central `test-definitions.js` file. Instead:

1.  `performance-tests.html` initializes a global array: `window.PERFORMANCE_TESTS_REGISTRY = [];`.
2.  It then loads selected test scripts from the `tests/browser-tests/test-cases/` directory.
3.  Each of these loaded test scripts is responsible for checking if `window.PERFORMANCE_TESTS_REGISTRY` exists.
4.  If it does, the script pushes an object containing its performance test metadata into this registry.
5.  The `performance-ui.js` script then reads from this registry to dynamically build the test list in the UI.

## How to Make a High-Level Test Usable for Performance Testing

To include a test from `tests/browser-tests/test-cases/` (e.g., `my-cool-test.js`) in the performance suite, you need to ensure it performs self-registration.

**Step 1: Ensure your High-Level Test's Drawing Function Signature**

The performance testing framework expects the drawing function `drawTest` within your high-level test file to accept three arguments:

1.  `ctx`: The rendering context (either `CanvasRenderingContext2D` or `CrispSwContext`).
2.  `currentIterationNumber`: For the performance test's ramp-up logic, this argument is not critically used by the high-level drawing functions themselves when they are in "multi-instance" mode. The performance framework will typically pass `0` or a similar constant value for this.
3.  `instances`: This is the crucial parameter for performance testing. It corresponds to the `currentShapeCount` in the performance ramp-up logic. Your drawing function should be structured to draw this many instances of its shape(s) when this parameter is a positive number. Many existing high-level tests already support an `instances` parameter for drawing multiple items.

**Step 2: Add the Self-Registration Block to Your Test Script**

At the end of your `test-cases/your-test-file-name.js`, add the following JavaScript block. This block should be *after* your main drawing function `drawTest` has been defined.

```javascript
// ... (your existing drawTest function and other test logic) ...

// First register the test for high-level testing
registerHighLevelTest(
    'your-test-name--test',
    drawTest,
    'lines', // or appropriate category
    {
        // test configuration
    },
    {
        title: 'Your Test Title',
        description: 'Your test description',
        displayName: 'Perf: Your Test Display Name'
    }
);

// --- Performance Test Self-Registration Block ---
// Check if the performance test registry exists (i.e., loaded by performance-tests.html)
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof drawTest === 'function') {

    window.PERFORMANCE_TESTS_REGISTRY.push({
        // id: Typically derived from the filename, ensuring uniqueness.
        id: 'your-test-name--test', 

        // drawFunction: A direct reference to the uniform drawTest function.
        drawFunction: drawTest,

        // displayName: A concise, human-readable name for the UI button in the performance tests.
        displayName: 'Perf: Your Test Display Name', 

        // description: A brief description for the performance test context.
        description: 'Performance: Brief description of your test.',

        // category: Helps group tests in the UI. Use 'lines', 'rectangles', 'circles', or a new category.
        category: 'lines' // Or 'rectangles', 'circles', etc.
    });
}
// --- End of Performance Test Self-Registration Block ---
```

**Key fields for the registration object:**

*   `id`: A unique string identifier. Conventionally, this matches the filename without the `--test.js` suffix.
    *   While some current examples use underscores (e.g., `lines--M-size--no-fill--1px_opaque_stroke--crisp_pixel_pos--vertical_orient`), the project is moving towards a standardized hyphenated naming convention (e.g., `lines--m-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--vertical-orient`). New tests should ideally follow the hyphenated pattern for their filenames and corresponding IDs.
*   `drawFunction`: A direct reference to your test's uniform `drawTest` function.
*   `displayName`: A short, descriptive name that will appear in the performance test UI. It's good practice to prefix with "Perf:" or "HL:" (High-Level) to distinguish them if necessary.
*   `description`: A slightly longer description for clarity.
*   `category`: A string like `"lines"`, `"rectangles"`, or `"circles"`. This is used by `performance-ui.js` to group tests into the correct sections in the UI. If you add tests for a new shape type, you might need to add a corresponding section in `performance-tests.html` and update `performance-ui.js` to handle this new category.

**Step 3: Include Your Test Script in `performance-tests.html`**

Open `tests/browser-tests/performance-tests.html` and add a `<script>` tag to load your high-level test file. Ensure it's placed *after* the `window.PERFORMANCE_TESTS_REGISTRY = [];` initialization and *before* `performance-ui.js` is loaded.

```html
  <!-- ... other library scripts ... -->
  <script src="../../src/scene-creation/SeededRandom.js"></script>
  <script src="performance-tests/performance-utils.js"></script>
  
  <script>
    window.PERFORMANCE_TESTS_REGISTRY = []; // Initialize the global registry
  </script>

  <!-- Load test scripts -->
  <!-- Lines tests -->
  <script src="test-cases/lines--M-size--no-fill--1px_opaque_stroke--crisp_pixel_pos--vertical_orient--test.js"></script>
  <!-- ... other existing high-level tests ... -->
  <script src="test-cases/your-test-file-name.js"></script> <!-- Add your new test script here -->
  
  <!-- Rectangle tests -->
  <!-- (Add high-level rectangle tests here if available) -->
  
  <!-- Circle tests -->
  <!-- (Add high-level circle tests here if available) -->
  
  <!-- Test definitions and UI -->
  <script src="performance-tests/performance-ui.js"></script>
  <!-- ... -->
```

That's it! Your high-level test, now equipped with the self-registration block, will be automatically picked up by the performance testing page, and its UI elements will be generated. The performance suite will then call `drawTest(ctx, 0, shapeCount)` during the ramp-up tests.

## Naming Conventions and Code Guidelines

While the strict file naming and function naming conventions from the old system are no longer enforced by a central definition file, it's still good practice to maintain clear and descriptive names for your test files and drawing functions within the `high-level-tests` directory. The `id` you provide in the registration block should be unique.

The old "Code Guidelines for Different Test Types" (regarding specific sizes for XS, S, M, L, XL, etc.) are now less relevant to the *performance testing framework itself*, as it uses whatever drawing logic is provided by the high-level test. However, these guidelines might still be useful for ensuring consistency within the high-level tests themselves if they aim to test specific size/style variations. The performance test will simply measure how many of *whatever the high-level test draws* can be rendered.