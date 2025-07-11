## High-Level Tests: Overview

Historically, this project was previously tested with three different types of tests

* "low level tests" (run at high-level-tests.html, or without a browser, via the node harness): these bypassed the CrispSwContext and directly tested the visual appearance of shapes as drawn by low level sw rendering routines - comparing it with the result of HTML5Canvas. These low level routines would know nothing about clipping and nothing about transformations for example - they would just draw things at some coordinates. These tests were also handy because the project started from these primitives, so there was no CrispSwContext to lean on.
* "organic tests" (run at crisp-sw-canvas-tests.html): these were introduced later and indeed used CrispSwContext. They allowed to use invocations similar to HTML5Canvas ones and allowed to compare with HTML5Canvas. One could test clipping and transformations this way.
* "performance tests" (run at performance-tests-legacy.html): these used CrispSwContext and focused on drawing an increasing number of primitives over time, until the frame budget was exhausted. The same would be done using a standard HTML5Canvas, and a comparison is made.

This worked well, however this entailed three sets of tests and hence would be expensive to maintain. So I decided to side-step the isolated testing of the low level rendering primitives (i.e. abandoning the low level tests), as these could be indirectly tested by using CrispSwContext anyways, and focus on a single type of tests called "high level tests" which would contain one test definition that comprised both a way to visually test things, and also a loop to draw increasingly many instances of the test, and hence they would work as performance tests too.

So, all in all there are two goals of these tests is

1. to **verify the correctness and visual fidelity** of the custom JavaScript software renderer (`CrispSwContext` interacting with `SWRenderer*` classes) by comparing its output directly against the browser's native HTML5 Canvas API (`CanvasRenderingContext2D`). Unlike the "Low-Level SW Renderer Tests," these tests define scenes using **higher-level, Canvas API-like function calls** (e.g., `ctx.fillRect`, `ctx.strokeLine`) rather than creating abstract shape objects.
   The focus is often on scenarios where pixel-perfect alignment and crisp rendering are critical, such as axis-aligned shapes, 1px lines, and specific coordinate positioning (e.g., centered on physical pixels vs. between physical pixels).
   These tests run in the browser via `tests/browser-tests/high-level-tests.html`, or without a browser, via the node harness.
2. to also do **performance tests**. These work off the same code, they usually just repeat the drawing of the base case multiple times. These can be run at performance-tests.html.



## How the Tests Work

The testing system reuses several key components from the low-level tests but employs a different mechanism for scene definition and rendering initiation:

1.  **`RenderTest` (`src/RenderTest.js`): The Test Runner UI & Orchestrator**
    *   Largely the same role as in the low-level tests. Each instance represents a single test case on the HTML page.
    *   **UI Management:** Creates and manages HTML elements (SW Canvas, HTML5 Canvas, Comparison Canvas, labels, buttons, log, checks, errors). The comparison canvas alternates between showing the SW and native Canvas output, and also provides a side-by-side magnified pixel view on mouse hover.
    *   **Rendering Orchestration:** Coordinates the rendering process differently:
        *   Instead of taking a `buildShapesFn`, it takes a `canvasCodeFn` (provided via `registerHighLevelTest()` registration).
        *   It calls the `canvasCodeFn` *twice* per iteration:
            *   Once with a `CrispSwContext` instance (the software renderer).
            *   Once with a standard `CanvasRenderingContext2D` instance (the native reference).
        *   **Important:** It captures the **return value** from the *first* call (the one with `CrispSwContext`) and stores it in `this.builderReturnValue`. If the returned object has a `checkData` property, that property's value is stored; otherwise, the entire return object is stored. This allows checks to verify geometry or other properties calculated during the drawing process.
        *   It updates the on-screen canvases using the rendering results (transferring SW renderer data via `crispSwCtx.blitToCanvas`, which uses `ImageData` internally).
    *   **Check Execution:** If configured, runs checks (`RenderChecks`) on the rendered outputs *after* both canvases have been drawn. Checks like `withExtremesCheck` now use the stored `this.builderReturnValue`.
    *   **State Management & Registration:** Handles iterations, comparison view, error tracking, and registration in `RenderTest.registry`.

2.  **Test Registration (`tests/browser-tests/test-utils/test-registration-utils.js`): Unified Test Configuration**
    *   High-level tests use `registerHighLevelTest()` for a streamlined registration process instead of the more complex `RenderTestBuilder` pattern.
    *   The registration function takes:
        *   Test ID (matching the filename)
        *   Drawing function reference (`drawTest`)
        *   Category for grouping (e.g., 'lines', 'rectangles', 'circles')
        *   Configuration object (checks, comparison settings, drawing function arguments)
        *   Metadata object (title, description, display name for performance tests)
    *   Creates and configures a `RenderTest` instance automatically with the specified settings.

