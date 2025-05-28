/**
 * @fileoverview Test definition for 8 rounded rectangles with no stroke and fixed size/radius.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Rounds the x and y coordinates of a point object.
 * @param {{x: number, y: number}} point The point to round.
 * @returns {{x: number, y: number}} The point with rounded coordinates.
 */
function _roundPoint(point) {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}

/**
 * Draws 8 rounded rectangles with no stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 8 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rects_multi_8_no_stroke_fixed_size_large_radius_randpos_randfill(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 8; // Original test draws 8

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    const fixedWidth = 200;
    const fixedHeight = 200;
    const fixedRadius = 40;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1 & 2 (approx, inside getRandomPoint)
        const randomCenter = getRandomPoint(1, canvasWidth, canvasHeight); 
        const center = _roundPoint(randomCenter); // Ensures integer coords for grid alignment

        // SeededRandom Call 3: fillColor (can be semi-transparent)
        const fillColorObj = getRandomColor(100, 200);
        const fillColorStr = _colorObjectToString(fillColorObj);

        let geomX = center.x - fixedWidth / 2;
        let geomY = center.y - fixedHeight / 2;

        if (isPerformanceRun && numToDraw > 1) { 
             if (i > 0 || numToDraw > 1) { // Spread all instances in perf mode for this one
                geomX = Math.random() * Math.max(0, canvasWidth - fixedWidth);
                geomY = Math.random() * Math.max(0, canvasHeight - fixedHeight);
            }
        } else { // For visual regression, ensure shapes are reasonably on canvas
            geomX = Math.max(0 - fixedWidth / 4, Math.min(geomX, canvasWidth - fixedWidth * 3/4));
            geomY = Math.max(0 - fixedHeight / 4, Math.min(geomY, canvasHeight - fixedHeight * 3/4));
        }
        
        ctx.fillStyle = fillColorStr;
        // No strokeStyle or lineWidth needed as strokeWidth is 0

        ctx.fillRoundRect(geomX, geomY, fixedWidth, fixedHeight, fixedRadius);
        // No ctx.strokeRoundRect() call

        if (!isPerformanceRun) { 
            logs.push(
                `NoStrokeRRect ${i+1}: center=(${center.x},${center.y}), W/H=(${fixedWidth},${fixedHeight}), r=${fixedRadius}`
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
    'rounded-rects--multi-8--no-stroke--fixed-size-large-radius--randpos--randfill--test.js',
    draw_rounded_rects_multi_8_no_stroke_fixed_size_large_radius_randpos_randfill,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Rounded Rectangles Without Stroke (Multiple, Fixed Size, Random Pos)',
        description: 'Tests rendering of 8 rounded rectangles with no stroke, only fill, fixed size/radius, and random positions.',
        displayName: 'Perf: 8 NoStroke RRects FixedSize RandPos'
    }
); 