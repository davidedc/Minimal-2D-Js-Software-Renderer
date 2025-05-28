/**
 * @fileoverview Test definition for a single 1px stroked circle centered at a pixel.
 */

// Helper functions _colorObjectToString, placeCloseToCenterAtPixel, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Draws a single 1px stroked circle, centered at a pixel.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function draw_circle_single_1px_stroke_crisp_center_pixel(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp pixel-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Determine center point (e.g., 100.5, 100.5 for pixel centering)
        // Adapting placeCloseToCenterAtPixel(canvasWidth, canvasHeight)
        const centerX = Math.floor(canvasWidth / 2) + 0.5;
        const centerY = Math.floor(canvasHeight / 2) + 0.5;

        // SeededRandom Call 1: diameter base
        const baseDiameter = Math.floor(20 + SeededRandom.getRandom() * 130);
        
        // Adjust dimensions for a 1px stroke centered at the pixel center
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseDiameter, baseDiameter, 1, { x: centerX, y: centerY });
        const finalDiameter = adjusted.width; 
        const radius = finalDiameter / 2;
        
        // Stroke color is fixed red, opaque. Fill is transparent.
        const r = 255, g = 0, b = 0, a = 255;

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }
        
        // Use the dedicated strokeCircle method
        ctx.strokeCircle(drawCenterX, drawCenterY, radius, 1, r, g, b, a);

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `Circle Centered@Pixel: center=(${centerX},${centerY}), baseDiam=${baseDiameter}, adjDiam=${finalDiameter}, r=${radius.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // CheckData calculation from original add1PxStrokeCenteredCircleAtPixel
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
    'circle--single--1px-stroke--crisp--center-pixel--test.js',
    draw_circle_single_1px_stroke_crisp_center_pixel,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        totalUniqueColors: 1,
        continuousStroke: true
    },
    {
        title: 'Single 1px Stroked Circle (Crisp, Centered at Pixel)',
        description: 'Tests crisp rendering of a single 1px red stroked circle, centered at a pixel center.',
        displayName: 'Perf: Circle 1px Crisp Pixel Ctr'
        // The description above will also be used for the performance test registry entry.
    }
); 