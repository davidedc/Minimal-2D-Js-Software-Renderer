/**
 * @fileoverview Test definition for rendering a medium-sized, vertical, 1px thick,
 * opaque stroke line positioned precisely between pixels horizontally.
 */

/**
 * Draws a single, 1px thick, fully opaque vertical line centered horizontally
 * between pixels, with variable height and potentially swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here but required by signature).
 * @returns {{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes.
 */
function draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient(ctx, currentIterationNumber) {
    let logs = [];
    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    const renderTestWidth = ctx.canvas.width;
    const renderTestHeight = ctx.canvas.height;

    // Logic similar to add1PxVerticalLineCenteredAtPixel
    const lineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
    const centerX = Math.floor(renderTestWidth / 2) + 0.5; // Key: centered *between* pixels horizontally
    const centerY = Math.floor(renderTestHeight / 2);

    // Logic similar to add1PxVerticalLine
    const topY = Math.floor(centerY - lineHeight / 2);
    const bottomY = topY + lineHeight; // Canvas lines go up to, but don't include, the end coordinate pixel row for vertical lines.
    const pixelX = Math.floor(centerX); // The single pixel column involved

    let startY = topY;
    let endY = bottomY;
    // Randomly swap start/end points
    if (SeededRandom.getRandom() < 0.5) {
        [startY, endY] = [endY, startY];
    }

    // Set drawing properties
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Blue, matching original vertical line test
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    // Draw the line using the canvas-like API, checking for strokeLine method
    if (typeof ctx.strokeLine === 'function') {
      ctx.strokeLine(centerX, startY, centerX, endY);
    } else {
      ctx.beginPath();
      ctx.moveTo(centerX, startY);
      ctx.lineTo(centerX, endY);
      ctx.stroke();
    }

    logs.push(`&#x2500; 1px Red line from (${centerX.toFixed(1)}, ${startY.toFixed(1)}) to (${centerX.toFixed(1)}, ${endY.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);

    // Calculate and return the expected extremes (inclusive pixel coordinates)
    const extremes = {
        leftX: pixelX,
        rightX: pixelX,
        topY: Math.min(startY, endY),
        bottomY: Math.max(startY, endY) - 1
    };

    return { logs: logs, checkData: extremes };
}

/**
 * Defines and registers the test case using RenderTestBuilder.
 */
function define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient() {
  if (typeof RenderTestBuilder !== 'function' || typeof draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient !== 'function') {
    console.error('Missing RenderTestBuilder or drawing function for vertical line test');
    return;
  }

  return new RenderTestBuilder()
    .withId('lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--vertical-orient')
    .withTitle('Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Vertical')
    .withDescription('Tests crisp rendering of a vertical 1px line centered between pixels using canvas code.')
    .runCanvasCode(draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient)
    // --- Checks from original add1PxVerticalLineCenteredAtPixelTest --- 
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck() // Uses return value from draw_ function
    // --- End checks ---
    .build(); 
}

// Define and register the test immediately when this script is loaded.
define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient(); 