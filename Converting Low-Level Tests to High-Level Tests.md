# Guide: Converting Low-Level Tests to High-Level Tests

This guide details the process of converting existing "low-level" rendering tests into the new "high-level" test format. These new high-level tests serve a dual purpose:
1.  **Visual Regression Testing**: Using `RenderTestBuilder` to define and run tests, comparing software renderer output against canvas output.
2.  **Performance Testing**: The same drawing logic can be hooked into the performance testing framework.

The goal is to consolidate testing efforts and leverage a more flexible and direct way of defining drawing logic using the Canvas API.

## Preamble: Understanding the Low-Level Test

Before starting the conversion, it's crucial to thoroughly understand the original low-level test.

*   **Behavior vs. Description**: Sometimes, a low-level test's descriptive name or comments might not perfectly align with what its underlying `shapeCreationFunction` *actually does* (e.g., an "Axis-Aligned Rectangle" test might internally use utilities that generate parameters suitable for a rounded rectangle, or apply unexpected default stroke widths).
    *   **Action**: Always examine the `shapeCreationFunction` (and any helper utilities it calls from `src/scene-creation/`, noting their own use of `SeededRandom` or global variables) to understand the true data generation logic and the actual parameters being used for drawing.
    *   **Decision Point**: If a discrepancy is found, decide whether to:
        1.  **Prioritize Original Behavior**: Replicate the original (potentially quirky) data generation and behavior for strict test-to-test parity. The JSDoc for your new high-level test should note if it inherits such quirks.
        2.  **Prioritize Description/Intent**: Implement the high-level test according to the clearer name or descriptive intent, effectively "fixing" or clarifying an old inconsistency. This makes the new test cleaner but means it might not be a 1:1 data replication of the old one.
    *   Clearly document your chosen approach in the JSDoc of your new `draw_...` function.
*   **Adherence to Naming Conventions and Guidelines**: Pay close attention to any established naming conventions (e.g., for file names, function names) and parameter guidelines (e.g., size categories like `S-size`, `M-size`, specific color palettes, stroke thickness ranges). If the high-level test's filename implies certain characteristics (like "M-size"), ensure the `draw_...` function generates parameters that conform to these documented guidelines. If such guidelines are in separate documents (e.g., a performance testing setup guide), consult them. This ensures consistency across the test suite.
*   **Understanding `checkData` Origin**: If the original test used `withExtremesCheck()`, investigate how the `checkData` was generated. If the `shapeCreationFunction` itself returned these values, replication is straightforward. If not, `RenderTestBuilder` might have calculated them based on the pushed shape data, which might require careful reverse-engineering or referencing existing similar converted tests to understand the expected coordinate system (e.g., inclusive pixel boundaries).

## Overview of the Conversion Process

The conversion involves translating the shape-generation logic from the old system (which often involved populating a `Scene` object with shape definitions) into a new JavaScript file that directly uses Canvas API calls within a dedicated drawing function.

Each low-level test, typically invoked by an `add<TestName>Test()` function in `src/add-tests.js`, will be converted into a new `.js` file within the `tests/browser-tests/test-cases/` directory.

## File Naming Convention

New test files should follow a descriptive naming convention, using `--` as a separator for major characteristics and `_` (or `-` where appropriate within a characteristic) for sub-characteristics. The file must end with `--test.js`.

Example: `lines--M-size--no-fill--1px_opaque_stroke--crisp_pixel_pos--horizontal_orient--test.js`
Another example: `circles--multi-12--precise--randparams--randpos--test.js`

Consult existing files in `tests/browser-tests/test-cases/` for more examples. Aim for names that clearly convey the core aspects of the test (shape type, count, key parameters/behaviors).

## Structure of a New High-Level Test File

Each new `...--test.js` file will typically have the following structure:

