## How to Add a New High-Level Test

Adding a new test to the "High-Level Tests" suite involves creating a self-contained test file that defines the drawing logic and configures the test using `RenderTestBuilder`.

Follow these steps:

1.  **Create Test File and Define Drawing Logic:**
    *   Create a new file inside the `tests/browser-tests/test-cases/` directory.
    *   Name the file according to the test parameters using `--` separators and ending with `--test.js` (e.g., `rectangles--S-size--filled--semitransparent-fill--crisp-pixel-pos-and-size--no-rotation--test.js`).
    *   Inside this file, create a JavaScript function for the drawing logic. Follow the established naming convention (e.g., `draw_rectangles__S_size__...`).
    *   **Signature:** The function must accept the rendering context and the current iteration number: `function myDrawingFunction(ctx, currentIterationNumber /*, ...any extra args */)`.
        *   `ctx`: Will be either a `CrispSwContext` or a `CanvasRenderingContext2D`. Use Canvas API methods compatible with both (or check `typeof ctx.strokeLine === 'function'` etc. if needed to differentiate).
        *   `currentIterationNumber`: Available if needed.
    *   **Randomness:** Use `SeededRandom.getRandom()` *inside* the function for reproducible randomness. Do not call `SeededRandom.seedWithInteger()`; `RenderTest` handles seeding.
    *   **Return Value for Checks:** If checks like `withExtremesCheck()` are used, calculate the required values (e.g., bounding box) and **return** them as an object. Note: If the returned object has a property named `checkData`, the test runner (`RenderTest`) will use the *value* of `checkData` as the input for checks; otherwise, it will use the entire returned object.
        ```javascript
        // Inside: tests/browser-tests/test-cases/my-shape--params--test.js

        function draw_my_shape(ctx, currentIterationNumber) {
          // ... setup, random values ...
          const x = 10, y = 20, width = 50, height = 30;
          const expectedLeftX = x;
          const expectedRightX = x + width - 1; // Inclusive pixel coords
          const expectedTopY = y;
          const expectedBottomY = y + height - 1; // Inclusive pixel coords

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
