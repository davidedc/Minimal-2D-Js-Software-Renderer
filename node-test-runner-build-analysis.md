# `node-test-runner.js` Build Process Analysis

This document analyzes how the `node-test-runner.js` file is constructed by the build scripts.

## Build Script

The primary script responsible for building `node-test-runner.js` is `build-scripts/build-node-test-runner-simple-concat.sh`.

## Mechanism: Simple Concatenation

As the script name suggests, the build mechanism is **direct file concatenation**. It does *not* involve complex module resolution (like CommonJS `require` or ES Modules `import`/`export` followed by bundling with tools like Webpack or Rollup). Instead, it relies on the specific order of concatenation to ensure that classes and functions are defined before they are used.

## Build Steps (`build-node-test-runner-simple-concat.sh`)

1.  **Set Strict Mode (`set -e`):** The script exits immediately if any command fails.
2.  **Determine Project Root:** Finds the root directory of the project relative to the script's location.
3.  **Ensure Build Directory:** Creates the `build/` directory if it doesn't exist (`mkdir -p`).
4.  **Define Output File:** Sets the target output path to `PROJECT_ROOT/build/node-test-runner.js`.
5.  **Clear Existing File:** Removes any previous version of the output file (`rm -f`).
6.  **Concatenate Files (in order):** The core of the build process. It uses `cat "$file" >> "$OUTPUT_FILE"` repeatedly to append the contents of various source files to the `node-test-runner.js` output file. The order is crucial:
    *   **Node Polyfills:** `src/crisp-sw-canvas/node-polyfills.js` (Provides browser APIs like `ImageData` needed in Node.js).
    *   **Core Utilities:** Files from `src/utils/` (e.g., `geometry.js`, `random-utils.js`, `PixelSet.js`, `ScanlineSpans.js`).
    *   **Shared Renderer Files:** `src/shared-renderer.js` and `src/renderers/renderer-utils.js`.
    *   **Software Renderer Files:** All `.js` files from `src/renderers/sw-renderer/` (e.g., `SWRendererPixel.js`, `SWRendererLine.js`, etc.).
    *   **Scene Creation Files:** All `.js` files from `src/scene-creation/` (e.g., `add-random-lines.js`, `add-random-rectangles.js`, etc.).
    *   **Test Framework Files:**
        *   `src/RenderChecks.js`
        *   `src/RenderTest.js`
        *   `src/RenderTestBuilder.js`
        *   `src/add-tests.js` (Contains the functions that define specific tests like `addBlackLinesTest`).
        *   `tests/low-level-renderer-tests-loading.js` (Likely calls the functions in `add-tests.js` to register them).
        *   `src/node-test-runner-base.js` (Contains the core logic of the test runner: argument parsing, test execution loop, output saving, etc.).
7.  **Append Main Function Call:** Adds `main();` to the end of the script to start the execution flow defined in `node-test-runner-base.js`.
8.  **Make Executable:** Sets the execute permission on the output file (`chmod +x`).
9.  **Log Success:** Prints confirmation messages to the console.

## Role of `build-common.sh`

While `build-common.sh` contains helper functions for building (like `get_version`, `concatenate_files`, `add_node_exports`, `minify_js`), the specific `build-node-test-runner-simple-concat.sh` script *does not source or use* these common functions. It implements its own simpler, direct concatenation logic.

## Result

The output is a single, large JavaScript file (`build/node-test-runner.js`) containing all the necessary code (polyfills, utilities, renderers, test framework, test definitions, runner logic) in the correct order to be executed directly by Node.js (`node build/node-test-runner.js ...`).

## Advantages of this Approach

*   **Simplicity:** Avoids the complexity of setting up bundlers or managing module dependencies explicitly.
*   **Self-Contained:** The output file includes everything needed to run the tests.

## Disadvantages

*   **Order Dependency:** The build relies heavily on the manually defined concatenation order. Adding or reordering files requires careful updates to the build script.
*   **Global Scope:** All code effectively runs in the same scope, increasing the risk of naming collisions.
*   **Scalability:** Can become difficult to manage as the number of source files grows.
*   **No Tree Shaking:** The entire codebase is included, even if parts are not strictly needed for a specific test run. 