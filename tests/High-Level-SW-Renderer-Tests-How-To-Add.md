## How to Add a New High-Level Test

Adding a new test to the "High-Level Tests" suite involves creating a self-contained test file that defines the drawing logic and registers the test using `registerHighLevelTest()`.

Follow these steps:

1.  **Create Test File and Define Drawing Logic:**
    *   Create a new file inside the `tests/browser-tests/test-cases/` directory.
    *   Name the file according to the test parameters using `--` separators and ending with `--test.js` (e.g., `rectangles--S-size--filled--semitransparent-fill--crisp-pixel-pos-and-size--no-rotation--test.js`).
    *   Inside this file, create a JavaScript function for the drawing logic. Use the uniform function name `drawTest`.
    *   **Signature:** The function must use the exact signature:
        `function drawTest(ctx, currentIterationNumber, instances = null)`
        *   `ctx`: Will be either a `CrispSwContext` or a `CanvasRenderingContext2D`. Use Canvas API methods compatible with both (or check `typeof ctx.strokeLine === 'function'` etc. if needed to differentiate).
        *   `currentIterationNumber`: Available if needed for the visual test logic (e.g., passed to helpers that might use it, though `SeededRandom` is usually sufficient directly).
        *   `instances`: Typically `null` when run via `high-level-tests.html`. When not null, indicates the number of shapes to draw for performance testing. Your drawing function should handle both visual testing (instances = null) and performance testing (instances = positive number) modes.
    *   **Randomness:** Use `SeededRandom.getRandom()` *inside* the function for reproducible randomness. Do not call `SeededRandom.seedWithInteger()`; `RenderTest` handles seeding before calling your drawing function.
    *   **Handling Clipping in Performance Mode:** If your test involves clipping, the drawing function must implement specific logic when running in performance mode (i.e., when `instances` is not `null` and greater than 0). The strategy depends on whether your visual test is designed to draw a single primary shape/composition (its `Count` facet is `single`) or multiple shapes (its `Count` facet is `multi*`):
        *   **If Visual Test `Count` is `single` (for drawn shapes):**
            *   In performance mode, the clipping region (defined by the test's clipping facets) should be set up and torn down *for each drawn instance*. This typically involves `ctx.save()`, defining the clip path, `ctx.clip()`, drawing the shape, and `ctx.restore()` *inside the loop* that iterates based on `instances`.
            *   This approach measures the performance impact of repeated clip definition.
        *   **If Visual Test `Count` is `multi*` (for drawn shapes):**
            *   In performance mode, the clipping region should be defined *once per frame*, before drawing the scaled set of shapes. All shapes drawn within that frame (their number/complexity scaled by `instances`) will be clipped against this single, pre-established region. `ctx.save()` and `ctx.clip()` would be called before the main drawing loop/logic for the instances, and `ctx.restore()` after.
            *   This approach measures the performance impact of rendering many shapes within an existing clip.
            *   When defining a test with clipping, be sure to also classify the clipping shape's own facets, such as its shape, count, size, arrangement, and edge alignment (`clpEdgeCrisp`/`clpEdgeNotCrisp`), in the test naming analysis data.
    *   **Return Value for Checks:** If checks like `withExtremesCheck()` are used, calculate the required values (e.g., bounding box for the primary/first element drawn, representing *inclusive pixel coordinates*) and **return** them as an object. Note: If the returned object has a property named `checkData`, the test runner (`RenderTest`) will use the *value* of `checkData` as the input for checks; otherwise, it will use the entire returned object.
        ```javascript
        // Inside: tests/browser-tests/test-cases/my-shape--params--test.js

        function drawTest(ctx, currentIterationNumber, instances = null) {
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

2.  **Register the Test (in the same file):**
    *   In the *same test file* (`...--test.js`), register the test using `registerHighLevelTest`:
        ```javascript
        // Inside: tests/browser-tests/test-cases/my-shape--params--test.js
        // (Continued from Step 1)

        // Register the test
        registerHighLevelTest(
            'my-shape--params--test', // ID should match the filename
            drawTest, // Reference to the drawing function from Step 1
            'shapes', // Category for grouping (e.g., 'lines', 'rectangles', 'circles', etc.)
            {
                extremes: true, // Enable extremes checking if your drawTest returns bounding box data
                compare: { swTol: 0, refTol: 0, diffTol: 0 } // Pixel-perfect comparison
            },
            {
                title: 'MyShape: Params Description',
                description: 'Tests rendering of MyShape with specific parameters using canvas code.',
                displayName: 'Perf: MyShape Params Test'
            }
        );
        ```
    *   **Configuration Options:**
        *   `extremes: true` - Enable extremes checking if your `drawTest` function returns bounding box data
        *   `compare` - Set tolerance levels for pixel comparison
        *   `drawFunctionArgs` - Pass additional arguments to `drawTest` if needed (though this should be rare with the uniform pattern)
    *   **Metadata:**
        *   `title` - Descriptive title for the visual test interface
        *   `description` - Detailed description of what the test does
        *   `displayName` - Short name for performance test interface

3.  **Include the Test File in HTML:**
    *   Open `tests/browser-tests/high-level-tests.html`.
    *   Add a new `<script>` tag pointing to your test file, alongside the other test file includes:
        ```html
        <!-- Load Individual High-Level Test Files -->
        <script src="test-cases/line-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-edgeCrisp-ornVert-test.js"></script>
        <!-- Add your new test file here -->
        <script src="test-cases/my-shape--params--test.js"></script>
        <!-- Add more <script> tags here for other test files -->
        ```
    *   Registration happens automatically when the script file is loaded by the browser via the `registerHighLevelTest()` call.

4.  **Verify:**
    *   Ensure you are running a local web server.
    *   Open `http://localhost:PORT/tests/browser-tests/high-level-tests.html`.
    *   Your new test should appear in the list and navigation.
    *   Check rendering, logs, checks, and errors.
    *   Run multiple iterations and use mouse inspection.

## Notes

*   **Implementing New Renderer Logic:** This is usually not required unless adding a *new drawing capability* to `CrispSwContext` itself (e.g., adding `ctx.drawStar(...)`). If needed, modify `CrispSwContext.js` and the relevant `SWRenderer*` classes.
*   **Function Signature:** The `drawTest` function signature must be exactly `function drawTest(ctx, currentIterationNumber, instances = null)` for consistency and proper Node.js concatenation.
*   **Performance Integration:** Tests registered with `registerHighLevelTest` automatically work in both visual testing (`high-level-tests.html`) and performance testing (`performance-tests.html`) modes.
