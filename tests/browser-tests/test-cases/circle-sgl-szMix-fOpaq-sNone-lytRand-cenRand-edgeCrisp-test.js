/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests a single randomly positioned circle with no stroke, random fill, and crisp rendering. The circle's radius and position are randomized within defined constraints.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | circles        | The test calls `ctx.fillCircle()` to draw the shape.
 * | Count                  | single         | The test logic is designed to draw one primary shape instance per iteration.
 * | SizeCategory           | mixed          | The radius is randomized in the range [10, 225], which spans the S, M, L, and XL size categories.
 * | FillStyle              | opaque         | `getRandomColor(100, 200)` is called for the fill, which by default returns a fully opaque color.
 * | StrokeStyle            | none           | The `strokeWidth` variable is explicitly set to 0 and no stroke operation is performed.
 * | StrokeThickness        | none           | Consistent with `StrokeStyle: none` as `strokeWidth` is 0.
 * | Layout                 | random         | A single shape is placed at a random (x, y) position within calculated canvas margins.
 * | CenteredAt             | random         | The final center coordinates (x, y) are fully randomized, not snapped to a grid or pixel center.
 * | EdgeAlignment          | crisp          | The test explicitly calls `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
 * | ArcAngleExtent         | N/A            | Not applicable; this facet is for `arcs` only.
 * | RoundRectRadius        | N/A            | Not applicable; this facet is for `rounded-rects` only.
 * | ContextTranslation     | none           | The test does not call `ctx.translate()`.
 * | ContextRotation        | none           | The test does not call `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not call `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping region is defined or applied in this test.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The specific randomization range for the circle's radius is [10, 225]. The fill color is also randomized. The `randpos-explicit` part of the original filename refers to the specific logic that calculates a random position within safe canvas margins to ensure the entire shape is visible.
 *
 */

/**
 * @fileoverview Test definition for a single randomly positioned circle with no stroke.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering, 
// placeCloseToCenterAtPixel, placeCloseToCenterAtGrid are assumed globally available.

/**
 * Adapts the logic from calculateCircleParameters for a randomly positioned circle with no stroke.
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {object} An object containing centerX, centerY, radius, finalDiameter, and atPixel (initial alignment type).
 */
function _calculateRandomPositionNoStrokeCircleParams(canvasWidth, canvasHeight) {
    const minRadius = 10;
    const maxRadius = 225;
    const strokeWidth = 0;   // No stroke
    const marginX = 10;
    const marginY = 10;

    // SeededRandom Call 1: atPixel determination (influences initial centering before random positioning)
    const atPixel = SeededRandom.getRandom() < 0.5;
  
    // This initial centerX/Y is just for the first step of determining random position range,
    // it does not mean the final circle is centered at grid/pixel in the same way as non-randomly-positioned tests.
    let tempCenterX, tempCenterY; // Temporary, not the final center
    if (atPixel) {
        tempCenterX = Math.floor(canvasWidth / 2) + 0.5;
        tempCenterY = Math.floor(canvasHeight / 2) + 0.5;
    } else {
        tempCenterX = Math.floor(canvasWidth / 2);
        tempCenterY = Math.floor(canvasHeight / 2);
    }
  
    // SeededRandom Call 2: base diameter
    const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
    const baseRadius = diameter / 2;
  
    // No SeededRandom call for strokeWidth calculation as hasStroke is false.
  
    // Random Positioning Logic (SR calls 3 & 4 if used, or different SR path if not)
    let finalCenterX, finalCenterY;
    const totalRadiusForBounds = baseRadius; // Since strokeWidth is 0
    const minX = Math.ceil(totalRadiusForBounds + marginX);
    const maxX = Math.floor(canvasWidth - totalRadiusForBounds - marginX);
    const minY = Math.ceil(totalRadiusForBounds + marginY);
    const maxY = Math.floor(canvasHeight - totalRadiusForBounds - marginY);
    
    let currentDiameterForPositioning = diameter;
    if (maxX <= minX || maxY <= minY) { 
        currentDiameterForPositioning = Math.min(Math.floor(canvasWidth / 4), Math.floor(canvasHeight / 4));
        const newTotalRadius = (currentDiameterForPositioning / 2); // No strokeWidth
        const newMinX = Math.ceil(newTotalRadius + marginX);
        const newMaxX = Math.floor(canvasWidth - newTotalRadius - marginX);
        const newMinY = Math.ceil(newTotalRadius + marginY);
        const newMaxY = Math.floor(canvasHeight - newTotalRadius - marginY);
        // SeededRandom Call 3 & 4 (for position within new tighter bounds)
        finalCenterX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
        finalCenterY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
    } else {
        // SeededRandom Call 3 & 4 (for position within original safe bounds)
        finalCenterX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
        finalCenterY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
    }

    // Adjust dimensions for crisp rendering based on the *final* random center
    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, strokeWidth, { x: finalCenterX, y: finalCenterY });
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
  
    return { centerX: finalCenterX, centerY: finalCenterY, radius, finalDiameter, atPixel };
}


/**
 * Draws a single randomly positioned circle with no stroke.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance mode, or null.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
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
        // SR calls 1-4 happen inside _calculateRandomPositionNoStrokeCircleParams
        const params = _calculateRandomPositionNoStrokeCircleParams(canvasWidth, canvasHeight);
        let { centerX, centerY, radius, finalDiameter, atPixel } = params;
        
        // SR Call 5: fillColor 
        const fillColorObj = getRandomColor(100, 200);
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        let drawCenterX = centerX;
        let drawCenterY = centerY;

        // The _calculate... function already handles random positioning for each call.
        // No additional Math.random() needed for spreading in performance mode unless overriding SR logic.

        ctx.fillCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a
        );

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RandPosNoStrokeCircle: center=(${centerX.toFixed(1)},${centerY.toFixed(1)}), r=${radius.toFixed(1)}, diamAdj=${finalDiameter}, initialCenterType=${atPixel ? 'pixel' : 'grid'}`
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
    'circle-sgl-szMix-fOpaq-sNone-lytRand-cenRand-edgeCrisp-test',
    drawTest,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        extremes: { tolerance: 0.03 },
        noGapsInFillEdges: true,
        totalUniqueColors: 1,
        speckles: true
    },
    {
        title: 'Single Randomly Positioned Circle Without Stroke (Crisp)',
        description: 'Tests a single randomly positioned circle with no stroke, random fill, and crisp center.',
        displayName: 'Perf: Circle RandPos NoStroke Crisp'
    }
); 
