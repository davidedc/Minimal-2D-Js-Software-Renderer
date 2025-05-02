## High-Level Tests: Overview

The primary goal of these tests is to **verify the correctness and visual fidelity** of the custom JavaScript software renderer (`CrispSwContext` interacting with `SWRenderer*` classes) by comparing its output directly against the browser's native HTML5 Canvas API (`CanvasRenderingContext2D`). Unlike the "Low-Level SW Renderer Tests," these tests define scenes using **higher-level, Canvas API-like function calls** (e.g., `ctx.fillRect`, `ctx.strokeLine`) rather than creating abstract shape objects.

The focus is often on scenarios where pixel-perfect alignment and crisp rendering are critical, such as axis-aligned shapes, 1px lines, and specific coordinate positioning (e.g., centered on physical pixels vs. between physical pixels).

The tests run in the browser via `tests/browser-tests/high-level-tests.html`.

## How the Tests Work

The testing system reuses several key components from the low-level tests but employs a different mechanism for scene definition and rendering initiation:

1.  **`RenderTest` (`src/RenderTest.js`): The Test Runner UI & Orchestrator**
    *   Largely the same role as in the low-level tests. Each instance represents a single test case on the HTML page.
    *   **UI Management:** Creates and manages HTML elements (SW Canvas, HTML5 Canvas, Comparison Canvas, labels, buttons, log, checks, errors).
    *   **Rendering Orchestration:** Coordinates the rendering process differently:
        *   Instead of taking a `buildShapesFn`, it takes a `canvasCodeFn` (via `RenderTestBuilder.runCanvasCode`).
        *   It calls the `canvasCodeFn` *twice* per iteration:
            *   Once with a `CrispSwContext` instance (the software renderer).
            *   Once with a standard `CanvasRenderingContext2D` instance (the native reference).
        *   **Important:** It captures the **return value** from the *first* call (the one with `CrispSwContext`) and stores it in `this.builderReturnValue`. This allows checks to verify geometry or other properties calculated during the drawing process.
        *   It updates the on-screen canvases using the rendering results (transferring SW renderer data via `ImageData`).
    *   **Check Execution:** If configured, runs checks (`RenderChecks`) on the rendered outputs *after* both canvases have been drawn. Checks like `withExtremesCheck` now use the stored `this.builderReturnValue`.
    *   **State Management & Registration:** Handles iterations, comparison view, error tracking, and registration in `RenderTest.registry`.

2.  **`RenderTestBuilder` (`src/RenderTestBuilder.js`): Fluent Test Configuration**
    *   Provides the same builder pattern for configuring `RenderTest` instances.
    *   Key difference: Uses `.runCanvasCode(drawingFn, ...args)` instead of `.addShapes()`.
        *   `runCanvasCode` specifies the function (from `high-level-tests-drawing.js`) that contains the actual Canvas API-like drawing calls.
        *   `RenderTest` will later call this `drawingFn` with the appropriate context (`CrispSwContext` or `CanvasRenderingContext2D`) and store its return value.
    *   Methods like `withId()`, `withTitle()`, `withDescription()`, and `with*Check()` work similarly. Checks that need external data (like `withExtremesCheck`) are configured the same way but rely on the `drawingFn`'s return value being captured by `RenderTest`.
    *   `build()`: Finalizes configuration, creates, and registers the `RenderTest` instance.

