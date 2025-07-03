/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests the crisp rendering of a single horizontal 2px line. The line has a fixed opaque red stroke, no fill, and is centered on the canvas at an integer Y-coordinate (grid line). Its length is randomized, spanning multiple t-shirt size categories (S, M, L).
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | line           | The test draws line primitives using `strokeLine` or `moveTo/lineTo`.
 * | Count                  | single         | The test's primary mode draws one instance per run.
 * | SizeCategory           | mixed          | The code `Math.floor(20 + SeededRandom.getRandom() * 130)` generates a length of [20, 149], which spans the S, M, and L size categories.
 * | FillStyle              | none           | `fillStyle` is explicitly set to transparent and no fill operation is performed.
 * | StrokeStyle            | opaque         | `strokeStyle` is set to `'rgb(255, 0, 0)'`, which is a fully opaque color.
 * | StrokeThickness        | 2px            | `lineWidth` is hardcoded to `2`.
 * | Layout                 | centered       | The line's start and end points are calculated relative to the canvas center.
 * | CenteredAt             | N/A            | This facet is not applicable to line primitives.
 * | EdgeAlignment          | crisp          | The combination of a horizontal orientation, an even `lineWidth` (2px), and an integer Y-coordinate for the center ensures the stroke perfectly covers two pixel rows without anti-aliasing.
 * | Orientation            | horizontal     | The line is drawn with a constant Y-coordinate for both its start and end points.
 * | ArcAngleExtent         | N/A            | Not an arc.
 * | RoundRectRadius        | N/A            | Not a rounded rectangle.
 * | ContextTranslation     | none           | No `ctx.translate()` calls are made.
 * | ContextRotation        | none           | No `ctx.rotate()` calls are made.
 * | ContextScaling         | none           | No `ctx.scale()` calls are made.
 * | Clipped on shape       | none           | No `ctx.clip()` calls are made.
 * | Clipped on shape count | n/a            | No clipping is applied.
 * | Clipped on shape arrangement | n/a      | No clipping is applied.
 * | Clipped on shape size  | n/a            | No clipping is applied.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is specifically fixed to opaque red (`rgb(255, 0, 0)`), which is not captured by the `sOpaq` facet alone.
 *
 */
/**
 * @fileoverview Test definition for rendering a medium-sized, horizontal, 2px thick,
 * opaque stroke line centered at a grid intersection.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient function:
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
 * Draws a single, 2px thick, fully opaque horizontal line centered vertically
 * at a grid line (integer y-coordinate), with variable width and potentially
 * swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient(ctx, currentIterationNumber, instances = null) {
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
    const baseCenterX = Math.floor(effectiveWidth / 2); // Center at grid crossing
    const baseCenterY = Math.floor(effectiveHeight / 2); // Center at grid crossing
    const baseLeftX = Math.floor(baseCenterX - baseLineWidth / 2);
    const baseRightX = baseLeftX + baseLineWidth;
    const baseTopPixelY = baseCenterY - 1; // Top row for 2px line centered at integer Y
    const baseBottomPixelY = baseCenterY;   // Bottom row

    // Set drawing properties once
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Red, matching original
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
            const maxOffsetY = effectiveHeight - (baseBottomPixelY + 1); // Ensure 2px line fits
            const minOffsetY = -baseTopPixelY;

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentStartX += offsetX;
            currentEndX += offsetX;
            currentCenterY += offsetY; // This shifts the center of the 2px line
        }

        // --- Single Drawing Block ---
        if (typeof ctx.strokeLine === 'function') {
          ctx.strokeLine(currentStartX, currentCenterY, currentEndX, currentCenterY);
        } else {
          ctx.beginPath();
          ctx.moveTo(currentStartX, currentCenterY);
          ctx.lineTo(currentEndX, currentCenterY);
          ctx.stroke();
        }
        // --- End Single Drawing Block ---

        if (!isMultiInstance) {
            logs.push(`&#x2500; 2px Red line from (${currentStartX.toFixed(0)}, ${currentCenterY.toFixed(0)}) to (${currentEndX.toFixed(0)}, ${currentCenterY.toFixed(0)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    if (!isMultiInstance) {
        // For single instance, extremes are based on the un-offsetted line from the single iteration.
        const extremes = {
            topY: baseTopPixelY,       // Uses base pixel Ys derived from un-offsetted baseCenterY
            bottomY: baseBottomPixelY,
            leftX: Math.min(currentStartX, currentEndX), // Values from the single loop iteration
            rightX: Math.max(currentStartX, currentEndX) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null;
    }
}

// Register the test
registerHighLevelTest(
    'line-sgl-szMix-fNone-sOpaq-sw2px-lytCenter-edgeCrisp-ornHoriz-test.js',
    draw_lines__M_size__no_fill__2px_opaque_stroke__centered_at_grid__horizontal_orient,
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
        title: 'Lines: M-Size No-Fill 2px-Opaque-Stroke Centered-At-Grid Horizontal',
        description: 'Tests crisp rendering of a horizontal 2px line centered at grid crossing using canvas code.',
        displayName: 'Perf: Lines M 2px Grid Horizontal'
    }
); 
