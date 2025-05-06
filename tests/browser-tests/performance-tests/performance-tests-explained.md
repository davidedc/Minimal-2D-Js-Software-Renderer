# Performance Tests Explained

This document provides a detailed explanation of how the performance test suite (`tests/browser-tests/performance-tests.html`) works. The goal of this suite is to compare the rendering performance of the custom Software Canvas (`crisp-sw-canvas`) against the standard browser HTML5 Canvas API.

## Overview

The test suite determines the maximum number of shapes (lines, rectangles, circles) each rendering engine (Software Canvas vs. HTML5 Canvas) can draw within a calculated frame budget (derived from the display's refresh rate). It achieves this using a "ramp-up" methodology, incrementally increasing the number of shapes drawn per frame until the rendering time consistently exceeds the budget.

## Key Files

*   `performance-tests.html`: The main HTML file that sets up the page structure, includes necessary scripts, and defines basic styles and element IDs.
*   `performance-tests/performance-ui.js`: Handles dynamic UI generation (test lists, buttons), user interactions (running tests, toggling options), and overall test flow orchestration.
*   `performance-tests/performance-utils.js`: Contains core testing logic, including refresh rate detection, the ramp-up testing functions for both canvases, results calculation/display, and chart generation.
*   `performance-tests/test-definitions.js`: Defines the available tests, linking test IDs to display names and the specific drawing functions.
*   `performance-tests/*--test.js`: Individual test files, each containing the `drawFunction` for a specific shape type, style, and configuration (e.g., `circles--M-size--opaque-fill--no-NA-stroke--random-pos--random-orient--test.js`). These files are loaded directly by `performance-tests.html`.
*   `../../src/scene-creation/SeededRandom.js`: A utility for generating pseudo-random numbers based on a seed, ensuring that the positions and orientations of shapes are consistent across different test runs and between the two canvases for a fair comparison.

## Workflow Breakdown

1.  **Initialization (`performance-ui.js::initializeUI`)**:
    *   The page loads `performance-tests.html`.
    *   `performance-ui.js` takes over the UI setup.
    *   Canvases are initially hidden.
    *   `generateTestButtons` reads the `TESTS` object from `test-definitions.js` and dynamically creates the UI:
        *   Sections for Lines, Rectangles, and Circles.
        *   Within each section, a list of test items is generated, each with a checkbox, a label (`displayName` from `test-definitions.js`), and an individual "Run" button.
        *   "Check/Uncheck All" buttons are added for each section and globally.
    *   Event listeners are attached to all buttons and controls.
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
    *   **Seeding**: `SeededRandom.seedWithInteger(currentPhaseStep)` ensures the same sequence of shapes is drawn at each step.
    *   **Drawing**:
        *   The canvas is cleared (`clearRect`).
        *   The appropriate `drawFunction` (from `test-definitions.js` via the `testType` parameter) is called with the `currentShapeCount`.
        *   For Software Canvas, `swCtx.blitToCanvas()` is called *if* `includeBlitting` is checked.
    *   **Timing**: `performance.now()` is used to measure the time taken for drawing (and potentially blitting).
    *   **Logging**: Results (`SW Canvas with X shapes: Y ms`) are logged based on the `quietMode` setting.
    *   **Budget Check**: The `elapsedTime` is compared to `FRAME_BUDGET`.
        *   **If Under Budget**: `consecutiveExceedances` is reset to 0, `currentShapeCount` is increased by the respective `incrementSize`, and the loop continues.
        *   **If Over Budget**: `consecutiveExceedances` is incremented.
            *   If `consecutiveExceedances < requiredExceedances`: The loop continues *with the same `currentShapeCount`* to see if the budget is exceeded consistently.
            *   If `consecutiveExceedances >= requiredExceedances`: The budget has been consistently exceeded. The `exceededBudget` flag is set, stopping the loop for this phase.
    *   **Completion**: When the loop stops (either by exceeding the budget consistently or via abortion), the `callback` is called.
    *   **Max Shapes Calculation (`findMaxShapes`)**: After a phase completes, this function determines the "maximum shapes". Since the test stops *after* exceeding the budget `requiredExceedances` times at a certain shape count (`N`), the maximum *successful* shape count is considered to be `N`.

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

This detailed workflow allows for flexible and reasonably accurate performance comparisons between the two rendering methods under various configurable conditions. 