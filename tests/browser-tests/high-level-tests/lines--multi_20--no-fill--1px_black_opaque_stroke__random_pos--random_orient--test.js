/**
 * @fileoverview Test definition for rendering multiple (20 by default) 1px thick, black, opaque
 * lines with random start/end points. Supports a parameter to vary the number of instances.
 *
 * Guiding Principles for this function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - The number of lines drawn can be controlled by the 'instances' parameter.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Each line's position is determined randomly using `getRandomPoint` (which relies on `SeededRandom`).
 *     No additional `Math.random()` offsets are applied on top of this, as the inherent randomness
 *     of `getRandomPoint` serves the purpose for this specific test.
 * - Single Instance / Default Behavior (when 'instances' is null, 0, or negative):
 *   - If 'instances' is null (default), 20 lines are drawn, and logs are collected (matches original behavior).
 *   - If 'instances' is 0 or negative, 1 line is drawn, and logs are collected (for a minimal single run).
 *   - `SeededRandom` (via `getRandomPoint`) is used for all random elements to ensure test reproducibility.
 *   - Returns { logs: string[] }.
 */

/**
 * Draws a specified number of 1px thick, black, opaque lines with random start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @param {?number} instances - Number of lines to draw. If null, defaults to 20.
 *                              If > 0, this many lines are drawn without logging.
 *                              If 0 or negative, 1 line is drawn with logging.
 * @returns {?{ logs: string[] }} Log entries if not in multi-instance mode (instances > 0), otherwise null.
 */
function draw_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isTrueMultiInstance = instances !== null && instances > 0;
    let numIterations;

    if (isTrueMultiInstance) {
        numIterations = instances;
    } else if (instances === null) {
        numIterations = 20; // Default original behavior
    } else { // instances <= 0
        numIterations = 1; // Minimal single run with logging
    }

    let logs = isTrueMultiInstance ? null : [];

    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    // Assume getRandomPoint is available globally (from scene-creation-utils.js).

    // Set fixed drawing properties
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(0, 0, 0)'; // Black
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // No fill

    for (let i = 0; i < numIterations; i++) {
        // getRandomPoint uses SeededRandom for reproducibility of base characteristics.
        const start = isTrueMultiInstance ? 
            {
                x: Math.random() * currentCanvasWidth,
                y: Math.random() * currentCanvasHeight
            } :
            getRandomPoint(3, currentCanvasWidth, currentCanvasHeight);
            
        const end = isTrueMultiInstance ?
            {
                x: Math.random() * currentCanvasWidth,
                y: Math.random() * currentCanvasHeight
            } :
            getRandomPoint(4, currentCanvasWidth, currentCanvasHeight);

        // Draw the line using the canvas-like API
        if (typeof ctx.strokeLine === 'function') {
            ctx.strokeLine(start.x, start.y, end.x, end.y);
        } else {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }

        if (!isTrueMultiInstance) {
            logs.push(`&#x2500; 1px Black line from (${start.x.toFixed(1)}, ${start.y.toFixed(1)}) to (${end.x.toFixed(1)}, ${end.y.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (isTrueMultiInstance) {
        return null;
    } else {
        return { logs: logs }; // No checkData in this specific test's original design
    }
}

/**
 * Defines and registers the test case using RenderTestBuilder.
 */
function define_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient() {
  if (typeof RenderTestBuilder !== 'function' || typeof draw_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient !== 'function') {
    console.error('Missing RenderTestBuilder or drawing function for 1px black lines test');
    return;
  }
  // Ensure utility function is available
  if (typeof getRandomPoint !== 'function') {
    console.error('Missing utility function getRandomPoint');
    return;
  }

  return new RenderTestBuilder()
    .withId('lines--multi-20--no-fill--1px-black-opaque-stroke--random-pos--random-orient')
    .withTitle('Lines: Multi-20 No-Fill 1px-Black-Opaque-Stroke Random-Pos Random-Orient')
    .withDescription('Tests rendering of 20 black lines (1px width) with random positions/orientations using canvas code.')
    .runCanvasCode(draw_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient)
    // No specific checks were applied in the original test definition
    .build(); 
}

// Define and register the test immediately when this script is loaded.
if (typeof RenderTestBuilder === 'function') {
  define_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient();
} 