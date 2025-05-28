/**
 * @fileoverview Test definition for a single circle with no stroke and only fill.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// placeCloseToCenterAtPixel, placeCloseToCenterAtGrid are assumed globally available.

/**
 * Adapts the logic from calculateCircleParameters for a no-stroke circle.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {object} An object containing centerX, centerY, radius, and atPixel.
 */
function _calculateSingleNoStrokeCircleParams(canvasWidth, canvasHeight) {
    const minRadius = 10;
    const maxRadius = 225;
    const hasStroke = false; // Key difference for this test
    const strokeWidth = 0;   // Effectively 0

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
  
    // No SeededRandom call for strokeWidth as hasStroke is false.

    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, strokeWidth, { x: centerX, y: centerY });
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
  
    return { centerX, centerY, radius, finalDiameter, atPixel }; // strokeWidth is implicitly 0
}


/**
 * Draws a single circle with no stroke, only fill.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function draw_circle_single_no_stroke_randparams_crisp_center_randpos_type(ctx, currentIterationNumber, instances = null) {
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
        // SR calls 1-2 happen inside _calculateSingleNoStrokeCircleParams
        const params = _calculateSingleNoStrokeCircleParams(canvasWidth, canvasHeight);
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 3: fillColor 
        const fillColorObj = getRandomColor(100, 200);
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        if (isPerformanceRun && numToDraw > 1) {
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
        }
        
        // Use the dedicated fillCircle method
        ctx.fillCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `SingleNoStrokeCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, centerType=${atPixel ? 'pixel' : 'grid'}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                // effectiveRadius is just radius since strokeWidth is 0
                checkData = {
                    leftX: Math.floor(centerX - radius),
                    rightX: Math.floor(centerX - radius + radius * 2 - 1),
                    topY: Math.floor(centerY - radius),
                    bottomY: Math.floor(centerY - radius + radius * 2 - 1)
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
    'circle--single--no-stroke--randparams--crisp-center--randpos-type--test.js',
    draw_circle_single_no_stroke_randparams_crisp_center_randpos_type,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInFillEdges: true,
        totalUniqueColors: 1,
        speckles: true
    },
    {
        title: 'Single Circle Without Stroke (Crisp, Random Center Type)',
        description: 'Tests rendering of a single circle with no stroke, only fill, random params, and crisp center (grid or pixel).',
        displayName: 'Perf: Circle NoStroke Crisp RandCenterType'
        // The description above will also be used for the performance test registry entry.
    }
); 