/**
 * @fileoverview Test definition for a single circle with fully random parameters.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws a single circle with fully random parameters (position, size, colors, stroke width).
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_circle_single_fully_random(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1 & 2 (inside getRandomPoint for x, y)
        const center = getRandomPoint(1, canvasWidth, canvasHeight); 
        // SeededRandom Call 3: radius
        const radius = 15 + SeededRandom.getRandom() * 50; 
        // SeededRandom Call 4 & 5 for angles are skipped as we draw a full circle.
        // SeededRandom Call 6: strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        // SeededRandom Call 7: strokeColor 
        const strokeColorObj = getRandomColor(100, 200); 
        // SeededRandom Call 8: fillColor
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = center.x;
        let drawCenterY = center.y;

        if (isPerformanceRun && numToDraw > 1) {
            // For multiple instances in perf mode, each already has fully random params including position.
            // No additional Math.random() needed to spread if each SR sequence produces a different center.
            // However, getRandomPoint(1, canvasWidth, canvasHeight) will ensure they are spread.
        }
        
        ctx.fillAndStrokeCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a,
            strokeWidth, 
            strokeColorForRender.r, strokeColorForRender.g, strokeColorForRender.b, strokeColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            logs.push(
                `FullyRandomCircle ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'circle--single--fully-random--test.js',
    draw_circle_single_fully_random,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        totalUniqueColors: 3,
        //speckles: true,
        noGapsInStrokeEdges: true
    },
    {
        displayName: 'Perf: Circle FullyRandom',
        description: 'Performance of a single fully random circle.'
    }
); 