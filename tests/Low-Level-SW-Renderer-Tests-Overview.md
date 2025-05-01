## Low-Level SW Renderer Tests: Overview

The primary goal of these tests is to **verify the correctness and visual fidelity** of the custom JavaScript software renderer (`sw-renderer`) by comparing its output directly against the browser's native HTML5 Canvas API (`canvas-renderer`). The aim is often pixel-level accuracy for specific scenarios (like axis-aligned shapes with integer coordinates) and visual similarity for more complex cases (like rotated shapes or thick strokes where anti-aliasing differences are expected).

The tests run in the browser via `tests/browser-tests/low-level-renderer-tests.html`.

## How the Tests Work

The testing system is built around several key components that work together:

1.  **`RenderTest` (`src/RenderTest.js`): The Test Runner UI & Orchestrator**
    *   Each instance of `RenderTest` represents a single, self-contained test case displayed on the HTML page.
    *   **UI Management:** It creates and manages the necessary HTML elements for a test:
        *   **SW Canvas:** Displays the output of the custom software renderer.
        *   **HTML5 Canvas:** Displays the output of the native browser Canvas API (the reference).
        *   **Comparison Canvas:** An interactive canvas that either alternates between the SW and Canvas views or shows a side-by-side magnified view around the mouse cursor.
        *   Labels, buttons ("1 iteration", "Flip", etc.), iteration counter, log area, checks area, and error area.
    *   **Rendering Orchestration:** It coordinates the rendering process:
        *   Takes a `buildShapesFn` function to generate the scene geometry.
        *   Calls `drawShapesImpl` (from `src/shared-renderer.js`) to render the generated shapes onto *both* the SW renderer's framebuffer and the HTML5 Canvas context.
        *   Updates the on-screen canvases with the rendering results.
    *   **Check Execution:** If configured, it runs a series of checks on the rendered outputs after each iteration.
    *   **State Management:** Handles iterations, flipping the comparison view, and error tracking/display.
    *   **Registration:** Each `RenderTest` instance automatically registers itself into a static `RenderTest.registry` using its unique ID. This registry is used by the navigation and "Run All" features.

2.  **`RenderTestBuilder` (`src/RenderTestBuilder.js`): Fluent Test Configuration**
    *   Provides a builder pattern (fluent interface) to easily configure and create `RenderTest` instances.
    *   Methods like `withId()`, `withTitle()`, `withDescription()`, `addShapes()`, and `with*Check()` allow chaining to define a test's properties.
    *   `addShapes(sceneCreationFn, ...args)`: Specifies the function (typically from `src/scene-creation/`) used to generate the shapes for the test scene. It wraps this function to handle logging and iteration numbers.
    *   `with*Check(options)`: Adds a specific check to be performed after rendering. These methods store functions that will later call the appropriate methods in `RenderChecks`. Examples: `withExtremesCheck()`, `withColorCheckMiddleRow()`, `withNoGapsInStrokeEdgesCheck()`.
    *   `build()`: Finalizes the configuration and creates/returns a new `RenderTest` instance, which also registers the test.

3.  **`RenderChecks` (`src/RenderChecks.js`): Image Analysis & Verification**
    *   Contains the core logic for analyzing the pixel data of the rendered canvases (both SW and HTML5).
    *   Takes a `RenderTest` instance in its constructor to report errors using `test.showError()`.
    *   Provides methods for specific checks:
        *   `findExtremesWithTolerance()`: Finds the bounding box of non-transparent pixels.
        *   `checkExtremes()`: Compares the actual bounding box against expected values (often returned by the `buildShapesFn`).
        *   `checkCountOfUniqueColorsInLine()` / `checkCountOfUniqueColorsInMiddleRow()` / `checkCountOfUniqueColorsInMiddleColumn()`: Counts unique colors in specific canvas regions.
        *   `checkEdgeGaps()` / `checkEdgesForGaps()`: Checks for transparent pixels along the shape's boundary (useful for filled shapes or strokes).
        *   `checkStrokeContinuity()` / `checkStrokeForHoles()`: Verifies that strokes (like on a circle) form a continuous loop without gaps.
        *   `checkCountOfUniqueColorsInImage()`: Counts unique colors in the entire image.
        *   `checkForSpeckles()`: Detects isolated pixels that differ from their neighbours.
        *   `compareWithThreshold()`: Compares SW and Canvas outputs pixel-by-pixel within given RGB/Alpha thresholds.

