## How to Add a New High-Level Test

Adding a new test to the "High-Level Tests" suite involves creating a self-contained test file that defines the drawing logic and configures the test using `RenderTestBuilder`.

Follow these steps:

1.  **Create Test File and Define Drawing Logic:**
    *   Create a new file inside the `tests/browser-tests/test-cases/` directory.
    *   Name the file according to the test parameters using `--` separators and ending with `--test.js` (e.g., `rectangles--S-size--filled--semitransparent-fill--crisp-pixel-pos-and-size--no-rotation--test.js`).
    *   Inside this file, create a JavaScript function for the drawing logic. Follow the established naming convention (e.g., `draw_rectangles__S_size__...`).
    *   **Signature:** The function should accept the rendering context, current iteration number, and optionally an `instances` parameter for potential performance testing compatibility:
        `function myDrawingFunction(ctx, currentIterationNumber /*, ...any extra args, */, instances = null)`
        *   `ctx`: Will be either a `CrispSwContext` or a `CanvasRenderingContext2D`. Use Canvas API methods compatible with both (or check `typeof ctx.strokeLine === 'function'` etc. if needed to differentiate).
        *   `currentIterationNumber`: Available if needed for the visual test logic (e.g., passed to helpers that might use it, though `SeededRandom` is usually sufficient directly).
        *   `any extra args`: If you pass static arguments via `RenderTestBuilder.runCanvasCode(..., arg1, arg2)`, they will appear here before `instances`.
        *   `instances`: Typically `null` when run via `high-level-tests.html`. Included for easier adaptation if the test is later used in the performance suite (`performance-tests.html`), where it would indicate the number of shapes to draw. Your drawing function for high-level visual tests can usually ignore this parameter or draw 1 instance if it's `null`.
    *   **Randomness:** Use `SeededRandom.getRandom()` *inside* the function for reproducible randomness. Do not call `SeededRandom.seedWithInteger()`; `RenderTest` handles seeding before calling your drawing function.
    *   **Handling Clipping in Performance Mode:** If your test involves clipping, the drawing function must implement specific logic when running in performance mode (i.e., when `instances` is not `null` and greater than 0). The strategy depends on whether your visual test is designed to draw a single primary shape/composition (its `Count` facet is `single`) or multiple shapes (its `Count` facet is `multi*`):
        *   **If Visual Test `Count` is `single` (for drawn shapes):**
            *   In performance mode, the clipping region (defined by the test's clipping facets) should be set up and torn down *for each drawn instance*. This typically involves `ctx.save()`, defining the clip path, `ctx.clip()`, drawing the shape, and `ctx.restore()` *inside the loop* that iterates based on `instances`.
            *   This approach measures the performance impact of repeated clip definition.
        *   **If Visual Test `Count` is `multi*` (for drawn shapes):**
            *   In performance mode, the clipping region should be defined *once per frame*, before drawing the scaled set of shapes. All shapes drawn within that frame (their number/complexity scaled by `instances`) will be clipped against this single, pre-established region. `ctx.save()` and `ctx.clip()` would be called before the main drawing loop/logic for the instances, and `ctx.restore()` after.
            *   This approach measures the performance impact of rendering many shapes within an existing clip.
    *   **Return Value for Checks:** If checks like `withExtremesCheck()` are used, calculate the required values (e.g., bounding box for the primary/first element drawn, representing *inclusive pixel coordinates*) and **return** them as an object. Note: If the returned object has a property named `checkData`, the test runner (`RenderTest`) will use the *value* of `checkData` as the input for checks; otherwise, it will use the entire returned object.
        ```javascript
        // Inside: tests/browser-tests/test-cases/my-shape--params--test.js

        function draw_my_shape(ctx, currentIterationNumber, instances = null) {
          // instances can be ignored for basic high-level tests, or used to draw 1 shape if null.
          // ... setup, random values ...
          const x = 10, y = 20, width = 50, height = 30;
          const expectedLeftX = x;
          const expectedRightX = x + width - 1; // Inclusive: last pixel column covered by fillRect
          const expectedTopY = y;
          const expectedBottomY = y + height - 1; // Inclusive: last pixel row covered by fillRect

          // ... use ctx to draw ...
          ctx.fillStyle = 'red';
          ctx.fillRect(x, y, width, height);

          // Return data needed by checks
          return {
            leftX: expectedLeftX,
            rightX: expectedRightX,
            topY: expectedTopY,
            bottomY: expectedBottomY
            // ... any other data needed by custom checks ...
          };
        }
        ```

2.  **Define Test Configuration (in the same file):**
    *   In the *same test file* (`...--test.js`), create a function to define the test configuration using the corresponding nomenclature (e.g., `define_rectangles__S_size__...`).
    *   Inside this function, instantiate and configure `RenderTestBuilder`:
        ```javascript
        // Inside: tests/browser-tests/test-cases/my-shape--params--test.js
        // (Continued from Step 1)

        function define_my_shape_test() {
          return new RenderTestBuilder()
            // ID should match drawing/definition function names (using '--' separators)
            .withId('my-shape--params')
            // Descriptive title following the convention
            .withTitle('MyShape: Params Description')
            // More detailed description
            .withDescription('Tests rendering of MyShape with specific parameters using canvas code.')
            // Link to the drawing function from Step 1
            .runCanvasCode(draw_my_shape /*, any extra args for drawing fn */)
            // Add checks. withExtremesCheck uses the return value from draw_my_shape
            // (specifically, the value stored in test.builderReturnValue, potentially from a checkData property)
            .withExtremesCheck()
            // Add other relevant checks
            .withColorCheckMiddleRow({ expectedUniqueColors: 2 }) // Example
            .compareWithThreshold(0, 0) // Example: pixel-perfect comparison
            // Finalize and register the test
            .build();
        }
        ```
    *   Choose appropriate checks. `withExtremesCheck` and similar checks automatically use the object returned by the *first call* to the drawing function (the one using the software renderer context), which is captured internally by the test runner (potentially extracting a `checkData` property as described above).
    *   **Crucially**, at the very end of the file, *call* the definition function to register the test when the script loads:
        ```javascript
        // Inside: tests/browser-tests/test-cases/my-shape--params--test.js
        // (End of file)

        // Define and register the test immediately when this script is loaded.
        define_my_shape_test();
        ```

3.  **Include the Test File in HTML:**
    *   Open `tests/browser-tests/high-level-tests.html`.
    *   Add a new `<script>` tag pointing to your test file, alongside the other test file includes:
        ```html
        <!-- Test Framework Core -->
        <script src="../../src/RenderChecks.js"></script>
        <script src="../../src/RenderTest.js"></script>
        <script src="../../src/RenderTestBuilder.js"></script>

        <!-- Load Individual High-Level Test Files -->
        <script src="test-cases/lines--M-size--...--test.js"></script>
        <!-- Add your new test file here -->
        <script src="test-cases/my-shape--params--test.js"></script>
        <!-- Add more <script> tags here for other test files -->

        <!-- Script to Load Tests and Init Page -->
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            RenderTest.createNavigation("High-Level Tests");
          });
        </script>
        ```
    *   Registration happens automatically when the script file is loaded by the browser.

4.  **Implement Renderer Logic (If Testing New Primitives):**
    *   This step is **usually not required** unless adding a *new drawing capability* to `CrispSwContext` itself (e.g., adding `ctx.drawStar(...)`).
    *   If needed, modify `CrispSwContext.js` and the relevant `SWRenderer*` classes.

5.  **Verify:**
    *   Ensure you are running a local web server.
    *   Open `http://localhost:PORT/tests/browser-tests/high-level-tests.html`.
    *   Your new test should appear in the list and navigation.
    *   Check rendering, logs, checks, and errors.
    *   Run multiple iterations and use mouse inspection.
