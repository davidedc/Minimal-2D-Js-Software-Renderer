/**
 * @fileoverview Test definition for multiple precise random circles with strokes and fills.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// placeCloseToCenterAtPixel, placeCloseToCenterAtGrid are assumed globally available.

/**
 * Adapts the logic from calculateCircleParameters for multiple precise random circles.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {object} An object containing centerX, centerY, radius, strokeWidth, finalDiameter, and atPixel (initial alignment type).
 */
function _calculateMultiplePreciseRandomCirclesParams(canvasWidth, canvasHeight) {
    const minRadius = 8;
    const maxRadius = 42;
    const hasStroke = true;
    const minStrokeWidth = 1;
    const maxStrokeWidth = 4;
    const marginX = 60; 
    const marginY = 60;

    // SeededRandom Call 1: atPixel determination
    const atPixel = SeededRandom.getRandom() < 0.5;
  
    let initialCenterX, initialCenterY; // Base for positioning logic, not necessarily the drawn center's type
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
  
    // SeededRandom Call 3: strokeWidth
    const maxAllowedStrokeByRadius = Math.max(1, baseRadius);
    const strokeWidth = minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeByRadius));
  
    // Random Positioning Logic (SR calls 4 & 5 if used)
    let finalCenterX, finalCenterY;
    const totalRadiusForBounds = baseRadius + (strokeWidth / 2);
    const minX = Math.ceil(totalRadiusForBounds + marginX);
    const maxX = Math.floor(canvasWidth - totalRadiusForBounds - marginX);
    const minY = Math.ceil(totalRadiusForBounds + marginY);
    const maxY = Math.floor(canvasHeight - totalRadiusForBounds - marginY);
    
    let currentDiameterForPositioning = diameter;
    if (maxX <= minX || maxY <= minY) { 
        currentDiameterForPositioning = Math.min(Math.floor(canvasWidth / 4), Math.floor(canvasHeight / 4));
        const newTotalRadius = (currentDiameterForPositioning / 2) + (strokeWidth / 2);
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
  
    return { centerX: finalCenterX, centerY: finalCenterY, radius, strokeWidth, finalDiameter, atPixel };
}


/**
 * Draws multiple precise random circles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 12 circles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_circles_multi_12_precise_randparams_randpos(ctx, currentIterationNumber, instances = null) {
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
        // SR calls 1-5 happen inside _calculateMultiplePreciseRandomCirclesParams
        const params = _calculateMultiplePreciseRandomCirclesParams(canvasWidth, canvasHeight);
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 6: strokeColor (opaque)
        // The original used palette indexing (i, count) for getRandomColor. 
        // Using simpler version here; adjust if color checks (if any were added) fail.
        const strokeColorObj = getRandomColor(200, 255);
        // SR Call 7: fillColor (semi-transparent)
        const fillColorObj = getRandomColor(150, 200); 

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;
        
        // The _calculate... function already handles random positioning for each call.
        // In performance mode, each of the `instances` circles will have unique, random parameters.
        // No need for Math.random() here to further offset, as positions are already varied.

        ctx.fillAndStrokeCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a,
            strokeWidth, 
            strokeColorForRender.r, strokeColorForRender.g, strokeColorForRender.b, strokeColorForRender.a
        );

        if (!isPerformanceRun) { 
            logs.push(
                `PreciseRandCircle ${i+1}: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

/**
 * Defines and registers the multiple precise random circles test case.
 */
function define_circles_multi_12_precise_randparams_randpos_test() {
    return new RenderTestBuilder()
        .withId('circles--multi-12--precise--randparams--randpos') // Derived from: multiple-precise-random-circles
        .withTitle('Multiple Precise Random Circles (Stroked & Filled)')
        .withDescription('Tests rendering of 12 circles with precise pixel alignment, varied strokes and fills, and random positions.')
        .runCanvasCode(draw_circles_multi_12_precise_randparams_randpos)
        // No specific checks in original test definition
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_circles_multi_12_precise_randparams_randpos_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_circles_multi_12_precise_randparams_randpos === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'circles--multi-12--precise--randparams--randpos',
        drawFunction: draw_circles_multi_12_precise_randparams_randpos,
        displayName: 'Perf: 12 Precise RandCircles',
        description: 'Performance of 12 precise random circles with varied strokes/fills.',
        category: 'circles' 
    });
} 