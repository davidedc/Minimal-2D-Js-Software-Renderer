# Guide: Converting Low-Level Tests to High-Level Tests

This guide details the process of converting existing "low-level" rendering tests into the new "high-level" test format. These new high-level tests serve a dual purpose:
1.  **Visual Regression Testing**: Using `RenderTestBuilder` to define and run tests, comparing software renderer output against canvas output.
2.  **Performance Testing**: The same drawing logic can be hooked into the performance testing framework.

The goal is to consolidate testing efforts and leverage a more flexible and direct way of defining drawing logic using the Canvas API.

## Preamble: Understanding the Low-Level Test

Before starting the conversion, it's crucial to thoroughly understand the original low-level test.

*   **Behavior vs. Description**: Sometimes, a low-level test's descriptive name or comments might not perfectly align with what its underlying `shapeCreationFunction` *actually does* (e.g., an "Axis-Aligned Rectangle" test might internally use utilities that generate parameters suitable for a rounded rectangle, or apply unexpected default stroke widths).
    *   **Action**: Always examine the `shapeCreationFunction` (and any helper utilities it calls from `src/scene-creation/`) to understand the true data generation logic and the actual parameters being used for drawing.
    *   **Decision Point**: If a discrepancy is found, decide whether to:
        1.  **Prioritize Original Behavior**: Replicate the original (potentially quirky) data generation and behavior for strict test-to-test parity. The JSDoc for your new high-level test should note if it inherits such quirks.
        2.  **Prioritize Description/Intent**: Implement the high-level test according to the clearer name or descriptive intent, effectively "fixing" or clarifying an old inconsistency. This makes the new test cleaner but means it might not be a 1:1 data replication of the old one.
    *   Clearly document your chosen approach in the JSDoc of your new `draw_...` function.

## Overview of the Conversion Process

The conversion involves translating the shape-generation logic from the old system (which often involved populating a `Scene` object with shape definitions) into a new JavaScript file that directly uses Canvas API calls within a dedicated drawing function.

Each low-level test, typically invoked by an `add<TestName>Test()` function in `src/add-tests.js`, will be converted into a new `.js` file within the `tests/browser-tests/test-cases/` directory.

## File Naming Convention

New test files should follow a descriptive naming convention, using `--` as a separator for major characteristics and `_` (or `-` where appropriate within a characteristic) for sub-characteristics. The file must end with `--test.js`.

Example: `lines--M-size--no-fill--1px_opaque_stroke--crisp_pixel_pos--horizontal_orient--test.js`

Consult existing files in `tests/browser-tests/test-cases/` for more examples.

## Structure of a New High-Level Test File

Each new `...--test.js` file will typically have the following structure:

1.  **Drawing Function**: A function, conventionally named `draw_[description_matching_filename]`, that contains the actual Canvas API drawing logic.
2.  **Test Definition Function**: A function, conventionally named `define_[description_matching_filename]_test`, that uses `RenderTestBuilder` to configure and register the visual regression test.
3.  **Immediate Test Definition**: A call to the `define_..._test()` function to ensure the test is registered when the script loads.
4.  **Performance Test Registration**: A block of code to register the drawing function with `window.PERFORMANCE_TESTS_REGISTRY`.

