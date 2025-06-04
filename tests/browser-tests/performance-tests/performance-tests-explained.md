# Performance Tests Explained

This document provides a detailed explanation of how the performance test suite (`tests/browser-tests/performance-tests.html`) works. The goal of this suite is to compare the rendering performance of the custom Software Canvas (`crisp-sw-canvas`) against the standard browser HTML5 Canvas API.

## Overview

The test suite determines the maximum number of shapes (lines, rectangles, circles, or any other primitives drawn by the tests) each rendering engine (Software Canvas vs. HTML5 Canvas) can draw within a calculated frame budget. This budget is derived from the display's refresh rate. The suite uses a "ramp-up" methodology, incrementally increasing the number of shapes (or "instances" as per the drawing function) drawn per frame until the rendering time consistently exceeds the budget.

## Key Files & Concepts

*   `performance-tests.html`: The main HTML file. It sets up the page structure, includes necessary library and utility scripts, initializes a global `window.PERFORMANCE_TESTS_REGISTRY = []` array, loads individual test scripts from the `tests/browser-tests/test-cases/` directory, and finally loads the UI script.
*   `tests/browser-tests/test-cases/*--test.js`: These are the individual test script files, originally designed for high-level visual regression testing. For use in the performance suite, they have been augmented with a self-registration mechanism (see below).
    *   **Self-Registration**: Each test script checks for the existence of `window.PERFORMANCE_TESTS_REGISTRY`. If present, the script pushes an object detailing its performance test metadata (ID, drawing function reference, display name, description, category) into this registry.
    *   **Drawing Function Signature**: The core drawing functions within these files (e.g., `draw_some_shape_test(...)`) are expected to accept parameters like `(context, iterationNumber, instanceCount)`. The performance suite utilizes the `instanceCount` to control the number of items drawn.
*   `performance-tests/performance-ui.js`: Handles dynamic UI generation (test lists, buttons based on the content of `window.PERFORMANCE_TESTS_REGISTRY`), user interactions (running tests, toggling options), and overall test flow orchestration.
*   `performance-tests/performance-utils.js`: Contains core testing logic, including refresh rate detection, the ramp-up testing functions (`runSoftwareCanvasRampTest`, `runHTML5CanvasRampTest`) for both canvases, results calculation/display, and chart generation.
*   `../../src/scene-creation/SeededRandom.js`: A utility for generating pseudo-random numbers. While high-level tests might use it for their primary drawing logic, the performance ramp-up itself also uses it to ensure consistent conditions for each step of a given test type if not overridden by the test's internal logic.

## Workflow Breakdown

