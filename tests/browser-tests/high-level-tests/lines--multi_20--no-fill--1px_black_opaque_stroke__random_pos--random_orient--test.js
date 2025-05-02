/**
 * @fileoverview Test definition for rendering multiple (20) 1px thick, black, opaque
 * lines with random start/end points.
 */

/**
 * Draws 20 1px thick, black, opaque lines with random start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @returns {{ logs: string[] }} Log entries.
 */
function draw_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient(ctx, currentIterationNumber) {
    let logs = [];
    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    // Assume getRandomPoint is available globally (from scene-creation-utils.js).
    const count = 20;

    // Set fixed drawing properties
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(0, 0, 0)'; // Black
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // No fill

    // Need to re-seed here because the original function did it INSIDE the buildShapesFn,
    // BEFORE the loop. RenderTest seeds BEFORE calling the canvasCodeFn, so the sequence
    // of getRandom() calls must match the original loop.
    // This deviates slightly from the ideal pattern but is necessary for compatibility.
    SeededRandom.seedWithInteger(currentIterationNumber);

    for (let i = 0; i < count; i++) {
        const start = getRandomPoint(1); // Assuming getRandomPoint(1) gets coords within bounds
        const end = getRandomPoint(1);

        // Draw the line using the canvas-like API
        if (typeof ctx.strokeLine === 'function') {
            ctx.strokeLine(start.x, start.y, end.x, end.y);
        } else {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
        logs.push(`&#x2500; 1px Black line from (${start.x.toFixed(1)}, ${start.y.toFixed(1)}) to (${end.x.toFixed(1)}, ${end.y.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
    }

    // No return value needed as the original test had no checks requiring it.
    return { logs: logs };
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
define_lines__multi_20__no_fill__1px_black_opaque_stroke__random_pos__random_orient(); 