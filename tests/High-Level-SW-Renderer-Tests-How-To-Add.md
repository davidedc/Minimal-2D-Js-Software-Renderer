## How to Add a New High-Level Test

Adding a new test to the "High-Level Tests" suite involves defining the drawing logic using Canvas API-like calls and configuring the test using `RenderTestBuilder`.

Follow these steps:

1.  **Define Drawing Logic:**
    *   Open `high-level-tests-drawing.js`.
    *   Create a new JavaScript function. Follow the established naming convention, which typically describes the geometry and rendering parameters (e.g., `draw_rectangles__S_size__filled__semitransparent_fill__crisp_pixel_pos_and_size__no_rotation`).
    *   **Signature:** The function must accept the rendering context and the current iteration number as its first two arguments: `function myDrawingFunction(ctx, currentIterationNumber /*, ...any extra args */)`.
        *   `ctx`: Will be either a `CrispSwContext` (for the software renderer pass) or a `CanvasRenderingContext2D` (for the native canvas pass). Use standard Canvas API methods (e.g., `ctx.fillStyle = 'rgba(...)';`, `ctx.fillRect(x, y, w, h);`, `ctx.lineWidth = 1;`, `ctx.strokeStyle = '...';`, `ctx.strokeLine(x1, y1, x2, y2);`, `ctx.beginPath(); ctx.moveTo(); ctx.lineTo(); ctx.stroke();`, etc.).
        *   `currentIterationNumber`: Use this number if the drawing logic needs to vary per iteration *independently* of the random seed (rare). For random variations, use `SeededRandom`.
    *   **Randomness:** Use `SeededRandom.getRandom()` *inside* your function if you need reproducible randomness for geometry, colors, etc. **Do not** call `SeededRandom.seedWithInteger()` inside the function; `RenderTest` handles seeding *before* calling your function for both the SW and Canvas passes, ensuring the sequence of `getRandom()` calls produces the same results for both renderers within an iteration.
    *   **Return Value for Checks:** If your test uses checks that require calculated values from the scene (e.g., `withExtremesCheck()` needs the bounding box), calculate these values within your drawing function and **return** them as an object. `RenderTest` will capture this object and make it available to the checks.
        ```javascript
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

2.  **Define the Test Configuration:**
    *   Open `high-level-tests-definitions.js`.
    *   Create a new function to define your test. Use the corresponding nomenclature (e.g., `define_rectangles__S_size__filled__semitransparent_fill__crisp_pixel_pos_and_size__no_rotation`).
    *   Inside this function, instantiate and configure `RenderTestBuilder`:
        ```javascript
        function define_my_shape_test() {
          // Ensure the drawing function is available
          if (typeof draw_my_shape !== 'function') {
            console.error('Drawing function draw_my_shape not found!');
            return;
          }

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
            .withExtremesCheck()
            // Add other relevant checks
            .withColorCheckMiddleRow({ expectedUniqueColors: 2 }) // Example
            .compareWithThreshold(0, 0) // Example: pixel-perfect comparison
            // Finalize and register the test
            .build();
        }
        ```
    *   Choose appropriate checks from `RenderTestBuilder`. Remember that checks requiring expected geometry (like `withExtremesCheck`) will automatically use the object returned by your drawing function (specified via `runCanvasCode`).

3.  **Register the Test:**
    *   Open `tests/high-level-tests-loading.js`.
    *   Inside the `loadCrispnessTests` function, add a call to the definition function you created in Step 2:
        ```javascript
        function loadCrispnessTests() {
            console.log('Loading High-Level Tests...');

            // ... existing test definition calls ...

            // Add call for the new test
            if (typeof define_my_shape_test === 'function') {
                define_my_shape_test(); // Add this line
            } else {
                console.error('Definition function define_my_shape_test not found!');
            }

            console.log('High-Level Tests loading complete.');
        }
        ```

4.  **Implement Renderer Logic (If Testing New Primitives):**
    *   This step is **usually not required** when adding a *new test case* using existing Canvas API-like features.
    *   You would only need this if you were adding a *new drawing capability* to the software renderer itself (e.g., adding `ctx.drawStar(...)` support).
    *   If so, you would need to:
        *   Add the method (e.g., `drawStar`) to `src/crisp-sw-canvas/CrispSwContext.js`.
        *   Implement the underlying drawing logic in a new or existing `SWRenderer*` class in `src/renderers/sw-renderer/`.
        *   Potentially implement corresponding native Canvas logic in `src/renderers/canvas-renderer/` if needed for direct comparison or visualization helpers.

5.  **Verify:**
    *   Ensure you are running a local web server in the project's root directory (e.g., `python3 -m http.server` or `npx http-server`).
    *   Open `http://localhost:PORT/tests/browser-tests/high-level-tests.html` in your browser.
    *   Your new test should appear in the list and the top navigation.
    *   Examine the initial rendering on both SW and Canvas displays.
    *   Check the output in the log, checks, and error areas.
    *   Run multiple iterations to test reproducibility and different random variations.
    *   Use the mouse-over inspection on the SW and Canvas panels to check pixel values.