4.  **Scene Creation Functions (`src/scene-creation/`): Generating Test Geometry**
    *   Files like `scene-creation-rects.js`, `scene-creation-circles.js`, etc., contain functions specifically designed to generate arrays of shape objects for testing.
    *   These functions typically take `(shapes, log, currentIterationNumber, ...args)` as parameters.
    *   `shapes`: The array to populate with shape objects.
    *   `log`: The `RenderTest`'s log container element for descriptive output.
    *   `currentIterationNumber`: Used to seed the `SeededRandom` generator for reproducible randomness across iterations and between SW/Canvas renderers.
    *   They often use helper functions from `scene-creation-utils.js` and `random-utils.js`.
    *   Crucially, some scene functions (like `add1PxStrokeCenteredRectAtGrid`) calculate and **return** the expected geometric `extremes` (bounding box) of the generated shape, which are then used by the `withExtremesCheck`.

5.  **Test Definitions (`src/add-tests.js`): Configuring Specific Tests**
    *   This file contains functions (e.g., `addAxisAlignedRectanglesTest()`, `add1PxStrokedCircleCenteredAtGridTest()`) that *use* the `RenderTestBuilder` to define concrete test cases.
    *   Each function typically:
        *   Instantiates `RenderTestBuilder`.
        *   Sets the test ID, title, and description.
        *   Calls `addShapes()` to link to a specific scene creation function from `src/scene-creation/`.
        *   Calls various `with*Check()` methods to specify which checks should be run for this test.
        *   Calls `build()` to create and register the `RenderTest` instance.

6.  **Test Loading (`tests/low-level-renderer-tests-loading.js`): Instantiating Tests**
    *   This script simply *calls* the test definition functions defined in `src/add-tests.js`.
    *   Executing these functions triggers the `RenderTestBuilder` and ultimately creates and registers all the `RenderTest` instances.

7.  **Rendering Logic (`src/renderers/` and `src/shared-renderer.js`)**
    *   `src/shared-renderer.js` contains `drawShapesImpl`, which iterates through the generated `shapes` array.
    *   Based on the `isCanvas` flag, it dispatches drawing commands either to:
        *   The HTML5 Canvas context (`ctx`) using functions from `src/renderers/canvas-renderer/`.
        *   The software renderer classes (e.g., `SWRendererRect`, `SWRendererLine`) from `src/renderers/sw-renderer/`, which operate on the `frameBufferUint8ClampedView`.

**Execution Flow Summary (Browser):**

1.  `low-level-renderer-tests.html` is loaded.
2.  Various JS files (utils, renderers, scene creators, core test classes) are loaded.
3.  `low-level-renderer-tests-loading.js` executes, calling functions in `add-tests.js`.
4.  Each call in `add-tests.js` uses `RenderTestBuilder` to configure and `.build()` a `RenderTest`.
5.  The `RenderTest` constructor:
    *   Registers the test (`RenderTest.registry[id] = this`).
    *   Creates the necessary DOM elements (canvases, buttons, logs) and appends them to the `<body>`.
    *   Calls `this.render()` for an initial display.
6.  `render()`:
    *   Calls the specified `buildShapesFn` (from `src/scene-creation/`) to get shape data and potentially expected `extremes`.
    *   Calls `drawShapesImpl` for SW renderer -> updates SW canvas display.
    *   Calls `drawShapesImpl` for HTML5 Canvas renderer -> updates Canvas display.
    *   Updates the comparison canvas.
    *   If checks are configured, calls the aggregated check function.
7.  Check function executes, calling methods on the `RenderChecks` instance, which analyze canvas data and report errors via `test.showError()`.
8.  The page displays all test instances. Users can interact with buttons ("1 iteration", "Flip", "Run All") to trigger further rendering and checking cycles.
9.  `RenderTest.createNavigation()` is called after all tests are loaded to build the top navigation links.