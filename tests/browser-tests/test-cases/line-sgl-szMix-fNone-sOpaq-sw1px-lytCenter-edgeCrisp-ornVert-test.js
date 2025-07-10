/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests the crisp rendering of a single, vertical 1px opaque red line. The line is centered on the canvas, and its length is randomized across S, M, and L size categories. Its horizontal position is set between pixels to test for correct pixel snapping.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws line primitives.
 * | Count                  | single         | The test draws a single line instance in its primary visual mode.
 * | SizeCategory           | mixed          | The line's length is randomized in the range `[20, 149]`, which spans the S `(16-39px)`, M `(40-79px)`, and L `(80-159px)` size categories.
 * | FillStyle              | none           | No fill is applied to the line; `ctx.fillStyle` is set to be fully transparent.
 * | StrokeStyle            | opaque         | The line is stroked with an opaque color (`rgb(255, 0, 0)`), which has an alpha of 1.0.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is explicitly set to `1`.
 * | Layout                 | centered       | The line's geometric center is positioned at the center of the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to lines, as their position is defined by endpoints, not a center point in the same way as circles or rectangles.
 * | EdgeAlignment          | crisp          | The line is vertical and its `x` coordinate is set to a `.5` value (`Math.floor(width / 2) + 0.5`), a key technique for ensuring a 1px vertical line renders crisply on a single column of pixels.
 * | Orientation            | vertical       | The line is drawn with identical start and end `x` coordinates.
 * | ArcAngleExtent         | N/A            | Not applicable to lines.
 * | RoundRectRadius        | N/A            | Not applicable to lines.
 * | ContextTranslation     | none           | The code does not use `ctx.translate()`.
 * | ContextRotation        | none           | The code does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The code does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The code does not use `ctx.clip()`.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The stroke color is hardcoded to be opaque red (`rgb(255, 0, 0)`), which is more specific than the `sOpaq` facet value implies.
 *
 */

/**
 * @fileoverview Test definition for rendering a medium-sized, vertical, 1px thick,
 * opaque stroke line positioned precisely between pixels horizontally.
 *
 * Guiding Principles for the draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient function:
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
 * Draws a single, 1px thick, fully opaque vertical line centered horizontally
 * between pixels, with variable height and potentially swapped start/end points.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (unused here but required by signature).
 * @param {?number} instances - Number of instances to draw (optional). If > 0, draw multiple instances.
 * @returns {?{ logs: string[], checkData: {topY: number, bottomY: number, leftX: number, rightX: number} }} Log entries and expected pixel extremes, or null if drawing multiple instances.
 */
function draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient(ctx, currentIterationNumber, instances = null) {
    const currentCanvasWidth = ctx.canvas.width;
    const currentCanvasHeight = ctx.canvas.height;

    if (currentCanvasWidth % 2 !== 0 || currentCanvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test.");
    }

    const isMultiInstance = instances !== null && instances > 0;

    // Use context dimensions
    const effectiveWidth = currentCanvasWidth;
    const effectiveHeight = currentCanvasHeight;

    // Common calculations
    const baseLineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
    const baseCenterX = Math.floor(effectiveWidth / 2) + 0.5; // Key: centered *between* pixels horizontally
    const baseCenterY = Math.floor(effectiveHeight / 2);
    const baseTopY = Math.floor(baseCenterY - baseLineHeight / 2);
    const baseBottomY = baseTopY + baseLineHeight; // Canvas lines go up to, but don't include, the end coordinate pixel row for vertical lines.
    const basePixelX = Math.floor(baseCenterX); // The single pixel column involved

    // Set drawing properties once
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255, 0, 0)'; // Blue, matching original vertical line test
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';

    const numIterations = isMultiInstance ? instances : 1;
    let logs = isMultiInstance ? null : [];

    let currentCenterX; // Declared outside the loop
    let currentStartY;  // Declared outside the loop
    let currentEndY;    // Declared outside the loop

    for (let i = 0; i < numIterations; i++) {
        let startY = baseTopY; // These are loop-local for clarity of base points per iteration
        let endY = baseBottomY;
        // Randomly swap start/end points for variety (even for single instance)
        if (SeededRandom.getRandom() < 0.5) {
            [startY, endY] = [endY, startY];
        }

        // Initialize/Assign final draw coordinates for this iteration
        currentCenterX = baseCenterX;
        currentStartY = startY;
        currentEndY = endY;

        if (isMultiInstance) {
            // For multiple instances, use Math.random() for offsets.
            // Reproducibility of these specific offsets is not critical;
            // speed and simplicity are preferred here.
            const maxOffsetX = effectiveWidth - 1 - currentCenterX; // Use currentCenterX for bounds
            const minOffsetX = -Math.floor(currentCenterX);
            const unoffsettedMaxY = Math.max(startY, endY);
            const unoffsettedMinY = Math.min(startY, endY);
            const maxOffsetY = effectiveHeight - unoffsettedMaxY; 
            const minOffsetY = -unoffsettedMinY;

            const offsetX = Math.floor(Math.random() * (maxOffsetX - minOffsetX + 1)) + minOffsetX;
            const offsetY = Math.floor(Math.random() * (maxOffsetY - minOffsetY + 1)) + minOffsetY;

            // Apply offsets to the drawing coordinates
            currentCenterX += offsetX;
            currentStartY += offsetY;
            currentEndY += offsetY;
        }
        // No 'else' block needed here anymore as currentStartY/EndY will hold the correct single-instance values

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
            // Log only for the single instance case
            logs.push(`&#x2500; 1px Red line from (${currentCenterX.toFixed(1)}, ${currentStartY.toFixed(1)}) to (${currentCenterX.toFixed(1)}, ${currentEndY.toFixed(1)}) color: ${ctx.strokeStyle} thickness: ${ctx.lineWidth}`);
        }
    }

    // Return results
    if (!isMultiInstance) {
        // Calculate and return the expected extremes (inclusive pixel coordinates)
        // currentStartY and currentEndY hold the values from the single loop iteration
        const extremes = {
            leftX: basePixelX,
            rightX: basePixelX,
            topY: Math.min(currentStartY, currentEndY),
            bottomY: Math.max(currentStartY, currentEndY) - 1
        };
        return { logs: logs, checkData: extremes };
    } else {
        return null; // No logs or checkData for multiple instances
    }
}

// Register the test
registerHighLevelTest(
    'line-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-edgeCrisp-ornVert-test',
    draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__vertical_orient,
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
        title: 'Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Vertical',
        description: 'Tests crisp rendering of a vertical 1px line centered between pixels using canvas code.',
        displayName: 'Perf: Lines M 1px Crisp Vertical'
    }
); 
