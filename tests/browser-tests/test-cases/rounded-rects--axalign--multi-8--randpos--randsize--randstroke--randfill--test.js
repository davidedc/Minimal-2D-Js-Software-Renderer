/**
 * @fileoverview Test definition for multiple axis-aligned rounded rectangles with random parameters.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Adapted from placeRoundedRectWithFillAndStrokeBothCrisp in src/scene-creation/scene-creation-rounded-rects.js
 * Calculates parameters for a rectangle aiming for crisp fill and stroke.
 * This version is specific to the needs of the axis-aligned rounded rectangles test (e.g. maxStrokeWidth = 10).
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {{initialCenter: {x: number, y: number}, adjustedDimensions: {width: number, height: number}, strokeWidth: number}}
 */
function _placeRectForAxisAlignedTest(canvasWidth, canvasHeight) {
    const maxAllowedContentWidth = canvasWidth * 0.6;
    const maxAllowedContentHeight = canvasHeight * 0.6;
    const maxStrokeWidth = 10; // As used in the original addAxisAlignedRoundedRectangles -> placeRoundedRectWithFillAndStrokeBothCrisp(10)

    // SeededRandom Call 1: base strokeWidth
    let strokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidth + 1);
    strokeWidth = strokeWidth % 2 === 0 ? strokeWidth : strokeWidth + 1; // Ensure even

    let initialCenter = { x: canvasWidth / 2, y: canvasHeight / 2 }; // Base center on grid

    // SeededRandom Call 2: Center offset (50% chance to be on pixel center)
    if (SeededRandom.getRandom() < 0.5) {
        initialCenter = { x: initialCenter.x + 0.5, y: initialCenter.y + 0.5 };
    }

    // SeededRandom Call 3: base rectWidth
    let rectWidth = Math.round(50 + SeededRandom.getRandom() * maxAllowedContentWidth);
    // SeededRandom Call 4: base rectHeight
    let rectHeight = Math.round(50 + SeededRandom.getRandom() * maxAllowedContentHeight);

    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, initialCenter);
    return { initialCenter, adjustedDimensions, strokeWidth }; // Return initialCenter before random offset
}


/**
 * Draws multiple axis-aligned rounded rectangles with random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 8 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rects_axalign_multi_8_randpos_randsize_randstroke_randfill(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 8; // Original test draws 8

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Calls 1-4 for SeededRandom happen inside _placeRectForAxisAlignedTest
        const placement = _placeRectForAxisAlignedTest(canvasWidth, canvasHeight);
        let currentCenter = placement.initialCenter; // This is the center *before* the per-instance random offset
        const finalRectWidth = placement.adjustedDimensions.width;
        const finalRectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // SeededRandom Call 5: xOffset
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        // SeededRandom Call 6: yOffset
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        
        // Apply the random offset to get the final center for this specific rectangle
        const finalCenter = {
            x: currentCenter.x + xOffset,
            y: currentCenter.y + yOffset
        };

        // SeededRandom Call 7: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        // SeededRandom Call 8: strokeColor (opaque)
        const strokeColorObj = getRandomColor(200, 255); 
        // SeededRandom Call 9: fillColor (can be semi-transparent)
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        let geomX = finalCenter.x - finalRectWidth / 2;
        let geomY = finalCenter.y - finalRectHeight / 2;

        // For performance mode, if drawing multiple instances, ensure the base properties are unique per instance (done by SR calls)
        // then spread them out using Math.random for position only for instances *after the first one for that frame*.
        if (isPerformanceRun && numToDraw > 1) { // Apply to all instances in perf run
             geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
             geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        } else if (!isPerformanceRun) { // For visual regression (numToDraw = 8), ensure shapes are reasonably on canvas
            geomX = Math.max(0 - finalRectWidth / 4, Math.min(geomX, canvasWidth - finalRectWidth * 3/4));
            geomY = Math.max(0 - finalRectHeight / 4, Math.min(geomY, canvasHeight - finalRectHeight* 3/4));
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        if (strokeWidth > 0) {
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        }

        if (!isPerformanceRun) { 
            logs.push(
                `AxAlignedRRect ${i+1}: center=(${finalCenter.x.toFixed(1)},${finalCenter.y.toFixed(1)}), W/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, sw=${strokeWidth.toFixed(1)}`
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
    'rounded-rects--axalign--multi-8--randpos--randsize--randstroke--randfill--test.js',
    draw_rounded_rects_axalign_multi_8_randpos_randsize_randstroke_randfill,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Axis-Aligned Rounded Rectangles (Multiple, Random Params)',
        description: 'Tests rendering of multiple axis-aligned rounded rectangles with random positions, sizes, strokes, fills, and corner radii.',
        displayName: 'Perf: 8 AxAlign RRects RandParams'
    }
); 