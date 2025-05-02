/**
 * @fileoverview Test definition for rendering a medium-sized, horizontal, 1px thick,
 * opaque stroke line positioned precisely between pixels.
 */

/**
 * Draws a single, 1px thick, fully opaque horizontal line centered vertically
 * between pixels, with variable width and potentially swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here but required by signature).
 * @returns {{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes.
 */
function draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient(ctx, currentIterationNumber) {
    let logs = [];
    // Assume SeededRandom is available globally and seeded externally by RenderTest.
    // Assume renderTestWidth/Height are available from the context canvas.
    const renderTestWidth = ctx.canvas.width;
    const renderTestHeight = ctx.canvas.height;

    // Logic from original add1PxHorizontalLineCenteredAtPixel
    const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    const centerX = Math.floor(renderTestWidth / 2);
    const centerY = Math.floor(renderTestHeight / 2) + 0.5; // Key: centered *between* pixels

    // Logic from original add1PxHorizontalLine
    const leftX = Math.floor(centerX - lineWidth / 2);
    const rightX = leftX + lineWidth; // Canvas lines go up to, but don't include, the end coordinate pixel column for horizontal lines.
    const pixelY = Math.floor(centerY); // The single pixel row involved

    let startX = leftX;
    let endX = rightX;
    // Randomly swap start/end points
    if (SeededRandom.getRandom() < 0.5) {
        [startX, endX] = [endX, startX]; // Use destructuring assignment for swap
    }

    // Set drawing properties
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Use transparent fill to be safe

    // Draw the line using the canvas-like API, checking for strokeLine method
    ctx.strokeLine(startX, centerY, endX, centerY);
    logs.push(`&#x2500; 1px Red line from (${startX.toFixed(1)}, ${centerY.toFixed(1)}) to (${endX.toFixed(1)}, ${centerY.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);

    // Calculate and return the expected extremes (inclusive pixel coordinates)
    const extremes = {
        topY: pixelY,
        bottomY: pixelY,
        leftX: Math.min(startX, endX), // Use actual min/max after potential swap
        rightX: Math.max(startX, endX) - 1 // -1 because lineTo's end is exclusive pixel coord
    };

    return { logs: logs, checkData: extremes };
}

/**
 * Defines and registers the test case using RenderTestBuilder.
 */
function define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient() {
    return new RenderTestBuilder()
      .withId('lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient')
      .withTitle('Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Horizontal')
      .withDescription('Tests crisp rendering of a horizontal 1px line centered between pixels using canvas code.')
      .runCanvasCode(draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient) // Use the new drawing function
      .withColorCheckMiddleRow({ expectedUniqueColors: 1 }) // Same check as original
      .withColorCheckMiddleColumn({ expectedUniqueColors: 1 }) // Same check as original
      .withExtremesCheck() // Same check as original, uses return value from runCanvasCode
      .build(); // Creates and registers the RenderTest instance
}

// Define and register the test immediately when this script is loaded.
define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient(); 