```javascript
// Example Structure: my-shape--params--test.js

/**
 * @fileoverview Test definition for MyShape with specific parameters.
 * (Detailed JSDoc for the drawing function, as shown below, is highly recommended.
 * It should clearly explain parameters, return values, and behavior in different modes.)
 */

/**
 * Draws MyShape with specific parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding).
 * // Add any custom arguments passed via RenderTestBuilder.runCanvasCode() here
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. Its interpretation depends on the test's nature:
 *                  - For single/fixed primitives: typically a loop multiplier.
 *                  - For variable count primitives: may override a default count.
 *                  This function's JSDoc should clarify its specific usage.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks (if applicable
 *                  for single-instance mode), or null (especially for multi-instance/perf mode
 *                  or if no checks require data).
 */
function draw_my_shape__params(ctx, currentIterationNumber, /* customArg1, customArg2, ..., */ instances = null) {
    // 1. Use SeededRandom.getRandom() for reproducible randomness if needed.
    //    (Do NOT call SeededRandom.seedWithInteger() here; RenderTest handles it.)

    // 2. Access canvas dimensions:
    //    const canvasWidth = ctx.canvas.width;
    //    const canvasHeight = ctx.canvas.height;

    // 3. Implement drawing logic using ctx (see "Translating Drawing Logic" below).
    //    Example:
    //    ctx.fillStyle = 'red'; // Direct CSS string if color is static
    //    ctx.fillRect(10, 10, 50, 50);

    // 4. If single instance (instances === null or <= 0):
    //    If checks require data (e.g., withExtremesCheck):
    //    const checkData = {
    //        leftX: 10,
    //        rightX: 10 + 50 -1,
    //        topY: 10,
    //        bottomY: 10 + 50 -1
    //    };
    //    const logs = [`Drew a rectangle at 10,10`];
    //    return { logs, checkData };
    //    Else if no checkData is needed (e.g. test has no withExtremesCheck):
    //    return { logs }; // Or simply return null if no logs either.
    // else (multi-instance for perf testing, or if no specific return is needed for single instance):
    //    return null; 
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
        .withExtremesCheck() // If applicable
        // .withColorCheckMiddleRow({ expectedUniqueColors: ... }) // If applicable
        .compareWithThreshold(0, 0) // Example: pixel-perfect
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
        category: 'myShape' // General category (e.g., 'lines', 'rectangles')
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
    function add1PxHorizontalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
      // SeededRandom.seedWithInteger(currentIterationNumber); // Old way
      const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
      const centerX = Math.floor(renderTestWidth / 2); // Old global
      const centerY = Math.floor(renderTestHeight / 2) + 0.5; // Old global
      return add1PxHorizontalLine(centerX, centerY, lineWidth, shapes, log); // Might call helpers
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

This is the core of the conversion. You'll translate the logic from the old `shapeCreationFunction` into direct Canvas API calls.

*   **JSDoc Importance**: It is crucial to provide a detailed JSDoc comment for your `draw_...` function. This JSDoc should clearly explain:
    *   All parameters, especially any custom arguments and how the `instances` parameter is interpreted (see "Handling `instances` for Performance" below).
    *   The structure and meaning of the returned object, particularly the `checkData` if present.
    *   Any notable behaviors or pre-conditions.
*   **Signature**: `function draw_your_description(ctx, currentIterationNumber, /* customArg1, ..., */ instances = null)`
    *   Any custom static arguments passed via `RenderTestBuilder.runCanvasCode()` (see Section 3) should appear in the signature before the optional `instances = null` parameter.
*   **Randomness**:
    *   Use `SeededRandom.getRandom()` directly for any randomized values (dimensions, positions, colors if applicable).
    *   **CRITICAL**: The *exact order* of all calls to `SeededRandom.getRandom()` in your new `draw_...` function must precisely mirror the order in which they occurred in the original `shapeCreationFunction` (and any helpers it called that used `SeededRandom`). Any deviation in sequence will lead to different random values and a mismatch with the original test's output. If debugging complex sequences, consider temporarily adding logs in both the old and new code to print values from `SeededRandom.getRandom()` to trace the sequence.
    *   **Do not** call `SeededRandom.seedWithInteger(currentIterationNumber)` inside your `draw_` function; `RenderTest` (the test runner) handles seeding globally before calling your function.
*   **Canvas Dimensions**:
    *   Replace globals like `renderTestWidth` and `renderTestHeight` with `ctx.canvas.width` and `ctx.canvas.height`.
*   **Logic Migration**:
    *   Replicate the calculations for coordinates, sizes, colors, etc., from the old function.
    *   **Pre-condition Checks**: Identify and migrate any necessary pre-condition checks from the original shape creation logic (e.g., `checkCanvasHasEvenDimensions()` or an equivalent inline check like `if (ctx.canvas.width % 2 !== 0) ...`) into the new `draw_...` function to ensure test validity.
    *   If the old function called helper utilities (e.g., from `scene-creation-utils.js` or other `scene-creation` files):
        *   Their logic often needs to be **carefully adapted and potentially inlined** into your `draw_...` function. This adaptation is crucial and includes:
            *   Replacing any global variable access (like `renderTestWidth`, `renderTestHeight`) with context-specific values (e.g., `ctx.canvas.width`, `ctx.canvas.height`).
            *   Ensuring that all calls to `SeededRandom.getRandom()` from the inlined/adapted logic are integrated into the *correct overall sequence* relative to other `SeededRandom` calls in your main `draw_...` function.
            *   Adjusting the helper's logic to directly use `ctx` for drawing or to return parameters compatible with direct canvas calls, rather than populating an intermediate `shapes` array or relying on a separate rendering engine.
        *   Alternatively, if a utility is simple, widely used, and already loaded by the test HTML pages (like `getRandomColor` from `random-utils.js`), you can call it directly if its output is suitable or can be easily adapted (see Color Conversion below).
*   **Drawing Commands (Mapping `type` to `ctx` calls)**:
    *   The old `shapes.push({ type: '...', ... })` needs to be converted to `ctx` operations.
    *   **Color Conversion**: Shape properties like `strokeColor: { r, g, b, a }` or `fillColor` must be converted to CSS color strings for `ctx.strokeStyle` or `ctx.fillStyle`.
        *   Example: `'rgba(${r},${g},${b},${a/255})'` or use a utility like `colorToString()` if available and appropriate.
        *   If the color is static and known (e.g., always red), you can use direct CSS color strings. For broadest compatibility, especially with `CrispSwContext` which might have a stricter parser, prefer explicit formats like `ctx.strokeStyle = 'rgb(255,0,0)';` or `ctx.fillStyle = 'rgba(0,0,0,0.5)';` even for common color names.
        *   Alternatively, if the original test used a globally available utility function (e.g., `getRandomColor(minAlpha, maxAlpha)`) from an included script (like `random-utils.js`) to generate color *objects*, and you have a way to convert this object to a CSS string, prefer using that original utility to ensure fidelity. You might need a small helper function in your test file or a shared utility to convert the object (e.g., `{r,g,b,a}` where `a` is 0-255) to an `rgba(...)` CSS string if one isn't globally available (e.g., `return \`rgba(\${obj.r},\${obj.g},\${obj.b},\${(obj.a/255).toFixed(3)})\`;`). Remember that the order of calls to `getRandomColor` must match the original test if multiple colors are generated.
    *   **`line`**:
        *   Properties: `start`, `end`, `thickness`, `color`.
        *   A common and preferred method if `ctx.strokeLine(x1, y1, x2, y2)` is available (polyfilled for both `CrispSwContext` and `CanvasRenderingContext2D`):
            *   `ctx.lineWidth = shape.thickness;`
            *   `ctx.strokeStyle = convertedColorString;`
            *   `ctx.strokeLine(shape.start.x, shape.start.y, shape.end.x, shape.end.y);`
        *   Otherwise, use standard path commands:
            *   `ctx.beginPath();`
            *   `ctx.moveTo(shape.start.x, shape.start.y);`
            *   `ctx.lineTo(shape.end.x, shape.end.y);`
            *   `ctx.lineWidth = shape.thickness;`
            *   `ctx.strokeStyle = convertedColorString;`
            *   `ctx.stroke();`
    *   **`rect`**:
        *   Properties: `center`, `width`, `height`, `rotation`, `strokeWidth`, `strokeColor`, `fillColor`.
        *   Calculate `x = center.x - width / 2`, `y = center.y - height / 2`.
        *   If `rotation !== 0`:
            *   `ctx.save();`
            *   `ctx.translate(center.x, center.y);`
            *   `ctx.rotate(rotation);`
            *   (Draw with coordinates relative to new origin, e.g., `fillRect(-width/2, -height/2, ...)` )
        *   If `fillColor` (and fill is desired):
            *   `ctx.fillStyle = convertedFillColorString;`
            *   `ctx.fillRect(rotation ? -width/2 : x, rotation ? -height/2 : y, width, height);`
        *   If `strokeColor` and `strokeWidth > 0` (and stroke is desired):
            *   `ctx.strokeStyle = convertedStrokeColorString;`
            *   `ctx.lineWidth = strokeWidth;`
            *   `ctx.strokeRect(rotation ? -width/2 : x, rotation ? -height/2 : y, width, height);`
        *   If `rotation !== 0`:
            *   `ctx.restore();`
    *   **`circle`**:
        *   Properties: `center`, `radius`, `strokeWidth`, `strokeColor`, `fillColor`.
        *   `ctx.beginPath();`
        *   `ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);`
        *   If `fillColor`:
            *   `ctx.fillStyle = convertedFillColorString;`
            *   `ctx.fill();`
        *   If `strokeColor` and `strokeWidth > 0`:
            *   `ctx.lineWidth = strokeWidth;`
            *   `ctx.strokeStyle = convertedStrokeColorString;`
            *   `ctx.stroke();`
    *   **`arc`**: Similar to `circle` but with `startAngle`, `endAngle`, `counterClockwise` properties.
        *   `ctx.beginPath();`
        *   `ctx.arc(center.x, center.y, radius, startAngle, endAngle, counterClockwise);`
        *   `ctx.lineWidth = strokeWidth;`
        *   `ctx.strokeStyle = convertedStrokeColorString;`
        *   `ctx.stroke();` (Arcs are typically stroked, not filled, in these tests unless specified).
    *   **`roundedRect`**:
        *   Canvas API has a newer `ctx.roundRect(x, y, width, height, radii)` method. If its use is standard in this project for both SW and Canvas contexts, use it.
        *   Otherwise, you'll need to draw it using a path: `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()` for straight segments, and `ctx.arcTo()` (or `ctx.quadraticCurveTo()`) for corners. Then `ctx.fill()` and/or `ctx.stroke()`.
        *   The low-level `shapeCreationFunction` for rounded rectangles (e.g., in `scene-creation-rounded-rects.js`) will provide the necessary parameters (like corner radii).