1.  **Local Helper Functions (Optional but Recommended)**: For complex tests, one or more static helper functions (e.g., `_calculateShapeParams_...`, `_placeShape_...`) can encapsulate parameter generation logic, especially for managing `SeededRandom` sequences and adapting logic from original helper utilities. These are usually prefixed with an underscore.
2.  **Drawing Function**: A function, conventionally named `draw_[description_matching_filename]`, that contains the actual Canvas API drawing logic.
3.  **Test Definition Function**: A function, conventionally named `define_[description_matching_filename]_test`, that uses `RenderTestBuilder` to configure and register the visual regression test.
4.  **Immediate Test Definition**: A call to the `define_..._test()` function to ensure the test is registered when the script loads.
5.  **Performance Test Registration**: A block of code to register the drawing function with `window.PERFORMANCE_TESTS_REGISTRY`.

```javascript
// Example Structure: my-shape--params--test.js

/**
 * @fileoverview Test definition for MyShape with specific parameters.
 * (Detailed JSDoc for the drawing function, as shown below, is highly recommended.
 * It should clearly explain parameters, return values, and behavior in different modes.)
 */

// Optional: Local helper function(s) for parameter generation if complex
/**
 * Calculates parameters for MyShape based on current iteration.
 * @param {number} currentIterationNumber For SeededRandom, if needed directly by this helper.
 * @param {number} canvasWidth Current canvas width.
 * @param {number} canvasHeight Current canvas height.
 * @returns {object} Object containing shape parameters (e.g., x, y, width, height, color, etc.)
 */
/*
function _calculateMyShapeParams(currentIterationNumber, canvasWidth, canvasHeight) {
    // ... use SeededRandom.getRandom(), canvasWidth, canvasHeight ...
    // return { x, y, size, color, etc. };
}
*/

/**
 * Draws MyShape with specific parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest, or passed to helpers).
 * // Add any custom arguments passed via RenderTestBuilder.runCanvasCode() here, before `instances`.
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. Its interpretation depends on the test's nature:
 *                  - For tests drawing a single archetype: typically an outer loop multiplier.
 *                    Each generated shape within the loop should have unique properties derived from
 *                    `SeededRandom.getRandom()` calls. For performance runs, an additional `Math.random()`
 *                    offset is usually applied to the position to spread shapes.
 *                  - For tests designed to draw a variable number of primitives (e.g., "N random lines"):
 *                    `instances` often directly dictates N.
 *                  - For tests drawing a fixed, complex scene (e.g., the original `buildScene`):
 *                    `instances` might control repetitions of the entire scene drawing logic (with varied seeds per scene repetition),
 *                    or scale a primary component of the scene (e.g., number of one type of shape).
 *                  This function's JSDoc must clearly state how `instances` is used.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks (if applicable, e.g. for withExtremesCheck
 *                  in single-instance mode), or null (especially for multi-instance/perf mode
 *                  or if no checks require data).
 */
function draw_my_shape__params(ctx, currentIterationNumber, /* customArg1, ..., */ instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = /* Determine based on isPerformanceRun and instances, see "Handling instances" section */;
    let logs = [];
    let checkData = null; // Or an object with initial values for aggregation if needed.

    // 1. Access canvas dimensions if needed for calculations:
    //    const canvasWidth = ctx.canvas.width;
    //    const canvasHeight = ctx.canvas.height;

    // 2. Loop `numToDraw` times if appropriate for the test type.
    for (let i = 0; i < numToDraw; i++) {
        // 2a. Generate ALL shape properties using SeededRandom.getRandom() in the exact original sequence.
        //     This might involve calling local helper functions like _calculateMyShapeParams.
        //     const params = _calculateMyShapeParams(currentIterationNumber, canvasWidth, canvasHeight);

        // 2b. For performance runs with multiple instances, apply Math.random() for positional spread
        //     *after* all SeededRandom-derived properties are set for the current instance.
        //     let finalX = params.x; let finalY = params.y;
        //     if (isPerformanceRun && numToDraw > 1) { // Or just `if (isPerformanceRun)` if `numToDraw` is always `instances`
        //          finalX = Math.random() * canvasWidth; finalY = Math.random() * canvasHeight;
        //     }
        
        // 2c. Implement drawing logic using ctx and calculated parameters.
        //     Example:
        //     ctx.fillStyle = params.color;
        //     ctx.fillRect(finalX, finalY, params.width, params.height);
        //     If using new context methods like ctx.fillCircle(), ensure parameters are correct.

        // 2d. If not isPerformanceRun (or only for the first item in perf run if needed for a baseline):
        //     Aggregate or set checkData if the test has .withExtremesCheck() or similar.
        //     Add to logs.
    }
    
    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData }; // checkData may be null if no checks require it.
}

/**
 * Defines and registers the MyShape test case.
 */
function define_my_shape__params_test() {
    return new RenderTestBuilder()
        .withId('my-shape--params') // Matches filename (without --test.js)
        .withTitle('MyShape: Params Test')
        .withDescription('Tests rendering of MyShape with specific parameters.')
        .runCanvasCode(draw_my_shape__params /*, any_extra_static_args_for_draw_function */)
        // Add checks migrated from the original low-level test
        // .withExtremesCheck() // If applicable, ensure draw_... returns appropriate checkData
        // .withColorCheckMiddleRow({ expectedUniqueColors: ... }) // If applicable
        // .withContinuousStrokeCheck({ ... }) // If applicable
        // .withNoGapsInFillEdgesCheck() / .withNoGapsInStrokeEdgesCheck()
        // .withSpecklesCheckOnSwCanvas()
        .compareWithThreshold(0, 0) // (0,0) in case of identical pixels expected. Or specific values from original test, or remove if default 0,0 is intended
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_my_shape__params_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_my_shape__params === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'my-shape--params', // Matches RenderTestBuilder ID
        drawFunction: draw_my_shape__params,
        displayName: 'Perf: MyShape Params', // Short name for UI
        description: 'Performance test for MyShape with specific parameters.',
        category: 'myShape' // General category (e.g., 'lines', 'rectangles', 'circles', 'arcs', 'scenes')
    });
}
```

