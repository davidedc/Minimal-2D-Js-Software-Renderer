## High-Level Tests: Overview

The primary goal of these tests is to **verify the correctness and visual fidelity** of the custom JavaScript software renderer (`CrispSwContext` interacting with `SWRenderer*` classes) by comparing its output directly against the browser's native HTML5 Canvas API (`CanvasRenderingContext2D`). Unlike the "Low-Level SW Renderer Tests," these tests define scenes using **higher-level, Canvas API-like function calls** (e.g., `ctx.fillRect`, `ctx.strokeLine`) rather than creating abstract shape objects.

The focus is often on scenarios where pixel-perfect alignment and crisp rendering are critical, such as axis-aligned shapes, 1px lines, and specific coordinate positioning (e.g., centered on physical pixels vs. between physical pixels).

The tests run in the browser via `tests/browser-tests/high-level-tests.html`.

## How the Tests Work

The testing system reuses several key components from the low-level tests but employs a different mechanism for scene definition and rendering initiation:

1.  **`RenderTest` (`src/RenderTest.js`): The Test Runner UI & Orchestrator**
    *   Largely the same role as in the low-level tests. Each instance represents a single test case on the HTML page.
    *   **UI Management:** Creates and manages HTML elements (SW Canvas, HTML5 Canvas, Comparison Canvas, labels, buttons, log, checks, errors). The comparison canvas alternates between showing the SW and native Canvas output, and also provides a side-by-side magnified pixel view on mouse hover.
    *   **Rendering Orchestration:** Coordinates the rendering process differently:
        *   Instead of taking a `buildShapesFn`, it takes a `canvasCodeFn` (via `RenderTestBuilder.runCanvasCode`).
        *   It calls the `canvasCodeFn` *twice* per iteration:
            *   Once with a `CrispSwContext` instance (the software renderer).
            *   Once with a standard `CanvasRenderingContext2D` instance (the native reference).
        *   **Important:** It captures the **return value** from the *first* call (the one with `CrispSwContext`) and stores it in `this.builderReturnValue`. If the returned object has a `checkData` property, that property's value is stored; otherwise, the entire return object is stored. This allows checks to verify geometry or other properties calculated during the drawing process.
        *   It updates the on-screen canvases using the rendering results (transferring SW renderer data via `crispSwCtx.blitToCanvas`, which uses `ImageData` internally).
    *   **Check Execution:** If configured, runs checks (`RenderChecks`) on the rendered outputs *after* both canvases have been drawn. Checks like `withExtremesCheck` now use the stored `this.builderReturnValue`.
    *   **State Management & Registration:** Handles iterations, comparison view, error tracking, and registration in `RenderTest.registry`.

2.  **`RenderTestBuilder` (`src/RenderTestBuilder.js`): Fluent Test Configuration**
    *   Provides the same builder pattern for configuring `RenderTest` instances.
    *   Key difference: Uses `.runCanvasCode(drawingFn)` instead of `.addShapes()`.
        *   `runCanvasCode` specifies the drawing function (typically defined within the same test file) that contains the actual Canvas API-like drawing calls. Any additional arguments needed by the drawing function are typically handled via closures when defining it.
        *   `RenderTest` will later call this `drawingFn` with the appropriate context (`CrispSwContext` or `CanvasRenderingContext2D`) and store its return value.
    *   Methods like `withId()`, `withTitle()`, `withDescription()`, and `with*Check()` work similarly. Checks that need external data (like `withExtremesCheck`) are configured the same way but rely on the `drawingFn`'s return value being captured by `RenderTest`.
    *   `build()`: Finalizes configuration, creates, and registers the `RenderTest` instance.

