/**
 * @fileoverview Test definition for rendering a medium-sized, horizontal, 2px thick,
 * opaque stroke line centered at a grid intersection.
 */

/**
 * Draws a single, 2px thick, fully opaque horizontal line centered vertically
 * at a grid line (integer y-coordinate), with variable width and potentially
 * swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here).
 * @returns {{topY: number, bottomY: number, leftX: number, rightX: number}} The expected pixel extremes.
 */
function draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient(ctx, currentIterationNumber) {
    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    const renderTestWidth = ctx.canvas.width;
    const renderTestHeight = ctx.canvas.height;

    // Logic from add2PxHorizontalLineCenteredAtGrid
    const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    // Center at grid crossing (integer coordinates)
    const centerX = Math.floor(renderTestWidth / 2);
    const centerY = Math.floor(renderTestHeight / 2);

    // Logic from add2PxHorizontalLine
    const leftX = Math.floor(centerX - lineWidth / 2);
    const rightX = leftX + lineWidth; // Canvas lines go up to, but don't include, the end coordinate pixel column.
    const topPixelY = centerY - 1; // The top row of pixels for a 2px line centered at integer Y
    const bottomPixelY = centerY; // The bottom row of pixels

    let startX = leftX;
    let endX = rightX;
    // Randomly swap start/end points
    if (SeededRandom.getRandom() < 0.5) {
        [startX, endX] = [endX, startX];
    }

    // Set drawing properties
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red, matching original
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    // Draw the line using the canvas-like API
    if (typeof ctx.strokeLine === 'function') {
      ctx.strokeLine(startX, centerY, endX, centerY);
    } else {
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      ctx.lineTo(endX, centerY);
      ctx.stroke();
    }

    // Calculate and return the expected extremes (inclusive pixel coordinates)
    // Matching the return value of the original add2PxHorizontalLine
    const extremes = {
        topY: topPixelY,
        bottomY: bottomPixelY,
        leftX: Math.min(startX, endX),
        rightX: Math.max(startX, endX) - 1 // Match original: rightX - 1
    };

    return extremes;
}

/**
 * Defines and registers the test case using RenderTestBuilder.
 */
function define_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient() {
  if (typeof RenderTestBuilder !== 'function' || typeof draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient !== 'function') {
    console.error('Missing RenderTestBuilder or drawing function for 2px horizontal line test');
    return;
  }

  return new RenderTestBuilder()
    .withId('lines--M-size--no-fill--2px-opaque-stroke--centered-at-grid--horizontal-orient')
    .withTitle('Lines: M-Size No-Fill 2px-Opaque-Stroke Centered-At-Grid Horizontal')
    .withDescription('Tests crisp rendering of a horizontal 2px line centered at grid crossing using canvas code.')
    .runCanvasCode(draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient)
    // --- Checks from original add2PxHorizontalLineCenteredAtGridTest --- 
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck() // Uses return value from draw_ function
    // --- End checks ---
    .build(); 
}

// Define and register the test immediately when this script is loaded.
define_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient(); 