3.  **`RenderChecks` (`src/RenderChecks.js`): Image Analysis & Verification**
    *   Contains the core logic for analyzing pixel data from both canvases. Its role is unchanged.
    *   Takes a `RenderTest` instance to access canvas contexts and report errors.
    *   Provides methods like `findExtremesWithTolerance()`, `checkExtremes()`, `checkCountOfUniqueColorsInLine()`, `compareWithThreshold()`, etc.
    *   When a check like `checkExtremes()` is executed, it retrieves the *expected* values from `test.builderReturnValue` (which originated from the `drawingFn`'s return value).

4.  **Drawing Functions (`high-level-tests-drawing.js`): Defining Test Scenes via Canvas API**
    *   This file contains functions that encapsulate the drawing logic for specific test scenes using Canvas API-like calls.
    *   **Signature:** Functions follow the pattern `function draw_...(ctx, currentIterationNumber, ...args)`.
        *   `ctx`: The rendering context provided by `RenderTest`. This will be a `CrispSwContext` for the software rendering pass and a `CanvasRenderingContext2D` for the native rendering pass. The function should use standard Canvas API methods available on both (or potentially check the context type if needed, though usually not required).
        *   `currentIterationNumber`: Used for seeding `SeededRandom` (randomness generation should happen *within* the function using `SeededRandom.getRandom()`, as `RenderTest` seeds *before* each call).
        *   `...args`: Any additional arguments passed via `runCanvasCode`.
    *   **Return Value:** Crucially, these functions **return** an object containing any data calculated during drawing that is needed by subsequent checks (e.g., `return { leftX, rightX, topY, bottomY };` for `withExtremesCheck`).
    *   **Nomenclature:** Functions follow a descriptive naming convention (e.g., `draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient`).

5.  **Test Definitions (`high-level-tests-definitions.js`): Configuring Specific Tests**
    *   This file contains functions that use `RenderTestBuilder` to define concrete test cases, following the Crispness Test nomenclature.
    *   Each function typically:
        *   Instantiates `RenderTestBuilder`.
        *   Sets the ID, title, and description (following nomenclature).
        *   Calls `.runCanvasCode()` linking to a specific drawing function from `high-level-tests-drawing.js`.
        *   Calls `with*Check()` methods.
        *   Calls `build()` to create and register the test.

6.  **Test Loading (`tests/high-level-tests-loading.js`): Instantiating Tests**
    *   A simple script that calls all the test definition functions (e.g., `define_lines__...()`) from `high-level-tests-definitions.js`. Executing these functions triggers the `RenderTestBuilder` and registers the tests.

7.  **Rendering Contexts & Logic (`CrispSwContext`, `CanvasRenderingContext2D`, `src/renderers/`)**
    *   `CrispSwContext` (`src/crisp-sw-canvas/CrispSwContext.js`): Provides the Canvas API-like interface for the software renderer. It internally uses specific `SWRenderer*` classes (`src/renderers/sw-renderer/`) to draw to its framebuffer.
    *   `CanvasRenderingContext2D`: The browser's native implementation, used for the reference rendering.
    *   `src/renderers/canvas-renderer/`: Contains helpers used by `RenderTest` to draw the reference image using the native context *if* the older `addShapes` mechanism were used (less relevant for high-level tests but potentially used by some checks or comparison visualization).
    *   `src/shared-renderer.js`: *Not typically used* in the main rendering path for High-Level Tests, as drawing is delegated to the `drawingFn` passed to `runCanvasCode`.

**Execution Flow Summary (Browser - High-Level Tests):**

1.  `high-level-tests.html` is loaded.
2.  Various JS files (utils, CrispSwContext, renderers, test framework core, crispness drawing/definitions/loading) are loaded.
3.  `high-level-tests-loading.js` executes, calling functions in `high-level-tests-definitions.js`.
4.  Each call uses `RenderTestBuilder` -> sets ID/Title/Desc -> calls `.runCanvasCode(drawingFn)` -> adds checks -> calls `.build()`.
5.  The `RenderTest` constructor:
    *   Registers the test (`RenderTest.registry[id] = this`).
    *   Creates the necessary DOM elements (canvases, buttons, logs) and appends them to the `<body>`.
    *   Calls its own `render()` method for an initial display.
6.  `render()` / `renderInBrowser(null, canvasCodeFn)`:
    *   Clears canvases.
    *   Seeds `SeededRandom`.
    *   Calls `drawingFn(this.crispSwCtx, currentIterationNumber)` -> stores the return value in `this.builderReturnValue`.
    *   Gets `ImageData` from `this.crispSwCtx` and uses `putImageData` to display on the SW canvas element.
    *   Seeds `SeededRandom` again (ensuring identical random sequence).
    *   Calls `drawingFn(this.canvasCtxOfCanvasRender, currentIterationNumber)`.
    *   Updates the comparison canvas.
    *   Calls the aggregated check function (`this.functionToRunAllChecks`).
7.  Check function executes, calling methods on the `RenderChecks` instance. Checks like `checkExtremes` access `this.builderReturnValue` for expected values. Errors are reported via `test.showError()`.
8.  The page displays all test instances. Users interact via buttons.
9.  `RenderTest.createNavigation()` builds the top navigation.