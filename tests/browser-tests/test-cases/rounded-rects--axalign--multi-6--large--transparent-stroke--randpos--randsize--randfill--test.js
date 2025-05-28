/**
 * @fileoverview Test definition for multiple large, transparent-stroked rounded rectangles.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Adapted from placeRoundedRectWithFillAndStrokeBothCrisp in src/scene-creation/scene-creation-rounded-rects.js
 * Calculates parameters for a rectangle aiming for crisp fill and stroke.
 * This version is specific to tests needing maxStrokeWidth = 40.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {{initialCenter: {x: number, y: number}, adjustedDimensions: {width: number, height: number}, strokeWidth: number}}
 */
function _placeRectForLargeTransparentTest(canvasWidth, canvasHeight) {
    const maxAllowedContentWidth = canvasWidth * 0.6;
    const maxAllowedContentHeight = canvasHeight * 0.6;
    const maxStrokeWidth = 40; // As used in the original addLargeTransparentRoundedRectangles

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
    return { initialCenter, adjustedDimensions, strokeWidth };
}


/**
 * Draws multiple large rounded rectangles with transparent strokes.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 6 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rects_axalign_multi_6_large_transparent_stroke_randpos_randsize_randfill(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 6; // Original test draws 6

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const fixedRadius = 40; // Fixed radius for this test

    for (let i = 0; i < numToDraw; i++) {
        // Calls 1-4 for SeededRandom happen inside _placeRectForLargeTransparentTest
        const placement = _placeRectForLargeTransparentTest(canvasWidth, canvasHeight);
        let currentCenter = placement.initialCenter; 
        const finalRectWidth = placement.adjustedDimensions.width;
        const finalRectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // SeededRandom Call 5: xOffset
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        // SeededRandom Call 6: yOffset
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        
        const finalCenter = {
            x: currentCenter.x + xOffset,
            y: currentCenter.y + yOffset
        };

        const strokeColorObj = { r: 0, g: 0, b: 0, a: 50 }; // Fixed: Black, very transparent
        // SeededRandom Call 7: fillColor (can be semi-transparent)
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        let geomX = finalCenter.x - finalRectWidth / 2;
        let geomY = finalCenter.y - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) { 
             geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
             geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, fixedRadius);
        if (strokeWidth > 0) {
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, fixedRadius);
        }

        if (!isPerformanceRun) { 
            logs.push(
                `LargeTransRRect ${i+1}: center=(${finalCenter.x.toFixed(1)},${finalCenter.y.toFixed(1)}), W/H=(${finalRectWidth},${finalRectHeight}), r=${fixedRadius}, sw=${strokeWidth.toFixed(1)}`
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
    'rounded-rects--axalign--multi-6--large--transparent-stroke--randpos--randsize--randfill--test.js',
    draw_rounded_rects_axalign_multi_6_large_transparent_stroke_randpos_randsize_randfill,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Large Transparent-Stroke Rounded Rectangles (Multiple, Random Params)',
        description: 'Tests rendering of multiple large rounded rectangles with transparent strokes, random fills, and fixed large radius.',
        displayName: 'Perf: 6 Large TranspStroke RRects'
    }
); 