*   **Return Value for Checks**:
    *   If the original `shapeCreationFunction` returned an object (e.g., for `withExtremesCheck`), your new `draw_` function **must** return an object with a `checkData` property containing a similar structure for the single-instance mode.
    *   Example: `return { logs: ["..."], checkData: { leftX, rightX, topY, bottomY } };`
    *   **Calculating `checkData` for `withExtremesCheck`**: The exact values for `leftX`, `rightX`, `topY`, `bottomY` in `checkData` can be nuanced, especially for stroked shapes, and depend on how the `withExtremesCheck` utility interprets these bounds in conjunction with the rendering context (software vs. canvas, integer vs. sub-pixel coordinates).
        *   **General Principle**: `withExtremesCheck` typically expects the inclusive integer pixel coordinates that define the bounding box of the rendered primitive's relevant feature (e.g., the stroke itself).
        *   **1px Strokes and Pixel Alignment**:
            *   If a 1px stroke is geometrically centered on an **integer coordinate** (e.g., line at `x=10`), the stroke visually covers `[x - 0.5, x + 0.5)`. The `withExtremesCheck` might then expect bounds related to this (e.g., `x-0.5` for left, `x+0.5` for right if it works with subpixels, or `Math.floor(x-0.5)` and `Math.floor(x+0.5)` if it expects integer pixels).
            *   If a 1px stroke is geometrically centered on a **`.5` coordinate** (e.g., line at `x=10.5`), the stroke visually covers the integer pixel `10` (i.e., the range `[10, 11)`). The `withExtremesCheck` will likely expect `Math.floor(10.5) = 10` for that boundary.
        *   **Example for a rectangle stroked with 1px, where `x, y` (top-left of stroke geometry) and `x+width, y+height` (representing the coordinates of the center of the far strokes) are all `*.5` coordinates (e.g., after `adjustDimensionsForCrispStrokeRendering` for a 1px stroke on an integer grid center):**
            ```javascript
            // In draw_... function:
            // x, y are the top-left *.5 coordinates for the stroke rectangle's geometry.
            // finalRectWidth, finalRectHeight are the dimensions.
            const checkData = {
                leftX: Math.floor(x),                       // e.g., if x is 227.5, this is 227
                rightX: Math.floor(x + finalRectWidth),     // e.g., if x + width is 372.5, this is 372
                topY: Math.floor(y),                        // e.g., if y is 270.5, this is 270
                bottomY: Math.floor(y + finalRectHeight)  // e.g., if y + height is 329.5, this is 329
            };
            return { logs, checkData };
            ```
        *   **Example for a rectangle with a thicker stroke (e.g., `sw` pixels) where `x,y` are integer top-left coordinates:**
            ```javascript
            // In draw_... function:
            // x, y are integer top-left coordinates of the rectangle's geometry.
            // rectWidth, rectHeight are its dimensions.
            // sw is the strokeWidth.
            const checkData = {
                leftX: x - sw / 2,
                rightX: x + rectWidth + sw / 2 - 1, // Note the -1 for inclusive pixel boundary
                topY: y - sw / 2,
                bottomY: y + rectHeight + sw / 2 - 1  // Note the -1 for inclusive pixel boundary
            };
            return { logs, checkData };
            ```
        *   **Debugging Strategy**: The most reliable way to determine the correct `checkData` is often iterative. If `withExtremesCheck` fails, it will output the "expected" (from your `checkData`) vs. "found" (what the renderer/check actually detected) values. The "found" values usually indicate what your `checkData` should aim to produce. Analyze these discrepancies to understand the coordinate system and pixel interpretation of `withExtremesCheck` for the specific scenario.
        *   Consult existing converted tests that use `withExtremesCheck` for similar shapes and positioning as a reference.
    *   Conversely, if the original shape creation function did *not* return data for checks (e.g., `addBlackLines`), and the `RenderTestBuilder` definition for the low-level test did *not* include checks requiring this data (like `withExtremesCheck`), then the new `draw_...` function typically should not return `checkData`. It might return `null` or an object with only `logs` if logging is desired.
    *   This return value (with or without `checkData`) should generally only be for the single-instance case (i.e., `instances` parameter is not set or is <= 0). For multi-instance performance runs, returning `null` is common.
