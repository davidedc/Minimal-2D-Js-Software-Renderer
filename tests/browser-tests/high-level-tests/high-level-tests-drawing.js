/**
 * Draws a single, 1px thick, fully opaque horizontal line centered vertically
 * between pixels, with variable width and potentially swapped start/end points.
 * Mirrors the logic of `add1PxHorizontalLineCenteredAtPixel` and `add1PxHorizontalLine`
 * from the original scene creation files.
 *
 * @param {CanvasRenderingContext2D | SWRendererAPI} ctx - The rendering context (either native Canvas or SW Renderer wrapper).
 * @param {number} currentIterationNumber - The current test iteration (unused in this specific function but part of the signature).
 * @returns {{topY: number, bottomY: number, leftX: number, rightX: number}} The expected pixel extremes of the drawn line.
 */
function draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient(ctx, currentIterationNumber) {
    // Assume SeededRandom is available globally and seeded externally.
    // Assume renderTestWidth/Height are available from the context.
    const renderTestWidth = ctx.canvas.width;
    const renderTestHeight = ctx.canvas.height;

    // Logic from add1PxHorizontalLineCenteredAtPixel
    const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    const centerX = Math.floor(renderTestWidth / 2);
    const centerY = Math.floor(renderTestHeight / 2) + 0.5; // Key: centered *between* pixels

    // Logic from add1PxHorizontalLine
    const leftX = Math.floor(centerX - lineWidth / 2);
    const rightX = leftX + lineWidth;
    const pixelY = Math.floor(centerY);

    let startX = leftX;
    let endX = rightX;
    // Randomly swap start/end points
    if (SeededRandom.getRandom() < 0.5) {
        const temp = startX;
        startX = endX;
        endX = temp;
    }

    // Set drawing properties
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)';

    // Draw the line using the canvas-like API
    // strokeLine is an extension provided by SWRendererAPI, assumes CanvasRenderingContext2D is polyfilled or compatible
    ctx.strokeLine(startX, centerY, endX, centerY);


    // Calculate and return the expected extremes
    // The original extremes were inclusive for rightX.
    const extremes = {
        topY: pixelY,
        bottomY: pixelY,
        leftX: leftX,
        rightX: rightX - 1
    };

    return extremes;
} 