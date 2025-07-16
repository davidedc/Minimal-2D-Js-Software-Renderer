/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.
 * 
 * 
 * ---
 * 
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles            | The test focuses on rendering a circle.
 * | Count                  | single             | The test draws a single circle instance in its visual verification mode.
 * | SizeCategory           | mixed              | The radius is randomized in a range of [10, 225), which spans multiple T-shirt size categories (S, M, L, XL).
 * | FillStyle              | opaque             | `getRandomColor()` is called for the fill, which defaults to an opaque color (alpha=1.0).
 * | StrokeStyle            | opaque             | `getRandomColor()` is called for the stroke, which also defaults to an opaque color.
 * | StrokeThickness        | 1px-30px           | Stroke width is randomized with `1 + floor(SR.get()*min(30, baseRadius))`, resulting in a range of 1-30px.
 * | Layout                 | centered           | The circle's center coordinates are explicitly calculated to be at the canvas center.
 * | CenteredAt             | mixed-pixel-grid   | A random flag (`atPixel`) determines if the center is on a pixel (`*.5`) or grid (`integer`) line.
 * | EdgeAlignment          | crisp              | The `adjustDimensionsForCrispStrokeRendering()` function is explicitly called to ensure sharp edges.
 * | Orientation            | N/A                | Not applicable to circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A                | Not applicable to circles.
 * | RoundRectRadius        | N/A                | Not applicable to circles.
 * | ContextTranslation     | none               | `ctx.translate()` is not used in this test.
 * | ContextRotation        | none               | `ctx.rotate()` is not used in this test.
 * | ContextScaling         | none               | `ctx.scale()` is not used in this test.
 * | Clipped on shape       | none               | No clipping path is defined or applied in this test.
 * | Clipped on shape count | n/a                | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a          | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a                | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The randomization of the fill and stroke colors is not captured in the filename.
 * - The stroke width's dependency on the circle's radius (`Math.min(30, baseRadius)`) is a nuance not fully captured by the simple `1px-30px` range.
 * - The term "randpos-type" from the original filename referred to the random choice between grid-snapped and pixel-snapped centering, which is now captured by the `CenteredAt` facet.
 * 
 */

/**
 * @fileoverview Test definition for a single random circle with proper pixel alignment.
 */

// Helper functions getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// calculateCircleTestParameters are available from test-helper-functions.js


/**
 * Draws a single random circle with proper pixel alignment.
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
        // SR calls 1-3 happen inside calculateCircleTestParameters
        const params = calculateCircleTestParameters({
            canvasWidth,
            canvasHeight,
            minRadius: 10,
            maxRadius: 225,
            hasStroke: true,         // Has stroke
            minStrokeWidth: 1,
            maxStrokeWidth: 30,
            randomPosition: false,   // Centered, not randomly positioned
            marginX: 10,             // Default margins (not used since randomPosition=false)
            marginY: 10
        });
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 4: strokeColor
        const strokeColorObj = getRandomColor("semitransparent");
        // SR Call 5: fillColor 
        const fillColorObj = getRandomColor("semitransparent");

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }
        
        ctx.fillAndStrokeCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a,
            strokeWidth, 
            strokeColorForRender.r, strokeColorForRender.g, strokeColorForRender.b, strokeColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `SingleRandomCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, centerType=${atPixel ? 'pixel' : 'grid'}`
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
    'circle-sgl-szMix-fOpaq-sOpaq-sw1-30px-lytCenter-cenMixPG-edgeCrisp-test',
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
        title: 'Single Random Circle (Crisp, Random Center Type)',
        description: 'Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.',
        displayName: 'Perf: Circle SingleRand Crisp RandCenterType'
        // The description above will also be used for the performance test registry entry.
    }
); 
