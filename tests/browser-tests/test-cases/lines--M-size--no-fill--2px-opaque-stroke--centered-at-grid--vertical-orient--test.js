/**
 * @fileoverview Test definition for rendering a medium-sized, vertical, 2px thick,
 * opaque stroke line centered at a grid intersection.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient function:
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
 * Draws a single, 2px thick, fully opaque vertical line centered horizontally
 * at a grid line (integer x-coordinate), with variable height and potentially
 * swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations for base line (using SeededRandom for reproducibility)
    const baseLineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2); // Center at grid crossing
    const baseCenterY = Math.floor(effectiveHeight / 2); // Center at grid crossing
    const baseTopY = Math.floor(baseCenterY - baseLineHeight / 2);
    const baseBottomY = baseTopY + baseLineHeight;
    const baseLeftPixelX = baseCenterX - 1;  // Left pixel column for 2px line centered at integer X
    const baseRightPixelX = baseCenterX; // Right pixel column

    // Set drawing properties once
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red, matching original
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentCenterX, currentStartY, currentEndY; // For drawing, declared outside loop for single instance checkData access

    for (let i = 0; i < numIterations; i++) {
        let startY = baseTopY; // Loop-local for clarity of base points per iteration
        let endY = baseBottomY;
        
        // Randomly swap start/end points using SeededRandom for base primitive
        if (SeededRandom.getRandom() < 0.5) {
            [startY, endY] = [endY, startY];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentCenterX = baseCenterX; // centerX is fixed for a vertical line
        currentStartY = startY;
        currentEndY = endY;

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical.
            const maxOffsetX = effectiveWidth - (baseRightPixelX + 1); // Ensure 2px line fits
            const minOffsetX = -baseLeftPixelX;
            const maxOffsetY = effectiveHeight - Math.max(currentStartY, currentEndY);
            const minOffsetY = -Math.min(currentStartY, currentEndY);

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentCenterX += offsetX; // This shifts the center of the 2px line
            currentStartY += offsetY;
            currentEndY += offsetY;
        }

        // --- Single Drawing Block ---
        if (typeof ctx.strokeLine === 'function') {
          ctx.strokeLine(currentCenterX, currentStartY, currentCenterX, currentEndY);
        } else {
          ctx.beginPath();
          ctx.moveTo(currentCenterX, currentStartY);
          ctx.lineTo(currentCenterX, currentEndY);
          ctx.stroke();
        }
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            logs.push(`&#x2500; 2px Red line from (${currentCenterX.toFixed(0)}, ${currentStartY.toFixed(0)}) to (${currentCenterX.toFixed(0)}, ${currentEndY.toFixed(0)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (!isMultiInstance) {
        // For single instance, extremes are based on the un-offsetted line from the single iteration.
        const extremes = {
            leftX: baseLeftPixelX,   // Uses base pixel Xs derived from un-offsetted baseCenterX
            rightX: baseRightPixelX,
            topY: Math.min(currentStartY, currentEndY), // Values from the single loop iteration
            bottomY: Math.max(currentStartY, currentEndY) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null;
    }
}

// Register the test
registerHighLevelTest(
    'lines--M-size--no-fill--2px-opaque-stroke--centered-at-grid--vertical-orient--test.js',
    draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__vertical_orient,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        uniqueColors: {
            middleRow: { count: 1 },
            middleColumn: { count: 1 } // Added MiddleColumn
        }, 
        extremes: true
    },
    {
        title: 'Lines: M-Size No-Fill 2px-Opaque-Stroke Centered-At-Grid Vertical',
        description: 'Tests crisp rendering of a vertical 2px line centered at grid crossing using canvas code.',
        displayName: 'Perf: Lines M 2px Grid Vertical'
    }
); 