1.  **Initialization & Test Discovery**:
    *   `performance-tests.html` loads.
    *   It initializes `window.PERFORMANCE_TESTS_REGISTRY = [];`.
    *   It then loads various scripts from `tests/browser-tests/test-cases/`. As each of these scripts executes, its self-registration block (if present and correctly configured) adds its test definition to `window.PERFORMANCE_TESTS_REGISTRY`.
    *   Finally, `performance-ui.js` is loaded and `initializeUI()` is called.
    *   **UI Generation (`performance-ui.js::generateTestButtons`)**: This function now reads directly from `window.PERFORMANCE_TESTS_REGISTRY`.
        *   It iterates through the registered tests.
        *   Based on the `category` property of each test object (e.g., 'lines', 'rectangles', 'circles'), it creates sections in the UI.
        *   Within each section, a list of test items is generated, each with a checkbox, a label (from the test object's `displayName`), and an individual "Run" button.
        *   Global and per-section "Check/Uncheck All" buttons are also created.
    *   Event listeners are attached.
    *   **Refresh Rate Detection (`performance-utils.js::detectRefreshRate`)**:
        *   Before tests can run, the display's refresh rate is measured using `requestAnimationFrame` over ~20 frames.
        *   An average frame time is calculated, outliers are removed, and the raw FPS is determined.
        *   This raw FPS is snapped to the nearest standard refresh rate (e.g., 60, 120, 144 Hz) to get `DETECTED_FPS`.
        *   The `FRAME_BUDGET` (in milliseconds) is calculated: `1000 / DETECTED_FPS`. This is the target time limit for rendering a single frame.
        *   The detected FPS and calculated budget are displayed on the UI.
        *   Test controls are disabled until detection is complete.

2.  **Test Configuration (User Interaction)**:
    *   The user configures test parameters using the input fields:
        *   `SW Canvas increment size`: How many shapes to add per step for the Software Canvas test.
        *   `HTML5 Canvas increment size`: How many shapes to add per step for the HTML5 Canvas test (usually higher due to expected better performance).
        *   `SW/HTML5 Canvas start count`: The initial number of shapes to draw for each canvas type.
        *   `Consecutive budget exceedances`: How many times rendering must exceed the `FRAME_BUDGET` *consecutively* before the test for that shape count is considered failed, and the maximum shape count is determined. This prevents stopping due to occasional spikes.
        *   `Runs per test`: How many times to run each test phase (SW and HTML5) to get an average result, reducing variability.
    *   Toggles:
        *   `Include blitting time`: For Software Canvas, whether to include the time taken to copy the internal buffer to the visible canvas (`swCtx.blitToCanvas()`) in the total frame time.
        *   `Quieter mode`: Reduces console logging during tests, only showing key phase changes and final results. Useful for cleaner output, especially during long runs.
        *   `Enable Profiling Mode`: Sets a very high "Consecutive budget exceedances" value, effectively preventing the test from stopping early. This allows developers to use browser profiling tools on sustained rendering loads.

3.  **Running Tests (`performance-ui.js`)**:
    *   Tests can be initiated via:
        *   Individual "Run" buttons (`runTest(test)`).
        *   "Run Checked Tests" (`runCheckedTests` -> `runTestSeries(checkedTests)`).
        *   "Run All Tests" (`runAllTests` -> `runTestSeries(allTests)`).
    *   `runTestSeries`: Manages running multiple tests sequentially, updating overall progress bars and aggregating results for a final summary.
    *   `runTest`: Orchestrates a single test type (potentially averaged over multiple runs).
        *   Disables UI controls.
        *   Gets current configuration values.
        *   Clears previous results (unless part of a series).
        *   Initializes progress bars.
        *   If `numRuns > 1`:
            *   Calls `runSingleIteration` repeatedly.
            *   Accumulates `swMaxShapes` and `canvasMaxShapes` from each run.
            *   Calculates the average max shapes and the average ratio after all runs.
            *   Stores individual run ratios for display.
            *   Uses the *last* run's detailed timing data for the chart.
        *   If `numRuns === 1`:
            *   Calls `runSingleIteration` once.
            *   Uses the results directly.
        *   Calls `finalizeTest` upon completion or abortion.
    *   `runSingleIteration`: Executes one full pass of a test type:
        *   Calls `runSoftwareCanvasRampTest`.
        *   Calls `runHTML5CanvasRampTest`.
        *   Returns the results (`singleRunData`) for this iteration.

4.  **Ramp-Up Execution (`performance-utils.js`)**:
    *   `runSoftwareCanvasRampTest` / `runHTML5CanvasRampTest`: These functions implement the core ramp-up logic for each canvas type. They are very similar.
    *   **Loop**: The process runs within a `requestAnimationFrame` loop (`testNextShapeCount`).
    *   **Seeding**: `SeededRandom.seedWithInteger(currentPhaseStep)` is used by the ramp-up logic, though the individual high-level test draw functions might have their own internal seeding or randomization for shape variations if they draw multiple distinct items per "instance".
    *   **Drawing**:
        *   The canvas is cleared (`clearRect`).
        *   The appropriate `drawFunction` (referenced in the test object from `window.PERFORMANCE_TESTS_REGISTRY`) is called. The call signature is now adapted: `testType.drawFunction(context, 0, currentShapeCount)`. Here, `currentShapeCount` (from the ramp-up logic) is passed as the `instances` argument to the high-level test's drawing function. A dummy value like `0` is passed for the `iterationNumber` argument, as it's not typically used by the performance aspect of these functions.
        *   For Software Canvas, `swCtx.blitToCanvas()` is called *if* `includeBlitting` is checked.
    *   **Clipping in Performance Tests**:
        *   The application of clipping in performance tests depends on the nature of the original high-level visual test's `Count` facet (which describes the number of *drawn* shapes, not clipping shapes). This strategy is designed to distinguish between the performance cost of *defining* a clip versus *applying* an existing clip.
        *   **Scenario 1: Visual Test `Count` is `single` (for drawn shapes)**
            *   **Behavior**: If the corresponding visual test draws a single primary shape (or a single composition of shapes), and that test involves clipping, then in the performance test, a new clipping region is **defined and applied for each instance** of the drawn shape(s) as the `currentShapeCount` (i.e., `instances`) ramps up.
            *   **Effect**: This scenario heavily tests the setup cost of clipping (e.g., `ctx.save()`, path definition, `ctx.clip()`, `ctx.restore()`) because these operations are repeated for every drawn entity scaled by `instances`.
            *   The characteristics of the clipping region itself (shape, size, arrangement, etc.) are taken from the visual test's specific clipping facets.
        *   **Scenario 2: Visual Test `Count` is `multi*` (e.g., `multi-5`, `multi-10`, for drawn shapes)**
            *   **Behavior**: If the corresponding visual test draws multiple primary shapes, and that test involves clipping, then in the performance test, the clipping region is **defined once per frame**. All drawn shapes rendered within that frame (as their collective number or complexity is scaled by `instances`) are clipped against this single, pre-defined region.
            *   **Effect**: This scenario primarily tests the rendering cost of drawing primitives that are subject to an already active clipping region, thus emphasizing the "application" cost of the clip rather than its setup cost.
            *   The characteristics of the single clipping region (which might be complex, e.g., a grid of clipping shapes) are taken from the visual test's specific clipping facets.
        *   The drawing functions within the test case files (`*--test.js`) must implement the necessary logic to detect if they are in performance mode (via the `instances` parameter) and apply the correct clipping strategy based on their original `Count` classification for drawn shapes.
    *   **Timing**: `performance.now()` is used to measure the time taken for drawing (and potentially blitting and clipping operations).
    *   **Logging**: Results (`SW Canvas with X shapes: Y ms`) are logged based on the `quietMode` setting.
    *   **Budget Check**: The `elapsedTime` is compared to `FRAME_BUDGET`.
        *   **If Under Budget**: `consecutiveExceedances` is reset to 0, `currentShapeCount` is increased by the respective `incrementSize`, and the loop continues.
        *   **If Over Budget**: `consecutiveExceedances` is incremented.
            *   If `consecutiveExceedances < requiredExceedances`: The loop continues *with the same `currentShapeCount`* to see if the budget is exceeded consistently.
            *   If `consecutiveExceedances >= requiredExceedances`: The budget has been consistently exceeded. The `exceededBudget` flag is set, stopping the loop for this phase.
    *   **Completion**: When the loop stops (either by exceeding the budget consistently or via abortion), the `callback` is called.
    *   **Max Shapes Calculation (`findMaxShapes`)**: After a phase completes, this function determines the "maximum shapes". The test stops after consistently exceeding the budget `requiredExceedances` times at a certain shape count (let's call this `N`). `findMaxShapes` then returns this value `N`, which represents the shape count at which rendering could no longer stay within the budget. It is effectively the performance limit or failure threshold.

5.  **Results Reporting and Cleanup (`performance-utils.js`, `performance-ui.js`)**:
    *   `finalizeTest (`performance-ui.js`): Calculates final averages if multiple runs were performed.
    *   `displayRampTestResults` (`performance-utils.js`): Formats and displays the detailed results for the completed test (or averaged test) in the "Test Results" text area, including parameters, max shapes for each canvas, and the performance ratio. If averaged, it also shows individual run ratios.
    *   `generatePerformanceChart` (`performance-utils.js`): Uses the detailed timing data (`swShapeCounts`, `swTimings`, `canvasShapeCounts`, `canvasTimings`) from the *last* run to generate a line chart using the `<canvas>` element in the "chart-container". It plots render time (ms) against the number of shapes for both canvases and includes a line indicating the `FRAME_BUDGET`.
    *   `displayOverallResults` (`performance-utils.js`): If `runTestSeries` was used, this function displays a summary table and overall average performance across all completed tests.
    *   `resetTestState` (`performance-ui.js`): Re-enables UI controls, resets progress bars, clears abortion flags, and hides canvases.

## Aborting Tests

*   The "Abort" button becomes active when tests are running.
*   Clicking it sets the `abortRequested` flag (`performance-ui.js::abortTests`).
*   The `requestAnimationFrame` loops in `performance-utils.js` check this flag on each iteration and exit early if set.
*   Any active `animationFrameId` is cancelled.
*   State is reset, and an "aborted" message is shown.

This refactored workflow leverages the drawing capabilities of the `high-level-tests` directly, promoting code reuse and simplifying the process of adding new scenarios to the performance suite by focusing on a self-registration mechanism within the test files themselves.

This detailed workflow allows for flexible and reasonably accurate performance comparisons between the two rendering methods under various configurable conditions. 