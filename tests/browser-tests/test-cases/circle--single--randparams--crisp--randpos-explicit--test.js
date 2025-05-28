/**
 * @fileoverview Test definition for a single randomly positioned circle with stroke.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// placeCloseToCenterAtPixel, placeCloseToCenterAtGrid are assumed globally available.

/**
 * Adapts the logic from calculateCircleParameters for a randomly positioned circle with stroke.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {object} An object containing centerX, centerY, radius, strokeWidth, finalDiameter, and atPixel (initial alignment type).
 */
function _calculateRandomPositionCircleParams(canvasWidth, canvasHeight) {
    const minRadius = 10;
    const maxRadius = 225;
    const hasStroke = true;
    const minStrokeWidth = 1;
    const maxStrokeWidth = 30;
    const marginX = 10; // Default marginX from original options
    const marginY = 10; // Default marginY from original options

    // SeededRandom Call 1: atPixel determination (influences initial centering before random positioning)
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
  
    // SeededRandom Call 3: strokeWidth
    const maxAllowedStrokeByRadius = Math.max(1, baseRadius);
    const strokeWidth = minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeByRadius));
  
    // Random Positioning Logic (SR calls 4 & 5 if used, or different SR path if not)
    let finalCenterX, finalCenterY;
    const totalRadiusForBounds = baseRadius + (strokeWidth / 2);
    const minX = Math.ceil(totalRadiusForBounds + marginX);
    const maxX = Math.floor(canvasWidth - totalRadiusForBounds - marginX);
    const minY = Math.ceil(totalRadiusForBounds + marginY);
    const maxY = Math.floor(canvasHeight - totalRadiusForBounds - marginY);
    
    let currentDiameterForPositioning = diameter;
    if (maxX <= minX || maxY <= minY) { // Circle too large for initial random placement with margins
        currentDiameterForPositioning = Math.min(Math.floor(canvasWidth / 4), Math.floor(canvasHeight / 4));
        const newTotalRadius = (currentDiameterForPositioning / 2) + (strokeWidth / 2);
        const newMinX = Math.ceil(newTotalRadius + marginX);
        const newMaxX = Math.floor(canvasWidth - newTotalRadius - marginX);
        const newMinY = Math.ceil(newTotalRadius + marginY);
        const newMaxY = Math.floor(canvasHeight - newTotalRadius - marginY);
        // SeededRandom Call 4 & 5 (for position within new tighter bounds)
        finalCenterX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
        finalCenterY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
    } else {
        // SeededRandom Call 4 & 5 (for position within original safe bounds)
        finalCenterX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
        finalCenterY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
    }

    // Adjust dimensions for crisp rendering based on the *final* random center
    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, strokeWidth, { x: finalCenterX, y: finalCenterY });
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
  
    return { centerX: finalCenterX, centerY: finalCenterY, radius, strokeWidth, finalDiameter, atPixel }; // atPixel refers to initial alignment before random pos
}


/**
 * Draws a single randomly positioned circle with stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function draw_circle_single_randparams_crisp_randpos_explicit(ctx, currentIterationNumber, instances = null) {
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
        // SR calls 1-5 happen inside _calculateRandomPositionCircleParams
        const params = _calculateRandomPositionCircleParams(canvasWidth, canvasHeight);
        let { centerX, centerY, radius, strokeWidth, finalDiameter, atPixel } = params;
        
        // SR Call 6: strokeColor
        const strokeColorObj = getRandomColor(150, 230);
        // SR Call 7: fillColor 
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        // The centerX, centerY from params are already the final random positions for drawing.
        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // For performance test, if we draw many, their properties (radius, stroke, initial center type) are already varied by SeededRandom.
        // The _calculateRandomPositionCircleParams already ensures random positioning for each.
        // So, no additional Math.random() for x/y offset needed here unless we want to override the SR-based random positioning.
        // The current setup already provides good distribution and varied parameters per instance.

        ctx.fillAndStrokeCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a,
            strokeWidth, 
            strokeColorForRender.r, strokeColorForRender.g, strokeColorForRender.b, strokeColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RandPosCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
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

// Register the test
registerHighLevelTest(
    'circle--single--randparams--crisp--randpos-explicit--test.js',
    draw_circle_single_randparams_crisp_randpos_explicit,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInStrokeEdges: true,
        totalUniqueColors: 3,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle with Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with random params, crisp stroke/fill.',
        displayName: 'Perf: Circle RandPos Crisp'
    }
); 