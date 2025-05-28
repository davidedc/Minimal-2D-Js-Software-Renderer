/**
 * @fileoverview Test definition for multiple precise fill-only circles.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// placeCloseToCenterAtPixel, placeCloseToCenterAtGrid are assumed globally available.

/**
 * Adapts the logic from calculateCircleParameters for multiple precise, fill-only random circles.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {object} An object containing centerX, centerY, radius, finalDiameter, and atPixel (initial alignment type).
 */
function _calculateMultiplePreciseNoStrokeCirclesParams(canvasWidth, canvasHeight) {
    const minRadius = 8;
    const maxRadius = 42;
    const strokeWidth = 0; // No stroke
    const marginX = 60; 
    const marginY = 60;

    // SeededRandom Call 1: atPixel determination
    const atPixel = SeededRandom.getRandom() < 0.5;
  
    let initialCenterX, initialCenterY; 
    if (atPixel) {
        initialCenterX = Math.floor(canvasWidth / 2) + 0.5;
        initialCenterY = Math.floor(canvasHeight / 2) + 0.5;
    } else {
        initialCenterX = Math.floor(canvasWidth / 2);
        initialCenterY = Math.floor(canvasHeight / 2);
    }
  
    // SeededRandom Call 2: base diameter
    const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
    const baseRadius = diameter / 2;
  
    // No SeededRandom call for strokeWidth as it's 0.
  
    // Random Positioning Logic (SR calls 3 & 4 if used)
    let finalCenterX, finalCenterY;
    const totalRadiusForBounds = baseRadius; // No strokeWidth to add
    const minX = Math.ceil(totalRadiusForBounds + marginX);
    const maxX = Math.floor(canvasWidth - totalRadiusForBounds - marginX);
    const minY = Math.ceil(totalRadiusForBounds + marginY);
    const maxY = Math.floor(canvasHeight - totalRadiusForBounds - marginY);
    
    let currentDiameterForPositioning = diameter;
    if (maxX <= minX || maxY <= minY) { 
        currentDiameterForPositioning = Math.min(Math.floor(canvasWidth / 4), Math.floor(canvasHeight / 4));
        const newTotalRadius = (currentDiameterForPositioning / 2);
        const newMinX = Math.ceil(newTotalRadius + marginX);
        const newMaxX = Math.floor(canvasWidth - newTotalRadius - marginX);
        const newMinY = Math.ceil(newTotalRadius + marginY);
        const newMaxY = Math.floor(canvasHeight - newTotalRadius - marginY);
        finalCenterX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
        finalCenterY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
    } else {
        finalCenterX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
        finalCenterY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
    }

    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, strokeWidth, { x: finalCenterX, y: finalCenterY });
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
  
    return { centerX: finalCenterX, centerY: finalCenterY, radius, finalDiameter, atPixel };
}


/**
 * Draws multiple precise, fill-only random circles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 12 circles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_circles_multi_12_precise_no_stroke_randparams_randpos(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 12; // Original test draws 12

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-4 happen inside _calculateMultiplePreciseNoStrokeCirclesParams
        const params = _calculateMultiplePreciseNoStrokeCirclesParams(canvasWidth, canvasHeight);
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 5: fillColor (opaque, original used palette indexing)
        const fillColorObj = getRandomColor(200, 255); 

        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;
        
        ctx.fillCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a
        );

        if (!isPerformanceRun) { 
            logs.push(
                `PreciseNoStrokeCircle ${i+1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
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
    'circles--multi-12--precise--no-stroke--randparams--randpos--test.js',
    draw_circles_multi_12_precise_no_stroke_randparams_randpos,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Multiple Precise Fill-Only Circles (Random Params & Pos)',
        description: 'Tests rendering of 12 circles with no strokes, only fills, precise alignment, and random parameters/positions.',
        displayName: 'Perf: 12 Precise NoStroke RandCircles'
    }
); 