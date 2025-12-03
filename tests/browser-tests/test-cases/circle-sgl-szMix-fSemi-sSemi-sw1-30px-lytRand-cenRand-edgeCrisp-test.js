/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Tests a single circle with fully randomized parameters for position, size, fill, and stroke. The final rendering is adjusted to ensure the circle's edges are crisp (pixel-aligned).
 * 
 * 
 * ---
 * 
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test draws circles using `ctx.fillAndStrokeCircle()`.
 * | Count                  | single         | The test is designed to draw a single circle instance in its primary visual test mode.
 * | SizeCategory           | mixed          | The `baseRadius` is randomized in a range of [10, 224], spanning multiple size categories (XS-XL).
 * | FillStyle              | semitransparent | `getRandomColor()` is called for the fill with an alpha bracket of [100, 200].
 * | StrokeStyle            | semitransparent | `getRandomColor()` is called for the stroke with an alpha bracket of [150, 230].
 * | StrokeThickness        | 1px-30px       | `strokeWidth` is randomized between a minimum of 1 and a maximum of 30.
 * | Layout                 | random         | The circle's final `(centerX, centerY)` is explicitly randomized within the canvas boundaries.
 * | CenteredAt             | random         | The final center coordinates are determined by the random layout and are not snapped to a grid or pixel.
 * | EdgeAlignment          | crisp          | The code calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | N/A            | Circles are rotationally symmetrical, so this facet is not applicable.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to circles.
 * | RoundRectRadius        | N/A            | This facet is not applicable to circles.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not use clipping.
 * | Clipped on shape count | n/a            | No clipping is used.
 * | Clipped on shape arrangement| n/a       | No clipping is used.
 * | Clipped on shape size  | n/a            | No clipping is used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The `strokeWidth` is randomized from 1px up to a maximum of 30px, but it's also capped by the `baseRadius` of the circle to prevent visual artifacts where the stroke is wider than the radius.
 * - The final position is randomized within the canvas boundaries while respecting a 10px margin.
 * 
 */

/**
 * @fileoverview Test definition for a single randomly positioned circle with stroke.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single randomly positioned circle with stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-5 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: true,         // Has stroke
            minStrokeWidth: 1,
            maxStrokeWidth: 30,
            randomPosition: true,    // Enable random positioning
            marginX: 10,
            marginY: 10
        });
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 6: strokeColor
        const strokeColor = getRandomColor("semitransparent");
        // SR Call 7: fillColor
        const fillColor = getRandomColor("semitransparent");

        // The centerX, centerY from params are already the final random positions for drawing.
        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // For performance test, if we draw many, their properties (radius, stroke, initial center type) are already varied by SeededRandom.
        // The calculateCircleTestParameters already ensures random positioning for each.
        // So, no additional Math.random() for x/y offset needed here unless we want to override the SR-based random positioning.
        // The current setup already provides good distribution and varied parameters per instance.

        ctx.fillAndStrokeCircle(drawCenterX, drawCenterY, radius, fillColor, strokeWidth, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RandPosCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                const effectiveRadius = radius + strokeWidth / 2;
                checkData = {
                    leftX: Math.floor(centerX - effectiveRadius),
                    rightX: Math.floor(centerX - effectiveRadius + effectiveRadius * 2 - 1),
                    topY: Math.floor(centerY - effectiveRadius),
                    bottomY: Math.floor(centerY - effectiveRadius + effectiveRadius * 2 - 1)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'circle-sgl-szMix-fSemi-sSemi-sw1-30px-lytRand-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInStrokeEdges: true,
        totalUniqueColors: 3,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle with Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with random params, crisp stroke/fill.',
        displayName: 'Perf: Circle RandPos Crisp'
    }
); 
