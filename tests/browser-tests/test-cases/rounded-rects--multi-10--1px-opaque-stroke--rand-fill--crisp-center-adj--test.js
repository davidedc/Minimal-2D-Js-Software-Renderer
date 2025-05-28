/**
 * @fileoverview Test definition for 10 thin, opaque-stroked rounded rectangles with 1px line width.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint, adjustCenterForCrispStrokeRendering 
// are assumed globally available and use SeededRandom internally as needed.

/**
 * Rounds the x and y coordinates of a point object.
 * @param {{x: number, y: number}} point The point to round.
 * @returns {{x: number, y: number}} The point with rounded coordinates.
 */
function _roundPoint(point) {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}

/**
 * Draws 10 thin, opaque-stroked rounded rectangles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 10 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rects_multi_10_1px_opaque_stroke_rand_fill_crisp_center_adj(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 10; // Original test draws 10

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1: width
        const width = Math.round(50 + SeededRandom.getRandom() * 100);
        // SeededRandom Call 2: height
        const height = Math.round(50 + SeededRandom.getRandom() * 100);
        
        // SeededRandom Call 3 & 4 (approx, inside getRandomPoint)
        // The starting initialisation of center is a random point, then rounded for grid crossing.
        const randomCenter = getRandomPoint(1, canvasWidth, canvasHeight); // Assuming decimalPlaces=1, then pass canvas W/H
        const centerGrid = _roundPoint(randomCenter); // Ensures integer coords for grid alignment before adjustment

        // adjustCenterForCrispStrokeRendering is for a 1px stroke.
        const adjustedCenter = adjustCenterForCrispStrokeRendering(centerGrid.x, centerGrid.y, width, height, 1);

        // SeededRandom Call 5: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2);
        
        // SeededRandom Call 6: strokeColor (opaque)
        const strokeColorObj = getRandomColor(255, 255); 
        // SeededRandom Call 7: fillColor (can be semi-transparent)
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        // For drawing, use the adjusted center and original width/height
        let geomX = adjustedCenter.x - width / 2;
        let geomY = adjustedCenter.y - height / 2;

        if (isPerformanceRun) { // For additional instances in perf mode, spread them out
             if (i > 0) { // Keep first instance as per original logic for potential single-frame visual check
                geomX = Math.random() * Math.max(0, canvasWidth - width);
                geomY = Math.random() * Math.max(0, canvasHeight - height);
             }
        } else { // For visual regression, ensure shapes are reasonably on canvas
            geomX = Math.max(0 - width/4, Math.min(geomX, canvasWidth - width*3/4));
            geomY = Math.max(0 - height/4, Math.min(geomY, canvasHeight - height*3/4 ));
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1; // Fixed 1px stroke

        ctx.fillRoundRect(geomX, geomY, width, height, radius);
        ctx.strokeRoundRect(geomX, geomY, width, height, radius);

        if (!isPerformanceRun) { 
            logs.push(
                `ThinRRect ${i+1}: adjCenter=(${adjustedCenter.x.toFixed(1)},${adjustedCenter.y.toFixed(1)}), W/H=(${width},${height}), r=${radius}`
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
    'rounded-rects--multi-10--1px-opaque-stroke--rand-fill--crisp-center-adj--test.js',
    draw_rounded_rects_multi_10_1px_opaque_stroke_rand_fill_crisp_center_adj,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: '10 Thin Opaque-Stroke Rounded Rectangles (1px, Crisp Center Adj.)',
        description: 'Tests rendering of 10 rounded rectangles with 1px opaque strokes, random fills, and crisp center adjustment.',
        displayName: 'Perf: 10 RRects ThinOpaque AdjCenter'
    }
); 