/**
 * @fileoverview Test definition for rendering a medium-sized, vertical, 2px thick,
 * opaque stroke line centered at a grid intersection.
 */

/**
 * Draws a single, 2px thick, fully opaque vertical line centered horizontally
 * at a grid line (integer x-coordinate), with variable height and potentially
 * swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here).
 * @returns {{topY: number, bottomY: number, leftX: number, rightX: number}} The expected pixel extremes.
 */
function draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient(ctx, currentIterationNumber) {
    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    const renderTestWidth = ctx.canvas.width;
    const renderTestHeight = ctx.canvas.height;

    // Logic from add2PxVerticalLineCenteredAtGrid
    const lineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
    // Center at grid crossing (integer coordinates)
    const centerX = Math.floor(renderTestWidth / 2);
    const centerY = Math.floor(renderTestHeight / 2);

    // Logic from add2PxVerticalLine
    const topY = Math.floor(centerY - lineHeight / 2);
    const bottomY = topY + lineHeight; // Canvas lines go up to, but don't include, the end coordinate pixel row.
    const leftPixelX = centerX - 1;  // Left pixel column for 2px line centered at integer X
    const rightPixelX = centerX; // Right pixel column

    let startY = topY;
    let endY = bottomY;
    // Randomly swap start/end points
    if (SeededRandom.getRandom() < 0.5) {
        [startY, endY] = [endY, startY];
    }

    // Set drawing properties
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red, matching original
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    // Draw the line using the canvas-like API
    if (typeof ctx.strokeLine === 'function') {
      ctx.strokeLine(centerX, startY, centerX, endY);
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX, startY);
      ctx.lineTo(centerX, endY);
      ctx.stroke();
    }

    // Calculate and return the expected extremes (inclusive pixel coordinates)
    // Matching the return value of the original add2PxVerticalLine
    const extremes = {
        leftX: leftPixelX,
        rightX: rightPixelX,
        topY: Math.min(startY, endY),
        bottomY: Math.max(startY, endY) - 1 // Match original: bottomY - 1
    };

    return extremes;
}

/**
 * Defines and registers the test case using RenderTestBuilder.
 */
function define_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient() {
  if (typeof RenderTestBuilder !== 'function' || typeof draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient !== 'function') {
    console.error('Missing RenderTestBuilder or drawing function for 2px vertical line test');
    return;
  }

  return new RenderTestBuilder()
    .withId('lines--M-size--no-fill--2px-opaque-stroke--centered-at-grid--vertical-orient')
    .withTitle('Lines: M-Size No-Fill 2px-Opaque-Stroke Centered-At-Grid Vertical')
    .withDescription('Tests crisp rendering of a vertical 2px line centered at grid crossing using canvas code.')
    .runCanvasCode(draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient)
    // --- Checks from original add2PxVerticalLineCenteredAtGridTest --- 
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck() // Uses return value from draw_ function
    // --- End checks ---
    .build(); 
}

// Define and register the test immediately when this script is loaded.
define_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient(); 