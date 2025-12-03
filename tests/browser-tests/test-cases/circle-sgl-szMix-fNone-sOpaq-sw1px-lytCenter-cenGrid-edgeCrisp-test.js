/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests crisp rendering of a single 1px red stroked circle, centered at a grid crossing.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test draws a circle shape.
 * | Count                  | single         | The test draws a single instance of the shape in its primary visual mode.
 * | SizeCategory           | mixed          | The radius is randomized in the range [10, 74.5], which spans XS, S, and M size categories.
 * | FillStyle              | none           | No fill is applied; only a stroke operation is performed.
 * | StrokeStyle            | opaque         | The stroke color is explicitly set to be fully opaque (alpha = 255).
 * | StrokeThickness        | 1px            | The stroke width is hardcoded to 1 pixel.
 * | Layout                 | centered       | The shape is positioned at the canvas center.
 * | CenteredAt             | grid           | The center coordinates are integers (Math.floor), aligning the center to a grid intersection.
 * | EdgeAlignment          | crisp          | The test name specifies "crisp" and code uses `adjustDimensionsForCrispStrokeRendering`.
 * | Orientation            | N/A            | Circles are rotationally symmetric, so orientation is not an applicable facet.
 * | ArcAngleExtent         | N/A            | This facet is only applicable to arc shapes.
 * | RoundRectRadius        | N/A            | This facet is only applicable to rounded rectangle shapes.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not apply any clipping.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The specific stroke color is a fixed opaque red.
 * - When run in performance mode, the test draws multiple instances at random positions, which differs
 *   from the single, centered instance in visual test mode.
 *
 */

/**
 * @fileoverview Test definition for a single 1px stroked circle centered at a grid point.
 */

// Helper functions _colorObjectToString, placeCloseToCenterAtGrid, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Draws a single 1px stroked circle, centered at a grid point.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp grid-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        const baseDiameter = Math.floor(20 + SeededRandom.getRandom() * 130);
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseDiameter, baseDiameter, 1, { x: centerX, y: centerY });
        const finalDiameter = adjusted.width;
        const radius = finalDiameter / 2;
        
        // Stroke color is fixed red, opaque. Fill is transparent.
        const strokeColor = new Color(255, 0, 0, 255);

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }

        ctx.strokeCircle(drawCenterX, drawCenterY, radius, 1, strokeColor);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `Circle Centered@Grid: center=(${centerX},${centerY}), baseDiam=${baseDiameter}, adjDiam=${finalDiameter}, r=${radius.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // CheckData calculation from original add1PxStrokeCenteredCircleAtGrid
                // These are expected to be inclusive pixel coordinates
                checkData = {
                    leftX: centerX - radius - 0.5,
                    rightX: centerX + radius - 0.5,
                    topY: centerY - radius - 0.5,
                    bottomY: centerY + radius - 0.5
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
    'circle-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenGrid-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        totalUniqueColors: 1,
        continuousStroke: true
    },
    {
        title: 'Single 1px Stroked Circle (Crisp, Centered at Grid)',
        description: 'Tests crisp rendering of a single 1px red stroked circle, centered at a grid crossing.',
        displayName: 'Perf: Circle 1px Crisp Grid Center'
        // The description above will also be used for the performance test registry entry.
    }
); 
