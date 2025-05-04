# Node.js Test Runner (`node-test-runner.js`) Analysis

This document analyzes the `node-test-runner.js` script, which is designed to execute rendering tests for the Minimal-2D-Js-Software-Renderer project within a Node.js environment, bypassing the need for a browser.

## Purpose

The primary goal of this script is to provide a command-line interface for running various rendering tests defined elsewhere (likely concatenated from `add-tests.js` and other source files during the build process). It allows developers to:

1.  List available tests.
2.  Run specific tests or all tests.
3.  Run tests for single or multiple iterations.
4.  Compare software renderer output against expected results or perform internal checks.
5.  Save test results, including output images (BMP format) and log files.

## Dependencies

*   **Node.js built-in modules:** `fs` (file system), `path`, `process` (for arguments and exit codes).
*   **Internal Components (Concatenated):**
    *   `RenderTest`: The core class representing a single test case. It handles setup, rendering (mocking canvas elements for Node.js), and check execution.
    *   `RenderTestBuilder`: A utility class to define and build `RenderTest` instances.
    *   `RenderChecks`: A class containing methods to perform various checks on the rendered output (e.g., color counts, continuity, extremes).
    *   `SeededRandom`: A class for generating pseudo-random numbers based on a seed, ensuring reproducibility.
    *   `CrispSwCanvas` / `CrispSwContext`: (Likely) Classes mimicking the HTML5 Canvas API for the software renderer.
    *   Shape Rendering Classes (`SWRenderer*`): Classes responsible for drawing specific shapes (lines, rects, circles, etc.) in the software renderer.
    *   Test Definition Functions (`add*Test`, `loadLowLevelRenderTests`): Functions (likely from `add-tests.js`) that use `RenderTestBuilder` to define and register individual tests in `RenderTest.registry`.
    *   Polyfills (`ImageData`): Browser API polyfills necessary for Node.js execution.
    *   Utility Functions: Various helper functions for geometry, color manipulation, etc.

## Command-Line Interface (CLI)

The script uses a simple argument parser to handle command-line options:

*   `-l`, `--list`: Lists all available test IDs and their titles registered in `RenderTest.registry`.
*   `-i`, `--id <id>`: Specifies the ID of a single test to run.
*   `--iteration <num>`: Runs the specified test ID for a single, specific iteration number.
*   `-c`, `--count <num>`: Runs the specified test ID for `<num>` iterations (starting from 1).
*   `-r`, `--range <start-end>`: Runs the specified test ID for iterations within the given range (inclusive).
*   `-p`, `--progress`: Shows a progress indicator when running multiple iterations or the `--test` suite.
*   `-o`, `--output <dir>`: Specifies the directory to save output images (BMP) and result text files. Defaults to `./test-output`. Test-specific subdirectories are created within this directory when using `--test`.
*   `-t`, `--test`: Runs one iteration (`#1`) for *all* registered tests. This is the main mode for running the entire test suite.
*   `-v`, `--verbose`: Enables detailed logging during test execution, including individual iteration pass/fail status and error messages.
*   `-h`, `--help`: Displays the help message and exits.

**Examples:**

```bash
# List all tests
node build/node-test-runner.js --list

# Run iteration 5 of the 'thin-black-lines-2' test
node build/node-test-runner.js --id=thin-black-lines-2 --iteration=5

# Run the full test suite (iteration 1 for all tests) and save output
node build/node-test-runner.js --test --output=./test-output -v

# Run 100 iterations of the 'random-circles' test with progress
node build/node-test-runner.js --id=random-circles --count=100 --progress

# Run iterations 1 through 5 for 'all-shapes'
node build/node-test-runner.js --id=all-shapes --range=1-5
```

## Execution Flow

1.  **Initialization:** The script starts, and the concatenated code defines necessary classes (`RenderTest`, etc.) and polyfills. The `loadLowLevelRenderTests()` function (or similar) is called, which uses `RenderTestBuilder` to instantiate and register all defined tests into the static `RenderTest.registry`.
2.  **Argument Parsing:** `parseArgs` processes `process.argv` to determine the user's intent (list tests, run specific tests, run all tests, etc.).
3.  **Test Selection:**
    *   If `--list`, it prints the registry keys and exits.
    *   If `--test`, it retrieves all test IDs from `RenderTest.registry`.
    *   If `--id`, it retrieves the specific `RenderTest` instance from the registry.
4.  **Iteration Definition:** Based on `--iteration`, `--count`, `--range`, or the default (or `--test`), it determines the specific iteration number(s) to run.
5.  **Test Execution Loop:**
    *   It iterates through the selected tests and iteration numbers.
    *   For each test and iteration:
        *   It calls the `test.render()` method, passing the `buildShapesFn` or `canvasCodeFn` and the `iterationNum`.
        *   Inside `render()`, the `RenderTest` instance (in Node.js mode):
            *   Clears the internal frame buffer (`frameBufferUint8ClampedView`, `frameBufferUint32View`).
            *   Calls the test's `buildShapesFn` or `canvasCodeFn` to generate the scene or draw directly using the software renderer context (`CrispSwContext` or direct buffer manipulation). `SeededRandom.seedWithInteger()` is used with the iteration number for deterministic results.
            *   Calls the test's `functionToRunAllChecks` (if defined), which executes various checks using `RenderChecks` on the `frameBufferUint8ClampedView`.
            *   Errors are tracked in `test.errorCount` and `test.errors`.
        *   The success/failure status is returned based on the error count.
6.  **Output Generation:** If the `--output` option is provided:
    *   `saveOutputImage()` is called, which uses `test.exportBMP()` to generate a BMP file from the `frameBufferUint8ClampedView` and save it.
    *   `saveTestResults()` creates a text file summarizing the test run, including errors and check results.
7.  **Reporting:** The script prints progress (if requested), logs failures, and provides a final summary (total tests, passed, failed).
8.  **Exit Code:** The script exits with code 0 if all tests passed or code 1 if any test failed.

## Key Classes/Functions in Node.js Context

*   **`RenderTest`:** Manages a single test case. In Node.js, it mocks canvas elements, uses an ArrayBuffer (`frameBufferUint8ClampedView`/`frameBufferUint32View`) for rendering, and coordinates shape building/drawing and checks.
*   **`RenderChecks`:** Performs analysis on the raw pixel data in the frame buffer.
*   **`saveOutputImage`/`exportBMP`:** Handles the conversion of the internal frame buffer to a BMP file format using the `ImageData` polyfill's `toBMP()` method.
*   **`saveTestResults`:** Formats and saves the outcome of a test iteration to a text file.
*   **`main`:** Orchestrates the overall execution based on parsed arguments.
*   **`parseArgs`:** Handles command-line argument parsing.
*   **`printHelp`:** Displays usage instructions. 