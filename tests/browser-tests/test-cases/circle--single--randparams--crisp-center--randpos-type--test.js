/**
 * @fileoverview Test definition for a single random circle with proper pixel alignment.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// placeCloseToCenterAtPixel, placeCloseToCenterAtGrid are assumed globally available.

/**
 * Adapts the logic from calculateCircleParameters to generate circle properties.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {object} An object containing centerX, centerY, radius, strokeWidth, and atPixel.
 */
function _calculateSingleRandomCircleParams(canvasWidth, canvasHeight) {
    const minRadius = 10;
    const maxRadius = 225; // Max radius from original options
    const minStrokeWidth = 1;
    const maxStrokeWidth = 30; // Max stroke width from original options

    // SeededRandom Call 1: atPixel determination
    const atPixel = SeededRandom.getRandom() < 0.5;
  
    let centerX, centerY;
    if (atPixel) {
        centerX = Math.floor(canvasWidth / 2) + 0.5;
        centerY = Math.floor(canvasHeight / 2) + 0.5;
    } else {
        centerX = Math.floor(canvasWidth / 2);
        centerY = Math.floor(canvasHeight / 2);
    }
  
    // SeededRandom Call 2: base diameter
    const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
    const baseRadius = diameter / 2;
  
    // SeededRandom Call 3: strokeWidth
    // Max allowed stroke is also limited by radius size (original had baseRadius/1 but that seems too large for thinner circles)
    // Let's use a simpler constraint like ensuring stroke is not more than radius itself for very small circles.
    const maxAllowedStrokeByRadius = Math.max(1, baseRadius); 
    const strokeWidth = minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeByRadius));
  
    // Note: Original calculateCircleParameters had logic for randomPosition, which is false for this specific test case.

    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, strokeWidth, { x: centerX, y: centerY });
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
  
    return { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel };
}


/**
 * Draws a single random circle with proper pixel alignment.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function draw_circle_single_randparams_crisp_center_randpos_type(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // SR calls 1-3 happen inside _calculateSingleRandomCircleParams
        const params = _calculateSingleRandomCircleParams(canvasWidth, canvasHeight);
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 4: strokeColor
        const strokeColorObj = getRandomColor(150, 230);
        // SR Call 5: fillColor 
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }
        
        ctx.fillAndStrokeCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a,
            strokeWidth, 
            strokeColorForRender.r, strokeColorForRender.g, strokeColorForRender.b, strokeColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `SingleRandomCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, centerType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                const effectiveRadius = radius + strokeWidth / 2;
                checkData = {
                    leftX: Math.floor(centerX - effectiveRadius),
                    rightX: Math.floor(centerX - effectiveRadius + effectiveRadius * 2 - 1),
                    topY: Math.floor(centerY - effectiveRadius),
                    bottomY: Math.floor(centerY - effectiveRadius + effectiveRadius * 2 - 1)
                };
            }
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs, checkData };
}

/**
 * Defines and registers the single random circle test case.
 */
function define_circle_single_randparams_crisp_center_randpos_type_test() {
    return new RenderTestBuilder()
        .withId('circle--single--randparams--crisp-center--randpos-type') // Derived from: single-random-circle
        .withTitle('Single Random Circle (Crisp, Random Center Type)')
        .withDescription('Tests a single random circle with random params, crisp center (grid or pixel), stroke, and fill.')
        .runCanvasCode(draw_circle_single_randparams_crisp_center_randpos_type)
        .withExtremesCheck(0.03)
        .withNoGapsInStrokeEdgesCheck()
        .withUniqueColorsCheck(3)
        .withSpecklesCheckOnSwCanvas()
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_circle_single_randparams_crisp_center_randpos_type_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_circle_single_randparams_crisp_center_randpos_type === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'circle--single--randparams--crisp-center--randpos-type',
        drawFunction: draw_circle_single_randparams_crisp_center_randpos_type,
        displayName: 'Perf: Circle SingleRand Crisp RandCenterType',
        description: 'Performance of a single random circle with crisp center (randomly grid/pixel aligned). ',
        category: 'circles' 
    });
} 