## Step-by-Step Conversion Process

### 1. Identify the Low-Level Test and its Logic

*   **Locate the `add...Test()` function**: In `src/add-tests.js`, find the function that defines the low-level test you want to convert (e.g., `add1PxHorizontalLineCenteredAtPixelTest()`).
    ```javascript
    // Example from src/add-tests.js
    function add1PxHorizontalLineCenteredAtPixelTest() {
      return new RenderTestBuilder()
        .withId('centered-1px-horizontal-line')
        .withTitle('Single 1px Horizontal Line centered at pixel')
        // ...
        .addShapes(add1PxHorizontalLineCenteredAtPixel) // <--- This is the shape creation function
        .withExtremesCheck() // Note any checks and if they imply return values
        .build();
    }
    ```
*   **Identify the `shapeCreationFunction`**: Note the function passed to `.addShapes()` (e.g., `add1PxHorizontalLineCenteredAtPixel`). This function contains the core logic for defining the shape(s).
*   **Find the `shapeCreationFunction`'s definition**: These functions are usually located in `src/scene-creation/` directory, in files like `scene-creation-lines.js`, `scene-creation-rects.js`, etc.
    ```javascript
    // Example from src/scene-creation/scene-creation-lines.js
    // (This function might itself call other helpers from scene-creation-utils.js etc.)
    function add1PxHorizontalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
      // SeededRandom.seedWithInteger(currentIterationNumber); // Old way, DO NOT replicate this call directly in draw_ function
      const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
      const centerX = Math.floor(renderTestWidth / 2); // Old global
      const centerY = Math.floor(renderTestHeight / 2) + 0.5; // Old global
      return add1PxHorizontalLine(centerX, centerY, lineWidth, shapes, log); // Might call helpers that also use SeededRandom
    }

    function add1PxHorizontalLine(centerX, centerY, width, shapes, log) {
      // ... calculations ...
      const pixelY = Math.floor(centerY);
      shapes.push({ // <--- This is the shape data object
        type: 'line',
        start: { x: startX, y: centerY },
        end: { x: endX, y: centerY },
        thickness: 1,
        color: { r: 255, g: 0, b: 0, a: 255 }
      });
      // ... logging ...
      return { topY: pixelY, bottomY: pixelY, leftX, rightX: rightX - 1 }; // <--- Data for withExtremesCheck
    }
    ```