3.  **`RenderChecks` (`src/RenderChecks.js`): Image Analysis & Verification**
    *   Contains the core logic for analyzing pixel data from both canvases. Its role is unchanged.
    *   Takes a `RenderTest` instance to access canvas contexts and report errors.
    *   Provides methods like `findExtremesWithTolerance()`, `checkExtremes()`, `checkCountOfUniqueColorsInLine()`, `compareWithThreshold()`, etc.
    *   When a check like `checkExtremes()` is executed, it retrieves the *expected* values from `test.builderReturnValue` (which originated from the `drawingFn`'s return value).

4.  **Test Files (`tests/browser-tests/high-level-tests/*--test.js`): Drawing and Definition**
    *   Each test resides in its own file within the `tests/browser-tests/high-level-tests/` directory, named according to convention (e.g., `lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient--test.js`).
    *   **Drawing Function:** Each file contains a drawing function (e.g., `draw_lines__...`) that encapsulates the drawing logic using Canvas API-like calls.
        *   **Signature:** `function draw_...(ctx, currentIterationNumber, ...args)`.
        *   `ctx` is the rendering context (`CrispSwContext` or `CanvasRenderingContext2D`).
        *   `currentIterationNumber` is available if needed.
        *   Uses `SeededRandom.getRandom()` internally for randomness.
        *   **Returns** an object with data needed for checks (e.g., `{ leftX, rightX, topY, bottomY }`). Optionally, this object can have a `checkData` property, and the test runner will specifically use the value of `checkData` for the checks if it exists.
    *   **Definition Function:** Each file also contains a definition function (e.g., `define_lines__...`) that uses `RenderTestBuilder` to configure the test, linking to the drawing function via `.runCanvasCode()`.
    *   **Self-Registration:** The definition function is called at the end of the script, causing the test to be registered automatically when the file is loaded by the browser.

5.  **Test Loading (`tests/browser-tests/high-level-tests.html`)**
    *   The main HTML file includes the core framework scripts (utils, `RenderTest`, `RenderTestBuilder`, `RenderChecks`, `CrispSwContext`, renderers, etc.).
    *   It then includes each individual test file (`*--test.js`) via separate `<script>` tags.
    *   There is no separate "loading" script; the act of loading the test file scripts registers the tests.
    *   An event listener calls `RenderTest.createNavigation()` after the DOM is loaded.

6.  **Rendering Contexts & Logic (`CrispSwContext`, `CanvasRenderingContext2D`, `src/renderers/`)**
    *   `CrispSwContext` (`src/crisp-sw-canvas/CrispSwContext.js`): Provides the Canvas API-like interface for the software renderer. It internally uses specific `SWRenderer*` classes (`src/renderers/sw-renderer/`) to draw to its framebuffer.
    *   `CanvasRenderingContext2D`: The browser's native implementation, used for the reference rendering.
    *   `src/renderers/canvas-renderer/`: Contains helpers potentially used by checks or visualization, but not typically by the main `runCanvasCode` path.
    *   `src/shared-renderer.js`: *Not typically used* in the main rendering path for High-Level Tests.

**Execution Flow Summary (Browser - High-Level Tests):**

1.  `high-level-tests.html` is loaded.
2.  Core JS files (utils, CrispSwContext, renderers, test framework core) are loaded.
3.  Individual test files (`tests/browser-tests/high-level-tests/*--test.js`) are loaded one by one.
4.  As each test script loads:
    *   It defines its `draw_...` and `define_...` functions.
    *   It calls its `define_...` function.
    *   The `define_...` function uses `RenderTestBuilder` -> sets ID/Title/Desc -> calls `.runCanvasCode(draw_...)` -> adds checks -> calls `.build()`.
    *   The `RenderTest` constructor registers the test (`RenderTest.registry[id] = this`) and creates its DOM elements.
    *   The `RenderTest` constructor calls its `render()` method for an initial display.
5.  Initial `render()` / `renderInBrowser(null, canvasCodeFn)` execution for each test:
    *   Clears canvases.
    *   Seeds `SeededRandom`.
    *   Calls `drawingFn(this.crispSwCtx, ...)` -> stores return value (or its `checkData` property).
    *   Displays SW result via `crispSwCtx.blitToCanvas`.
    *   Seeds `SeededRandom` again.
    *   Calls `drawingFn(this.canvasCtxOfCanvasRender, ...)`.
    *   Updates comparison canvas.
    *   Runs configured checks (accessing stored return value if needed).
6.  After all scripts are loaded and the DOM is ready, `DOMContentLoaded` fires.
7.  `RenderTest.createNavigation()` builds the top navigation using the populated `RenderTest.registry`.
8.  The page displays all test instances. Users interact via buttons, triggering further `render()` calls.