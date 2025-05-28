/**
 * @fileoverview Test definition for a single 1px stroked rounded rectangle centered at a grid point.
 */

// Helper functions like _colorObjectToString, getRandomColor, placeCloseToCenterAtGrid, 
// and adjustDimensionsForCrispStrokeRendering are assumed to be globally available
// from included utility scripts (e.g., random-utils.js, scene-creation-utils.js)
// and use SeededRandom internally as needed.

/**
 * Creates a path for a rounded rectangle.
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} x The x-coordinate of the top-left corner.
 * @param {number} y The y-coordinate of the top-left corner.
 * @param {number} width The width of the rectangle.
 * @param {number} height The height of the rectangle.
 * @param {number} radius The corner radius.
 */
/*
function _roundedRectPath(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y + radius, radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}
*/

/**
 * Draws a single 1px stroked rounded rectangle, centered at a grid point.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it should draw one primary shape for visual
 *                  regression, and `instances` count for performance, each with unique properties based on SeededRandom.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function draw_rounded_rect_single_1px_stroke_crisp_center_grid(ctx, currentIterationNumber, instances = null) {
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
        // console.warn(msg); // Or throw error as per original checkCanvasHasEvenDimensions if critical
    }

    for (let i = 0; i < numToDraw; i++) {
        // Determine center point (integer coordinates for grid centering)
        // Adapted from placeCloseToCenterAtGrid(canvasWidth, canvasHeight)
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        // SeededRandom Call 1: rectWidth base
        const baseRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
        // SeededRandom Call 2: rectHeight base
        const baseRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

        // Adjust dimensions for a 1px stroke centered at the grid point
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseRectWidth, baseRectHeight, 1, { x: centerX, y: centerY });
        const finalRectWidth = adjusted.width;
        const finalRectHeight = adjusted.height;

        // SeededRandom Call 3: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        
        const strokeColorStr = 'rgba(255,0,0,1)'; // Red, Opaque
        const fillColorStr = 'rgba(0,0,0,0)';   // Transparent

        let geomX = centerX - finalRectWidth / 2;
        let geomY = centerY - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            // For performance, spread additional shapes widely using Math.random for position only
            // Properties (width, height, radius) are already randomized per instance via SeededRandom
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.fillStyle = fillColorStr; // Though transparent, set it for consistency
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1;

        // Use the new polyfilled/context method
        ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);

        if (!isPerformanceRun || i === 0) { // Log and checkData only for the first/single instance
            const currentLogs = [
                `RoundedRect: center=(${centerX},${centerY}), base W/H=(${baseRectWidth},${baseRectHeight}), adj W/H=(${finalRectWidth},${finalRectHeight}), r=${radius}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            // Calculate checkData based on the geometry of the first drawn instance
            if (i === 0) {
                 // For a 1px stroke, the boundary is inclusive of the pixels the stroke touches.
                 // If geomX/geomY are *.5 (typical for crisp 1px stroke), Math.floor gives the pixel coord.
                 // If geomX/geomY are integer, it's also the pixel coord.
                 // The guide's example for *.5 coordinates: Math.floor(x + finalRectWidth)
                checkData = {
                    leftX: Math.floor(geomX),
                    rightX: Math.floor(geomX + finalRectWidth),
                    topY: Math.floor(geomY),
                    bottomY: Math.floor(geomY + finalRectHeight)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; // No logs or checkData for multi-instance perf runs (except potentially first for debugging)
    }
    return { logs, checkData };
}

// Register the test
registerHighLevelTest(
    'rounded-rect--single--1px-stroke--crisp--center-grid--test.js',
    draw_rounded_rect_single_1px_stroke_crisp_center_grid,
    'rounded-rects',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Single 1px Stroked Rounded Rectangle (Crisp, Centered at Grid)',
        description: 'Tests crisp rendering of a single 1px red stroked rounded rectangle, centered at a grid crossing.',
        displayName: 'Perf: RRect 1px Crisp Grid Center'
    }
); 