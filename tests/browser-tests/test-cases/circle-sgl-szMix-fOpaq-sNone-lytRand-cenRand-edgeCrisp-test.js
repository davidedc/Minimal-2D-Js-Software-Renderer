/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single randomly positioned circle with no stroke, random fill, and crisp rendering. The circle's radius and position are randomized within defined constraints.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test calls `ctx.fillCircle()` to draw the shape.
 * | Count                  | single         | The test logic is designed to draw one primary shape instance per iteration.
 * | SizeCategory           | mixed          | The radius is randomized in the range [10, 225], which spans the S, M, L, and XL size categories.
 * | FillStyle              | semitransparent| `getRandomColor("semitransparent")` is called for the fill, which returns a semitransparent color.
 * | StrokeStyle            | none           | The `strokeWidth` variable is explicitly set to 0 and no stroke operation is performed.
 * | StrokeThickness        | none           | Consistent with `StrokeStyle: none` as `strokeWidth` is 0.
 * | Layout                 | random         | A single shape is placed at a random (x, y) position within calculated canvas margins.
 * | CenteredAt             | random         | The final center coordinates (x, y) are fully randomized, not snapped to a grid or pixel center.
 * | EdgeAlignment          | crisp          | The test explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A            | Not applicable; this facet is for `arcs` only.
 * | RoundRectRadius        | N/A            | Not applicable; this facet is for `rounded-rects` only.
 * | ContextTranslation     | none           | The test does not call `ctx.translate()`.
 * | ContextRotation        | none           | The test does not call `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not call `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping region is defined or applied in this test.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The specific randomization range for the circle's radius is [10, 225]. The fill color is also randomized. The `randpos-explicit` part of the original filename refers to the specific logic that calculates a random position within safe canvas margins to ensure the entire shape is visible.
 *
 */

/**
 * @fileoverview Test definition for a single randomly positioned circle with no stroke.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single randomly positioned circle with no stroke.
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
        // SR calls 1-4 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: false,        // No stroke
            randomPosition: true,    // Enable random positioning
            marginX: 10,
            marginY: 10
        });
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 5: fillColor 
        const fillColorObj = getRandomColor("semitransparent");
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // The _calculate... function already handles random positioning for each call.
        // No additional Math.random() needed for spreading in performance mode unless overriding SR logic.

        ctx.fillCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RandPosNoStrokeCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // effectiveRadius is just radius since strokeWidth is 0
                checkData = {
                    leftX: Math.floor(centerX - radius),
                    rightX: Math.floor(centerX - radius + radius * 2 - 1),
                    topY: Math.floor(centerY - radius),
                    bottomY: Math.floor(centerY - radius + radius * 2 - 1)
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
    'circle-sgl-szMix-fOpaq-sNone-lytRand-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInFillEdges: true,
        totalUniqueColors: 1,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle Without Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with no stroke, random fill, and crisp center.',
        displayName: 'Perf: Circle RandPos NoStroke Crisp'
    }
); 
