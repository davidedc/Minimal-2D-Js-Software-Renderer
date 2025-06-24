/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single, horizontal line with a 1px opaque stroke. The line's length is randomized but falls within a range spanning S, M, and L size categories. It is programmatically centered on the canvas and positioned on a half-pixel Y-coordinate to ensure it renders crisply.
 *
 * New Filename: line-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-edgeCrisp-ornHoriz-test.js
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine`.
 * | Count                  | single         | The test is designed to draw one line in its primary visual testing mode (`instances` is null).
 * | SizeCategory           | mixed          | Line length is randomized in `[20, 149]`, spanning S (16-39), M (40-79), and L (80-159) categories.
 * | FillStyle              | none           | No fill operation is performed.
 * | StrokeStyle            | opaque         | Stroke is set to a fully opaque color: `rgb(255, 0, 0)`.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is explicitly set to `1`.
 * | Layout                 | centered       | The line's base position is calculated relative to the canvas center.
 * | CenteredAt             | N/A            | Facet is not applicable to lines.
 * | EdgeAlignment          | crisp          | The vertical position is set to `y + 0.5`, a key technique for crisp horizontal 1px lines.
 * | Orientation            | horizontal     | The line is drawn with a constant Y-coordinate, making it perfectly horizontal.
 * | ArcAngleExtent         | N/A            | Not an arc.
 * | RoundRectRadius        | N/A            | Not a rounded rectangle.
 * | ContextTranslation     | none           | The code does not use `ctx.translate()`.
 * | ContextRotation        | none           | The code does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The code does not use `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping is performed.
 * | Clipped on shape count | n/a            | No clipping.
 * | Clipped on shape arrangement | n/a      | No clipping.
 * | Clipped on shape size  | n/a            | No clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is fixed as opaque red (`rgb(255, 0, 0)`).
 * - For reproducibility in single-instance mode, all random values (line length, start/end point swapping) are derived from `SeededRandom`.
 *
 */
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

// Register the test
registerHighLevelTest(
    'lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient--test.js',
    draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient,
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
        title: 'Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Horizontal',
        description: 'Tests crisp rendering of a horizontal 1px line centered between pixels using canvas code.',
        displayName: 'Perf: Lines M 1px Crisp Horizontal'
    }
); 