### 2. Create the New `draw_...` Function

This is the core of the conversion. You'll translate the logic from the old `shapeCreationFunction` (and its helpers) into direct Canvas API calls within your new `draw_...` function.

*   **JSDoc Importance**: It is crucial to provide a detailed JSDoc comment for your `draw_...` function. This JSDoc should clearly explain:
    *   All parameters, especially any custom arguments and how the `instances` parameter is interpreted (see "Handling `instances` for Performance" below).
    *   The structure and meaning of the returned object, particularly the `checkData` if present.
    *   Any notable behaviors, pre-conditions, or reliance on global helper functions (e.g., `getRandomColor`).
*   **Signature**: `function draw_your_description(ctx, currentIterationNumber, /* customArg1, ..., */ instances = null)`
    *   Any custom static arguments passed via `RenderTestBuilder.runCanvasCode()` (see Section 3) should appear in the signature before the optional `instances = null` parameter.
*   **Randomness**:
    *   Use `SeededRandom.getRandom()` directly for any randomized values (dimensions, positions, colors if applicable).
    *   **CRITICAL**: The *exact order and number* of all calls to `SeededRandom.getRandom()` in your new `draw_...` function (including calls made within any local helper functions it uses, or adapted global helpers) must precisely mirror the sequence of calls that occurred within the *entire scope of the original `shapeCreationFunction` and any helper functions it called that used `SeededRandom` for a single conceptual "shape" or "set of shapes"*. Any deviation in sequence will lead to different random values and a mismatch with the original test's output.
    *   If debugging complex sequences, consider temporarily adding logs in both the old and new code to print values from `SeededRandom.getRandom()` to trace the sequence.
    *   **Do not** call `SeededRandom.seedWithInteger(currentIterationNumber)` inside your `draw_` function or its local helpers. `RenderTest` (the test runner) handles seeding globally once before calling your `draw_` function for a given iteration. If the original `shapeCreationFunction` (or a top-level function it called like `buildScene`) re-seeded for different parts of its logic using the same `currentIterationNumber`, your `draw_...` function must replicate this re-seeding *at the equivalent points* if exact 1:1 visual parity across iterations is required for such complex tests.
*   **Canvas Dimensions**:
    *   Replace globals like `renderTestWidth` and `renderTestHeight` with `ctx.canvas.width` and `ctx.canvas.height`. Ensure these are passed to any adapted helper functions that need them.
*   **Logic Migration**:
    *   Replicate the calculations for coordinates, sizes, colors, etc., from the old function.
    *   **Pre-condition Checks**: Identify and migrate any necessary pre-condition checks from the original shape creation logic (e.g., `checkCanvasHasEvenDimensions()`). Adapt these to use `ctx.canvas.width/height` and decide whether to log a warning or throw an error if a precondition fails.
        ```javascript
        // Example: Pre-condition check inside draw_... function
        if (ctx.canvas.width % 2 !== 0 || ctx.canvas.height % 2 !== 0) {
            if (!isPerformanceRun) { // Avoid logging spam during performance tests
                logs.push('Warning: Canvas dimensions are not even. Crisp rendering might be affected.');
            }
            // Depending on severity, you might:
            // return { logs, checkData: null }; // or throw new Error('Canvas dimensions must be even');
        }
        ```
    *   If the old function called helper utilities (e.g., from `scene-creation-utils.js` or other `scene-creation` files):
        *   Their logic often needs to be **carefully adapted and potentially inlined** into your `draw_...` function or into local static helper functions within your test file. This adaptation is crucial and includes:
            *   Replacing any global variable access (like `renderTestWidth`, `renderTestHeight`) with context-specific values (e.g., `ctx.canvas.width`, `ctx.canvas.height`) passed as arguments.
            *   Ensuring that all calls to `SeededRandom.getRandom()` from the inlined/adapted logic are integrated into the *correct overall sequence* relative to other `SeededRandom` calls in your main `draw_...` function.
            *   Adjusting the helper's logic to directly use `ctx` for drawing or to return parameters compatible with direct canvas calls, rather than populating an intermediate `shapes` array or relying on a separate rendering engine.
        *   Alternatively, if a utility is simple, widely used, and already loaded by the test HTML pages (like `getRandomColor` from `random-utils.js`, or `adjustDimensionsForCrispStrokeRendering` from `scene-creation-utils.js`), you can call it directly if its output is suitable or can be easily adapted (see Color Conversion below). Ensure it doesn't have side effects (like re-seeding `SeededRandom`) that would break your sequence.
