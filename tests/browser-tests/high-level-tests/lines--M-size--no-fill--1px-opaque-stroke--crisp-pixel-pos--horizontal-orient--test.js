/**
 * @fileoverview Test definition for rendering a medium-sized, horizontal, 1px thick,
 * opaque stroke line positioned precisely between pixels.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient function:
 * - General:
 *   - Canvas width and height must be even; an error is thrown otherwise.
 *   - Drawing logic is consolidated into a single loop to handle both single and multiple instances,
 *     reducing code duplication.
 * - Multiple Instances (when 'instances' parameter > 0):
 *   - No logging is performed, and the function returns `null`.
 *   - Positional offsets for each instance are applied directly to the primitive's coordinates
 *     (e.g., line endpoints) rather than using canvas transformations (like `ctx.translate()`).
 *   - The random offsets for these multiple instances are generated using `Math.random()` for simplicity
 *     and potential performance benefits, as the exact reproducibility of these specific offsets
 *     is not considered critical for this mode. The base primitive's characteristics remain
 *     reproducible via `SeededRandom` for the single instance case or base calculations.
 *   - Offsets are integers and aim to keep the primitive visible within the canvas.
 * - Single Instance (when 'instances' is null or <= 0):
 *   - Original behavior is maintained: logs are collected, and checkData is returned.
 *   - `SeededRandom` is used for all random elements to ensure test reproducibility.
 */

/**
 * Draws a single, 1px thick, fully opaque horizontal line centered vertically
 * between pixels, with variable width and potentially swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here but required by signature).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations for base line (using SeededRandom for reproducibility)
    const baseLineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2);
    const baseCenterY = Math.floor(effectiveHeight / 2) + 0.5; // Key: centered *between* pixels vertically
    const baseLeftX = Math.floor(baseCenterX - baseLineWidth / 2);
    const baseRightX = baseLeftX + baseLineWidth;
    const basePixelY = Math.floor(baseCenterY); // The single pixel row involved

    // Set drawing properties once
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentStartX, currentEndX, currentCenterY; // For drawing, declared outside loop for single instance checkData access

    for (let i = 0; i < numIterations; i++) {
        let startX = baseLeftX; // Loop-local for clarity of base points per iteration
        let endX = baseRightX;
        
        // Randomly swap start/end points using SeededRandom for base primitive
        if (SeededRandom.getRandom() < 0.5) {
            [startX, endX] = [endX, startX];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentStartX = startX;
        currentEndX = endX;
        currentCenterY = baseCenterY; // centerY is fixed for a horizontal line

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical.
            const maxOffsetX = effectiveWidth - Math.max(currentStartX, currentEndX);
            const minOffsetX = -Math.min(currentStartX, currentEndX);
            const maxOffsetY = effectiveHeight - 1 - currentCenterY; // -1 because line is on pixel Y
            const minOffsetY = -Math.floor(currentCenterY);

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentStartX += offsetX;
            currentEndX += offsetX;
            currentCenterY += offsetY;
        }

        // --- Single Drawing Block ---
        // Original code used ctx.strokeLine directly. Let's assume it's available or polyfilled.
        ctx.strokeLine(currentStartX, currentCenterY, currentEndX, currentCenterY);
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            logs.push(`&#x2500; 1px Red line from (${currentStartX.toFixed(1)}, ${currentCenterY.toFixed(1)}) to (${currentEndX.toFixed(1)}, ${currentCenterY.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (!isMultiInstance) {
        // For single instance, extremes are based on the un-offsetted line from the single iteration.
        // currentStartX, currentEndX, and basePixelY (derived from baseCenterY) are used.
        const extremes = {
            topY: basePixelY,
            bottomY: basePixelY,
            leftX: Math.min(currentStartX, currentEndX), // Values from the single loop iteration
            rightX: Math.max(currentStartX, currentEndX) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null;
    }
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
if (typeof RenderTestBuilder === 'function') {
  define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient();
} 