3.  **`RenderChecks` (`src/RenderChecks.js`): Image Analysis & Verification**
    *   Contains the core logic for analyzing pixel data from both canvases. Its role is unchanged.
    *   Takes a `RenderTest` instance to access canvas contexts and report errors.
    *   Provides methods like `findExtremesWithTolerance()`, `checkExtremes()`, `checkCountOfUniqueColorsInLine()`, `compareWithThreshold()`, etc.
    *   When a check like `checkExtremes()` is executed, it retrieves the *expected* values from `test.builderReturnValue` (which originated from the `drawTest` function's return value).

4.  **Test Files (`tests/browser-tests/test-cases/*--test.js`): Drawing and Registration**
    *   Each test resides in its own file within the `tests/browser-tests/test-cases/` directory, named according to convention (e.g., `line-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-edgeCrisp-ornHoriz-test.js`).
    *   **Drawing Function:** Each file contains a uniform drawing function `drawTest` that encapsulates the drawing logic using Canvas API-like calls.
        *   **Signature:** `function drawTest(ctx, currentIterationNumber, instances = null)`.
        *   `ctx` is the rendering context (`CrispSwContext` or `CanvasRenderingContext2D`).
        *   `currentIterationNumber` is available if needed.
        *   `instances` is null for visual testing, or a positive number for performance testing.
        *   Uses `SeededRandom.getRandom()` internally for randomness.
        *   **Returns** an object with data needed for checks (e.g., `{ leftX, rightX, topY, bottomY }`). Optionally, this object can have a `checkData` property, and the test runner will specifically use the value of `checkData` for the checks if it exists.
    *   **Test Registration:** Each file uses `registerHighLevelTest()` to register the test, providing the test ID, drawing function reference, category, configuration, and metadata.
    *   **Self-Registration:** The `registerHighLevelTest()` call happens when the script loads, causing the test to be registered automatically when the file is loaded by the browser.

5.  **Test Loading (`tests/browser-tests/high-level-tests.html`)**
    *   The main HTML file includes the core framework scripts (utils, `RenderTest`, `RenderChecks`, `CrispSwContext`, renderers, test registration utilities, etc.).
    *   It then includes each individual test file (`*--test.js`) via separate `<script>` tags.
    *   There is no separate "loading" script; the act of loading the test file scripts registers the tests via `registerHighLevelTest()` calls.
    *   An event listener calls `RenderTest.createNavigation()` after the DOM is loaded.

6.  **Rendering Contexts & Logic (`CrispSwContext`, `CanvasRenderingContext2D`, `src/renderers/`)**
    *   `CrispSwContext` (`src/crisp-sw-canvas/CrispSwContext.js`): Provides the Canvas API-like interface for the software renderer. It internally uses specific `SWRenderer*` classes (`src/renderers/sw-renderer/`) to draw to its framebuffer.
    *   `CanvasRenderingContext2D`: The browser's native implementation, used for the reference rendering.
    *   `src/renderers/canvas-renderer/`: Contains helpers potentially used by checks or visualization, but not typically by the main drawing execution path.
    *   `src/shared-renderer.js`: *Not typically used* in the main rendering path for High-Level Tests.

**Execution Flow Summary (Browser - High-Level Tests):**

1.  `high-level-tests.html` is loaded.
2.  Core JS files (utils, CrispSwContext, renderers, test framework core) are loaded.
3.  Individual test files (`tests/browser-tests/test-cases/*--test.js`) are loaded one by one.
4.  As each test script loads:
    *   It defines its `drawTest` function.
    *   It calls `registerHighLevelTest()` with the test configuration.
    *   The registration function creates a `RenderTest` instance and registers it in the test registry.
    *   The `RenderTest` constructor creates DOM elements and calls its `render()` method for an initial display.
5.  Initial `render()` execution for each test:
    *   Clears canvases.
    *   Seeds `SeededRandom`.
    *   Calls `drawTest(this.crispSwCtx, ...)` -> stores return value (or its `checkData` property).
    *   Displays SW result via `crispSwCtx.blitToCanvas`.
    *   Seeds `SeededRandom` again.
    *   Calls `drawTest(this.canvasCtxOfCanvasRender, ...)`.
    *   Updates comparison canvas.
    *   Runs configured checks (accessing stored return value if needed).
6.  After all scripts are loaded and the DOM is ready, `DOMContentLoaded` fires.
7.  `RenderTest.createNavigation()` builds the top navigation using the populated `RenderTest.registry`.
8.  The page displays all test instances. Users interact via buttons, triggering further `render()` calls.