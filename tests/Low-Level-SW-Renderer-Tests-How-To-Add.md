## How to Add a New Low-Level SW Renderer Test

Follow these steps:

1.  **Define Scene Creation Logic (if needed):**
    *   If your test requires a unique scene setup, create a new function in the relevant `src/scene-creation/` file (e.g., `src/scene-creation/scene-creation-polygons.js` if adding polygon tests).
    *   This function should follow the signature: `function createMyNewScene(shapes, log, currentIterationNumber, ...args)`
    *   Inside, use `SeededRandom.seedWithInteger(currentIterationNumber)` for reproducibility.
    *   Generate your shape objects (e.g., `{ type: 'polygon', points: [...], strokeColor: ..., fillColor: ... }`) and push them onto the `shapes` array.
    *   Use `log.innerHTML += ...` to add descriptive text about the generated shapes for the specific iteration.
    *   **Important:** If you plan to use checks that require expected geometry (like `withExtremesCheck`), calculate and `return` this data (e.g., `return { leftX, rightX, topY, bottomY };`).

2.  **Define the Test Configuration:**
    *   Open `src/add-tests.js`.
    *   Create a new function for your test, e.g., `function addMyNewPolygonTest()`.
    *   Inside this function, use the `RenderTestBuilder`:
        ```javascript
        function addMyNewPolygonTest() {
          return new RenderTestBuilder()
            .withId('my-new-polygon-test') // Unique ID (used for anchors, etc.)
            .withTitle('My New Polygon Rendering Test') // Title displayed on the page
            .withDescription('Tests rendering of a complex custom polygon.') // Description
            .addShapes(createMyNewScene, /* any extra args for scene fn */) // Reference the scene function from Step 1
            // .withExtremesCheck() // Add if your scene function returns extremes
            // .withUniqueColorsCheck(3) // Add any other relevant checks
            // .compareWithThreshold(5, 5) // Example: Compare images with tolerance
            .build(); // Create and register the RenderTest instance
        }
        ```
    *   Choose appropriate checks from `RenderTestBuilder` based on what you want to verify.

3.  **Register the Test:**
    *   Open `tests/low-level-renderer-tests-loading.js`.
    *   Inside the `loadLowLevelRenderTests` function, *call* the function you created in Step 2:
        ```javascript
        function loadLowLevelRenderTests() {
            // ... existing test calls ...
            addMyNewPolygonTest(); // Add this line
        }
        ```
    *   Ensure the order doesn't particularly matter unless there are dependencies (which is unlikely for these tests).

4.  **Implement Renderer Logic (if testing a new shape type):**
    *   If your test involves a shape type not currently supported (e.g., 'polygon'), you'll need to:
        *   Implement the drawing logic in `src/renderers/sw-renderer/` (e.g., `SWRendererPolygon.js`).
        *   Implement the corresponding HTML5 Canvas drawing logic in `src/renderers/canvas-renderer/` (e.g., `canvas-polygon.js`).
        *   Update `src/shared-renderer.js`'s `drawShapesImplFn` to dispatch to your new renderer functions based on `shape.type === 'polygon'`.

5.  **Verify:**
    *   Open `tests/browser-tests/low-level-renderer-tests.html` in your browser.
    *   Your new test should appear in the list and in the top navigation.
    *   Check the initial rendering and the output in the log, checks, and error areas.
    *   Run a few iterations to ensure reproducibility and check for errors. Use the mouse inspection on the comparison canvas.