*   **Handling `instances` for Performance**:
    *   The `instances` parameter is passed by the performance testing harness. Its JSDoc in your `draw_` function must clearly explain how it's used.
    *   **Interpretation can vary**:
        *   **For tests drawing a single, well-defined primitive (or a fixed small set of them)**: `instances` typically acts as an outer loop multiplier. The `draw_` function should:
            1.  **Calculate Archetype Properties**: Once, before the loop, calculate the core properties of the "archetype" primitive using `SeededRandom` (e.g., its dimensions, specific anchor points if it's a complex unique shape, initial positioning for the visual regression case). This ensures the fundamental nature of the shape being tested is reproducible.
            2.  **Loop `instances` Times**: Iterate from `0` to `(isPerformanceRun ? instances : 1) - 1`.
            3.  **Determine Instance Position (for performance mode)**: Inside the loop for performance runs, calculate the top-left drawing coordinates (`currentX`, `currentY`) for each instance. To ensure instances are spread across the entire canvas for a meaningful performance test:
                *   These coordinates should typically be generated as absolute random positions within the canvas boundaries (e.g., `currentX = Math.floor(Math.random() * (canvasWidth - archetype.width))`).
                *   Avoid merely applying small random offsets to a single, fixed base position (like the centered position used for the visual regression test's archetype), as this can lead to clustering.
                *   If the specific visual characteristics of the archetype depend on its top-left coordinates having a particular sub-pixel alignment (e.g., being `X.5, Y.5` to ensure crispness with even dimensions), then adjust the randomly generated integer position accordingly (e.g., `currentX = Math.floor(Math.random() * (canvasWidth - archetype.width)) + 0.5;`).
            4.  **Draw the Primitive**: Draw the primitive using its archetypal properties but at the newly determined (potentially offset) position.
            5.  **Conditional Logic for Visual vs. Perf.**: 
                *   If it's *not* a performance run (i.e., you are drawing the single instance for visual regression), then perform any necessary logging and calculate/store `checkData` based on this single, canonical (often un-offsetted or specifically placed) instance.
                *   If it *is* a performance run, typically skip logging and `checkData` for efficiency for all instances, or at least for instances after the first if the first one also serves as a quick visual check.
            The function should generally return `null` if `isPerformanceRun` is true. The `checkData` is primarily relevant for the single-instance visual regression run.

            **Conceptual Structure:**
            ```javascript
            function draw_single_precise_shape(ctx, currentIterationNumber, instances = null) {
                const isPerformanceRun = instances !== null && instances > 0;
                const numToDraw = isPerformanceRun ? instances : 1;
                let logs = null;         // Initialize to null, populate only for non-perf run
                let checkData = null;    // Initialize to null, populate only for non-perf run

                // 1. Calculate archetype properties (using SeededRandom)
                // These define the shape's characteristics for all instances.
                const archetypeRandomValue = SeededRandom.getRandom(); // Example
                const archetype = {
                    width: 50 + archetypeRandomValue * 100, // Seeded random dimension
                    height: 30 + archetypeRandomValue * 50,
                    lineWidth: 1,
                    strokeStyle: 'rgb(255,0,0)',
                    // Base coordinates for the visual regression instance (e.g., centered)
                    baseVisualX: ctx.canvas.width / 2 - (50 + archetypeRandomValue * 100) / 2,
                    baseVisualY: ctx.canvas.height / 2 - (30 + archetypeRandomValue * 50) / 2
                };
                
                ctx.lineWidth = archetype.lineWidth;
                ctx.strokeStyle = archetype.strokeStyle;

                for (let i = 0; i < numToDraw; i++) {
                    let currentX, currentY;

                    if (isPerformanceRun) {
                        // 3. Apply per-instance variations for performance runs
                        // Use Math.random() for offsets for speed; these don't need to be seeded per iteration typically.
                        currentX = Math.floor(Math.random() * (ctx.canvas.width - archetype.width));
                        currentY = Math.floor(Math.random() * (ctx.canvas.height - archetype.height));
                    } else {
                        // For the single visual regression instance, use the calculated base position
                        currentX = archetype.baseVisualX;
                        currentY = archetype.baseVisualY;
                    }

                    // 4. Draw the varied primitive
                    ctx.strokeRect(currentX, currentY, archetype.width, archetype.height);

                    // 5. Conditional logic for the single visual regression instance
                    if (!isPerformanceRun) {
                        logs = [`Drew archetype at ${currentX.toFixed(1)},${currentY.toFixed(1)}`];
                        checkData = { /* ... calculate based on currentX, currentY, archetype.width, archetype.height ... */ };
                        // Since numToDraw is 1 for non-perf, loop effectively runs once.
                    }
                }

                if (isPerformanceRun) return null;
                return { logs, checkData }; // Return logs and checkData only for the visual test run
            }
            ```
        *   **For tests designed to draw a variable number of primitives (e.g., "N random lines")**: `instances` might be used as *the value for N itself* when in performance mode, overriding a default count that is used for the visual regression mode (single-instance run). For example, if the visual test draws 20 lines, and `instances` is 1000, the performance run draws 1000 lines.
    *   In multi-instance mode (when `instances > 0`), specific logging and `checkData` return are usually skipped (the function typically returns `null`).
    *   The primary `SeededRandom.getRandom()` should still be used for the *base* properties of the shape(s) to ensure the core primitive or pattern is reproducible, while simple `Math.random()` can be used for per-instance variations (like position offsets in the first case) if strict reproducibility of each individual offset isn't critical for the performance scenario.

### 3. Create the `define_..._test` Function

*   Instantiate `RenderTestBuilder`.
*   Set `.withId('your-test-id')` - should match the filename (without `--test.js`) and be unique.
*   Set `.withTitle('Descriptive Test Title')`.
*   Set `.withDescription('More detailed description of what the test does.')`.
*   Use `.runCanvasCode(your_draw_function_name /*, customArg1, customArg2, ... */)`.
    *   Any extra static arguments passed here will be forwarded to your `draw_` function, appearing *before* the `instances` parameter in its signature (e.g., `function draw_foo(ctx, iter, customArg1, instances = null)`).
*   **Migrate Checks**: Add the same checks (`.withExtremesCheck()`, `.withColorCheckMiddleRow()`, etc.) that were present in the original low-level test definition in `src/add-tests.js`. The `withExtremesCheck` will use the `checkData` object returned by your `draw_` function (if provided).
*   Call `.build()`.

### 4. Call the Definition Function

At the end of your new test file, call the `define_..._test()` function to register it:
```javascript
if (typeof RenderTestBuilder === 'function') {
    define_your_description_test();
}
```

### 5. Register for Performance Testing

Add the performance test registration block, ensuring the `id` matches and `drawFunction` points to your drawing function:
```javascript
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof your_draw_function_name === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'your-test-id', // Same as .withId()
        drawFunction: your_draw_function_name,
        displayName: 'Perf: Short UI Name',
        description: 'Performance test description.',
        category: 'shape_category' // e.g., 'lines', 'rectangles'
    });
}
```

### 6. Include in HTML Test Pages

For the new test to be discoverable by both the visual regression and performance test runners, its JavaScript file must be included in their respective HTML pages.

*   **High-Level (Visual Regression) Tests**:
    Open `tests/browser-tests/high-level-tests.html` and add a `<script>` tag for your new test file, typically alongside the other test case includes:
    ```html
    <!-- ... other script tags ... -->
    <script src="test-cases/your-new-shape--params--test.js"></script>
    <!-- ... other script tags ... -->
    ```
*   **Performance Tests**:
    Similarly, open `tests/browser-tests/performance-tests.html` and add a `<script>` tag for your new test file. This ensures the test's registration with `PERFORMANCE_TESTS_REGISTRY` is executed by this page:
    ```html
    <!-- Load test scripts -->
    <!-- ... other test case script tags ... -->
    <script src="test-cases/your-new-shape--params--test.js"></script>
    <!-- ... other test case script tags ... -->
    
    <!-- Test definitions and UI -->
    <script src="performance-tests/performance-ui.js"></script>
    ```

## Example Walkthrough: `add1PxHorizontalLineCenteredAtPixelTest`

**1. Low-Level Test (Abbreviated):**

*   `src/add-tests.js`:
    ```javascript
    function add1PxHorizontalLineCenteredAtPixelTest() {
      return new RenderTestBuilder()
        .withId('centered-1px-horizontal-line')
        // ...
        .addShapes(add1PxHorizontalLineCenteredAtPixel)
        .withExtremesCheck()
        // ...
        .build();
    }
    ```
*   `src/scene-creation/scene-creation-lines.js`:
    ```javascript
    function add1PxHorizontalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
      // ... uses SeededRandom, renderTestWidth, renderTestHeight ...
      const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
      const centerX = Math.floor(renderTestWidth / 2);
      const centerY = Math.floor(renderTestHeight / 2) + 0.5;
      return add1PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
    }

    function add1PxHorizontalLine(centerX, centerY, width, shapes, log) {
      // ... calculates startX, endX, pixelY ...
      shapes.push({
        type: 'line',
        start: { x: startX, y: centerY },
        end: { x: endX, y: centerY },
        thickness: 1,
        color: { r: 255, g: 0, b: 0, a: 255 }
      });
      return { topY: pixelY, bottomY: pixelY, leftX, rightX: rightX - 1 };
    }
    ```

**2. Converted High-Level Test:**
`tests/browser-tests/test-cases/lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient--test.js`
(Refer to the content of this file as shown in earlier analysis. Key aspects:)

*   `draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient(ctx, currentIterationNumber, instances = null)`:
    *   (Assumes JSDoc explains parameters and return value clearly).
    *   Uses `ctx.canvas.width`, `ctx.canvas.height`.
    *   Includes pre-condition check for canvas dimensions.
    *   Calculates `baseLineWidth`, `baseCenterX`, `baseCenterY` using `SeededRandom.getRandom()`.
    *   Sets `ctx.lineWidth = 1; ctx.strokeStyle = 'rgb(255, 0, 0)';`.
    *   Calls `ctx.strokeLine(currentStartX, currentCenterY, currentEndX, currentCenterY);`.
    *   Returns `{ logs: [...], checkData: { topY: basePixelY, bottomY: basePixelY, leftX: ..., rightX: ... } }` for single instance.
*   `define_lines__..._test()`:
    *   `.withId('lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient')`
    *   `.runCanvasCode(draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient)`
    *   Includes `.withExtremesCheck()`, `.withColorCheckMiddleRow()`, etc., from original.
*   Performance registration block is present.
*   File is included in `high-level-tests.html`.
*   (For this walkthrough, assume it would also be added to `performance-tests.html` as per Step 6 above).

## Final Checks

*   Ensure your new test appears in the `high-level-tests.html` page in the browser.
*   Verify it runs correctly, and visual comparisons make sense.
*   Check that checks (like `withExtremesCheck`) are passing or failing as expected based on the `draw_...` function's return value.
*   Confirm the test also appears and runs in the performance testing UI if that's separate, and that the `instances` parameter behaves as intended for that specific test.

This detailed process should help in systematically converting all low-level tests. Remember to consult the already converted files in `tests/browser-tests/test-cases/` as practical examples and pay close attention to the JSDoc and logic within their `draw_...` functions. 