*   **Drawing Commands (Mapping `type` to `ctx` calls)**:
    *   The old `shapes.push({ type: '...', ... })` needs to be converted to direct `ctx` drawing method calls.
    *   **`CrispSwContext` does not support generic path building with `ctx.beginPath()`, `ctx.lineTo()`, `ctx.arc()`, etc., followed by a general `ctx.fill()` or `ctx.stroke()` on that path.** All drawing must be done using specific shape drawing methods (e.g., `ctx.fillRect()`, `ctx.strokeLine()`, `ctx.fillCircle()`, `ctx.strokeArc()`).
    *   **Color Conversion**: Shape properties like `strokeColor: { r, g, b, a }` or `fillColor` must be converted to CSS color strings for `ctx.strokeStyle` or `ctx.fillStyle` when using native canvas methods that rely on these properties (like the polyfills for `fillArc` that call `this.arc()` then `this.fill()`). For direct `CrispSwContext` methods like `ctx.fillCircle(..., r,g,b,a)`, color components are passed directly.
        *   A local helper like `function _colorObjectToString(colorObj) { if (!colorObj) return 'rgba(0,0,0,0)'; const alpha = (typeof colorObj.a === 'number') ? (colorObj.a / 255).toFixed(3) : 1; return \`rgba(\${colorObj.r},\${colorObj.g},\${colorObj.b},\${alpha})\`; }` is useful for setting `ctx.fillStyle` or `ctx.strokeStyle`.
    *   **`line`**:
        *   Use `ctx.strokeLine(x1, y1, x2, y2)` after setting `ctx.lineWidth` and `ctx.strokeStyle`. This method is available on both `CrispSwContext` and polyfilled for `CanvasRenderingContext2D`.
    *   **`rect`**:
        *   Use `ctx.fillRect(x, y, width, height)` and/or `ctx.strokeRect(x, y, width, height)`. These are immediate drawing mode methods.
        *   For rotated rectangles: `ctx.save(); ctx.translate(shape.center.x, shape.center.y); ctx.rotate(shape.rotation); ctx.fillRect(-shape.width/2, ...); ctx.restore();`.
        *   The `ctx.rect(x,y,w,h)` method on `CrispSwContext` is primarily for defining clipping regions and does not build a path for `fill()` or `stroke()`.
    *   **`roundedRect`**:
        *   Prefer using `ctx.fillRoundRect(x, y, w, h, r)` and `ctx.strokeRoundRect(x, y, w, h, r)`. These were added to `CrispSwContext` for direct drawing and polyfilled for `CanvasRenderingContext2D` to call `drawRoundedRectCanvas` (which internally handles pathing for canvas).
        *   Native `CanvasRenderingContext2D.prototype.roundRect(x,y,w,h,radii)` builds a path. If you use this on a native canvas context (e.g. via the polyfill we added if it was undefined), you would then call `ctx.fill()` or `ctx.stroke()`. `CrispSwContext` does not support `fill()`/`stroke()` on paths created this way.
    *   **`circle`**:
        *   Use `ctx.fillCircle(...)`, `ctx.strokeCircle(...)`, or `ctx.fillAndStrokeCircle(...)`. These methods are available on `CrispSwContext` and polyfilled for `CanvasRenderingContext2D`.
        *   Avoid `ctx.beginPath(); ctx.arc(..., 2 * Math.PI); ctx.fill();` because `CrispSwContext` does not support general `fill()` on paths built with `arc()`.
    *   **`arc`**:
        *   Use `ctx.fillArc(...)`, `ctx.strokeArc(...)`, or `ctx.fillAndStrokeArc(...)`. These custom methods were added to `CrispSwContext` and polyfilled for `CanvasRenderingContext2D`.
        *   The polyfills for `CanvasRenderingContext2D` utilize `this.arc()` internally to build the path for the native context.
        *   `CrispSwContext` versions call its specific `SWRendererArc`.
        *   Remember that these custom methods take angles in radians, and `CrispSwContext` methods convert to degrees if its internal renderer needs them.
*   **Return Value for Checks**:
    *   If the original `shapeCreationFunction` returned an object (e.g., for `withExtremesCheck`), your new `draw_` function **must** return an object with a `checkData` property containing a similar structure for the single-instance mode.
    *   **Calculating `checkData` for `withExtremesCheck`**:
        *   This requires careful determination of inclusive pixel boundaries.
        *   Example for a 1px stroke where `geomX`, `geomY` are the top-left of the stroke geometry and might be `*.5` (e.g., after adjustment for crisp rendering at pixel center):
            `checkData = { leftX: Math.floor(geomX), rightX: Math.floor(geomX + finalWidth), topY: Math.floor(geomY), bottomY: Math.floor(geomY + finalHeight) };` (Note: `rightX` and `bottomY` here are the coordinates of the pixel *after* the last rendered pixel if `geomX + finalWidth` isn't an integer, or the last pixel itself if it is. This means `rightX - 1` might be needed for an inclusive rightmost pixel if `geomX + finalWidth` is integer. The exact formulation like `Math.floor(geomX + finalWidth - epsilon)` or `Math.floor(geomX + finalWidth - 1)` vs `Math.floor(geomX + finalWidth)` depends on how the check utility and renderer define boundaries. Careful testing and comparison with original test values is key).
        *   When in doubt, run the original test or consult `withExtremesCheck` failure outputs to determine the exact expected values.
    *   If no checks in the original test required return data (e.g., no `withExtremesCheck`), the new `draw_...` function can return `null` or `{ logs: [...] }`.
    *   This return value (with `checkData`) is typically only for the single-instance visual regression run.
*   **Handling `instances` for Performance**:
    *   The JSDoc for your `draw_` function must clearly explain how `instances` is used.
    *   **Single Archetype Tests**:
        1.  Loop `(isPerformanceRun ? instances : 1)` times.
        2.  *Inside the loop*, generate *all* defining properties for *each instance* using `SeededRandom.getRandom()` (and helpers like `getRandomColor`, or local parameter calculation helpers). This ensures unique shapes.
        3.  Determine the drawing position. For the single visual test instance, use the `SeededRandom`-derived or calculated position. For performance instances (`isPerformanceRun`), after getting the base position from `SeededRandom`, apply an *additional, large random offset* using `Math.random()` (not `SeededRandom`) to spread shapes. Ensure these spread shapes remain largely within canvas bounds.
        4.  Draw the primitive.
        5.  If it's the visual regression run, calculate `checkData` and logs for the *first* (or only) instance.
        6.  Return `null` for performance runs; return `{ logs, checkData }` for visual runs.
    *   **Variable Count Tests (e.g., "N random lines")**: `instances` often directly dictates N for performance runs, overriding a default N for visual runs.
    *   **Fixed Set of Multiple Primitives (e.g., a grid of shapes, a complex static scene)**:
        *   For visual mode, the `draw_...` function draws its fixed set of shapes once.
        *   For performance mode, the `draw_...` function should draw `instances` *total individual primitive shapes*, adapting its internal looping logic. For example, if the visual mode draws a 2x2 grid (4 shapes), and `instances` is 100, the performance mode should draw 100 randomized versions of the grid's archetype shape, not 100 full grids. If the test is truly about drawing a fixed *set* (like the `buildScene` example), `instances` might control repetitions of drawing the entire fixed set, potentially with seed variation for each full repetition (e.g., `SeededRandom.seedWithInteger(currentIterationNumber + sceneInstanceIndex)`).

### 3. Create the `define_..._test` Function

*   Instantiate `RenderTestBuilder`.
*   Set `.withId('your-test-id')`.
*   Set `.withTitle('Descriptive Test Title')`. Use `\\uXXXX` for special characters like `°` (`\\u00B0`).
*   Set `.withDescription('More detailed description.')`.
*   Use `.runCanvasCode(your_draw_function_name /*, customArg1, ... */)`.
*   **Migrate Checks**: Add the same checks (`.withExtremesCheck()`, `.withColorCheckMiddleRow()`, etc.) from the original low-level test.
*   Set `.compareWithThreshold(value, alphaValue)` if the original test specified it. If not, `RenderTestBuilder` defaults to `(0,0)` (pixel-perfect), so explicitly adding `.compareWithThreshold(0,0)` is usually not needed unless for clarity or if a non-default was implicitly used.
*   Call `.build()`.

### 4. Call the Definition Function

```javascript
if (typeof RenderTestBuilder === 'function') {
    define_your_description_test();
}
```

### 5. Register for Performance Testing

```javascript
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof your_draw_function_name === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'your-test-id', // Same as .withId()
        drawFunction: your_draw_function_name,
        displayName: 'Perf: Short UI Name',
        description: 'Performance test description.',
        category: 'shape_category' // e.g., 'lines', 'rectangles', 'circles', 'arcs', 'scenes'
    });
}
```

### 6. Include in HTML Test Pages

*   **High-Level (Visual Regression) Tests**:
    Open `tests/browser-tests/high-level-tests.html` and add a `<script>` tag for your new test file:
    ```html
    <script src="test-cases/your-new-shape--params--test.js"></script>
    ```
    Ensure any utility scripts your test relies on (e.g., specific `scene-creation/*.js` files if you call original `add...` functions) are loaded *before* your test case script.
*   **Performance Tests**:
    Open `tests/browser-tests/performance-tests.html`:
    1.  Ensure all necessary dependency scripts (e.g., `scene-creation/*.js` if used, `random-utils.js`, `CrispSwContext` and its renderers either via individual files or an up-to-date minified build) are loaded *before* the main inline `<script>` block that instantiates `CrispSwContext` and *before* your test case script.
    2.  Add a `<script>` tag for your new test file, typically grouped with similar shapes or at the end of the `test-cases` includes.
        ```html
        <script src="test-cases/your-new-shape--params--test.js"></script>
        ```
    3.  If you've used a new `category` in the performance registration (e.g., `'arcs'`, `'scenes'`):
        *   In `performance-tests.html`, add a new placeholder `div` for this category within the `test-buttons-container` section (e.g., `<div id="arcs-tests" class="test-list-section"></div>`).
        *   In `tests/browser-tests/performance-tests/performance-ui.js`, update the `generateTestButtons` function to get this new container by ID, create a list for it using `createTestList`, and add an `else if` condition to route tests of your new category to this list.

## Common Issues & Troubleshooting

*   **`ReferenceError: [someAddShapeFunction] is not defined`** (e.g., `addRandomLines`):
    *   Occurs if your `draw_...` function calls an original `addShapeFunction` but the JavaScript file defining it (e.g., `src/scene-creation/scene-creation-lines.js`) isn't included in the HTML test runner page.
    *   **Fix**: Ensure all necessary `src/scene-creation/*.js` files are loaded via `<script>` tags in the relevant HTML test pages, *before* your test case script.
*   **`ReferenceError: renderTestWidth is not defined` (or `renderTestHeight`)**:
    *   Original scene creation functions or their helpers might use global `renderTestWidth`/`renderTestHeight`.
    *   **Fix for `draw_` functions calling original `add...` functions**: In the HTML test runner (e.g., `performance-tests.html`), define these as global JavaScript variables *before* your test scripts run. Initialize them from the actual canvas dimensions used for those tests (e.g., `var renderTestWidth = CANVAS_WIDTH;`). Ensure `CANVAS_WIDTH` itself is defined at that point.
    *   **Fix for `draw_` functions with inlined/adapted logic**: Pass `ctx.canvas.width` and `ctx.canvas.height` as arguments to any adapted helper functions that need these dimensions.
*   **Character Encoding Issues (e.g., `Â°` instead of `°`, or `â—œ` for `◜`)**:
    *   If special characters in test titles or log messages (defined in your `.js` file) appear garbled in the HTML, it's likely an encoding mismatch or direct pasting of multi-byte characters.
    *   **Fix**: Use Unicode escape sequences in your JavaScript strings. For example, `°` becomes `\\u00B0`, `◜` (U+25DC) becomes `\\u25DC`.
        ```javascript
        .withTitle('Test Title with 90\\u00B0 Angle') // For RenderTestBuilder
        logs.push(`Arc symbol: \\u25DC`); // For logs array
        ```
*   **Performance Test Never Ends / Frame Budget Not Consumed**:
    *   This usually means the `draw_...` function is not correctly scaling the amount of work based on the `instances` parameter from the performance harness, or the work per instance is too small.
    *   **Fix**: Review the "Handling `instances` for Performance" section. For tests that draw a fixed number of elements visually (like a grid of 12 arcs), the `draw_...` function for performance mode needs to be adapted to draw `instances` *randomized* versions of the *archetype* shape, not just repeat the fixed grid `instances` times (unless `instances` is meant to repeat the entire fixed drawing, which is rare for performance scaling). If the visual mode already draws `N` randomized shapes, the performance mode should draw `instances` randomized shapes.
*   **New Performance Test Category Not Appearing in UI**:
    *   If you've assigned a new `category` string to your test in the `window.PERFORMANCE_TESTS_REGISTRY`, it won't show up unless the UI is updated.
    *   **Fix**:
        1.  In `tests/browser-tests/performance-tests.html`, add a `div` with an ID like `<div id="mycategory-tests" class="test-list-section"></div>`.
        2.  In `tests/browser-tests/performance-tests/performance-ui.js`, update `generateTestButtons` to `getElementById('mycategory-tests')`, call `createTestList('My Category Tests', myCategoryContainer)`, and add an `else if (test.category === 'mycategory')` to route tests.
*   **`TypeError: ... is not a function` for new context methods (e.g., `ctx.fillRoundRect`)**:
    *   Ensure the polyfill script (`src/canvas-sw-polyfills.js`) is loaded in the HTML test page *before* your test case script that uses the method.
    *   Ensure `CrispSwContext.js` has the corresponding method implemented and its renderer (e.g., `this.roundedRectRenderer`) is correctly initialized.
    *   Ensure the minified build (`crisp-sw-canvas-vX.Y.Z.min.js`), if used, is up-to-date and includes these new methods and renderers. If in doubt during development, comment out the minified build and load individual source files in the HTML test page.
*   **`TypeError: ctx.fill is not a function` or `ctx.stroke is not a function` (when used after `beginPath`, `lineTo`, `arc`)**:
    *   The `CrispSwContext` does not support general path accumulation with `beginPath()`, `moveTo()`, `lineTo()`, `arc()`, etc., followed by a generic `fill()` or `stroke()` call to render that arbitrary path. 
    *   **Fix**: You must use the specific drawing methods provided by `CrispSwContext` and its polyfills for `CanvasRenderingContext2D`, such as `ctx.fillRect()`, `ctx.strokeLine()`, `ctx.fillCircle()`, `ctx.strokeArc()`, `ctx.fillRoundRect()`, etc. These methods perform immediate drawing or call specialized renderers. The native Canvas `arc()` and `roundRect()` methods *do* define paths, which can then be filled/stroked on a `CanvasRenderingContext2D` but not on a `CrispSwContext` using a general `fill()`/`stroke()`.


</rewritten_file>