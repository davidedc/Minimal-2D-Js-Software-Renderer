/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of multiple axis-aligned rectangles with random sizes, fills (variable alpha), strokes (opaque/semi-transparent, even width), and positions. This test is designed to produce crisp edges by using helper functions to adjust geometry based on stroke width and placement. No rotation is applied.
 *
 *
 * ---
 *
 * | Facet                  | Value              | Reason
 * |------------------------|--------------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rectangles         | Test draws rectangles using `ctx.fillRect` and `ctx.strokeRect`.
 * | Count                  | multi-10           | Draws 10 instances in visual regression mode (`numToDraw` defaults to 10).
 * | SizeCategory           | mixed              | `rectWidth`/`rectHeight` are randomized in a range of `[50, ~410]`, spanning M, L, and XL categories.
 * | FillStyle              | semitransparent    | `fillColorObj` is generated with an alpha range of `[100, 200]`, which is always semi-transparent.
 * | StrokeStyle            | mixed              | `strokeColorObj` is generated with an alpha range of `[200, 255]`, including both semi-transparent and opaque values.
 * | StrokeThickness        | mixed              | `strokeWidth` is randomized to an even integer in `[2, 12]`, a discrete set of values.
 * | Layout                 | spread             | Rectangles are distributed by applying a random offset to each instance's calculated center point.
 * | CenteredAt             | mixed-pixel-grid   | The initial placement logic in `_placeRectWithFillAndStrokeBothCrisp` centers on a grid or pixel center.
 * | EdgeAlignment          | crisp              | The test explicitly uses the `_adjustDimensionsForCrispStrokeRendering` helper to ensure crisp edges.
 * | Orientation            | square             | Rectangles are axis-aligned (`ornAxial` in new convention).
 * | ArcAngleExtent         | N/A                | Not applicable to rectangles.
 * | RoundRectRadius        | N/A                | Not applicable to standard rectangles.
 * | ContextTranslation     | none               | No `ctx.translate()` calls are made.
 * | ContextRotation        | none               | No `ctx.rotate()` calls are made.
 * | ContextScaling         | none               | No `ctx.scale()` calls are made.
 * | Clipped on shape       | none               | No clipping is applied in this test.
 * | Clipped on shape count | n/a                | No clipping is applied in this test.
 * | Clipped on shape arrangement | n/a          | No clipping is applied in this test.
 * | Clipped on shape size  | n/a                | No clipping is applied in this test.
 * | Clipped on shape edge alignment | n/a       | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The fill alpha is specifically randomized within the range `[100, 200]`.
 * - The stroke alpha is specifically randomized within the range `[200, 255]`.
 * - The stroke width is calculated by rounding `SR.get()*10+1` and then forcing the result to be an even number,
 *   resulting in a discrete set of values: `{2, 4, 6, 8, 10, 12}`.
 *
 */

/**
 * @fileoverview Test definition for multiple axis-aligned rectangles with random parameters,
 * matching the new descriptive naming convention.
 */

// _adjustDimensionsForCrispStrokeRendering is now available globally from test-helper-functions.js

/**
 * Calculates parameters for a rectangle aiming for crisp fill and stroke.
 * Adapted from placeRoundedRectWithFillAndStrokeBothCrisp in src/scene-creation/scene-creation-rounded-rects.js
 * (Note: The "rounded" part of the original name is a misnomer for this specific usage,
 * as the original addAxisAlignedRectangles test pushes a non-rounded 'rect' type).
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @param {number} maxStrokeWidth Maximum stroke width to generate.
 * @returns {{center: {x: number, y: number}, adjustedDimensions: {width: number, height: number}, strokeWidth: number}}
 */
function _placeRectWithFillAndStrokeBothCrisp(canvasWidth, canvasHeight, maxStrokeWidth = 10) {
    const maxAllowedContentWidth = canvasWidth * 0.6;
    const maxAllowedContentHeight = canvasHeight * 0.6;

    // Order of SeededRandom calls must be preserved:
    // 1. strokeWidth base
    let strokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidth + 1);
    // Ensure strokeWidth is even for this placement strategy
    strokeWidth = strokeWidth % 2 === 0 ? strokeWidth : strokeWidth + 1;

    let initialCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };

    // 2. Center offset
    if (SeededRandom.getRandom() < 0.5) {
        initialCenter = { x: initialCenter.x + 0.5, y: initialCenter.y + 0.5 };
    }

    // 3. rectWidth base
    let rectWidth = Math.round(50 + SeededRandom.getRandom() * maxAllowedContentWidth);
    // 4. rectHeight base
    let rectHeight = Math.round(50 + SeededRandom.getRandom() * maxAllowedContentHeight);

    const adjustedDimensions = _adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, initialCenter);
    return { center: initialCenter, adjustedDimensions, strokeWidth };
}

// _colorObjectToString is now available globally from test-helper-functions.js

/**
 * Draws multiple axis-aligned rectangles with random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it dictates the number of rectangles drawn.
 *                  For visual regression (instances is null/0), 10 rectangles are drawn.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 10; // Original test draws 10

    const logs = [];
    let overallMinLeftX = Infinity;
    let overallMaxRightX = -Infinity;
    let overallMinTopY = Infinity;
    let overallMaxBottomY = -Infinity;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Preserve SeededRandom sequence from original test functions:
        // Calls 1-4 happen inside _placeRectWithFillAndStrokeBothCrisp
        const placement = _placeRectWithFillAndStrokeBothCrisp(canvasWidth, canvasHeight, 10); // maxStrokeWidth=10 as in original
        let rectCenter = placement.center;
        const rectWidth = placement.adjustedDimensions.width;
        const rectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // Call 5: xOffset
        const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
        // Call 6: yOffset
        const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;

        let finalDrawCenterX = rectCenter.x + xOffset;
        let finalDrawCenterY = rectCenter.y + yOffset;

        // Call 7: strokeColor (getRandomColor uses SeededRandom internally)
        const strokeColorObj = getRandomColor(200, 255); // Opaque stroke
        // Call 8: fillColor (getRandomColor uses SeededRandom internally)
        const fillColorObj = getRandomColor(100, 200);   // Semi-transparent fill possible

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        let geomX = finalDrawCenterX - rectWidth / 2;
        let geomY = finalDrawCenterY - rectHeight / 2;

        if (isPerformanceRun) {
            // For performance, spread shapes widely using Math.random (does not affect SeededRandom sequence)
            // Ensure shape stays somewhat within bounds if its original placement + offset was near edge
            const safeMargin = Math.max(strokeWidth, 10); // A small margin
            geomX = Math.random() * Math.max(0, canvasWidth - rectWidth - safeMargin * 2) + safeMargin;
            geomY = Math.random() * Math.max(0, canvasHeight - rectHeight - safeMargin * 2) + safeMargin;
        } else {
             // Ensure the shape is mostly on canvas for visual test, clipping if necessary
             // This is a simple clamp to avoid errors if random offsets push it too far.
            geomX = Math.max(0 - rectWidth/2, Math.min(geomX, canvasWidth - rectWidth/2));
            geomY = Math.max(0 - rectHeight/2, Math.min(geomY, canvasHeight - rectHeight/2));
        }


        ctx.fillStyle = fillColorStr;
        ctx.fillRect(geomX, geomY, rectWidth, rectHeight);

        if (strokeWidth > 0) {
            ctx.strokeStyle = strokeColorStr;
            ctx.lineWidth = strokeWidth;
            ctx.strokeRect(geomX, geomY, rectWidth, rectHeight);
        }

        if (!isPerformanceRun) {
            logs.push(`Rect ${i+1}: center=(${finalDrawCenterX.toFixed(1)},${finalDrawCenterY.toFixed(1)}), w=${rectWidth}, h=${rectHeight}, sw=${strokeWidth}`);
            
            // Calculate extremes based on geometry and stroke width
            // These are the geometric boundaries of the stroked area
            const currentRectOuterLeft = geomX - strokeWidth / 2;
            const currentRectOuterRight = geomX + rectWidth + strokeWidth / 2; // one pixel past the end
            const currentRectOuterTop = geomY - strokeWidth / 2;
            const currentRectOuterBottom = geomY + rectHeight + strokeWidth / 2; // one pixel past the end

            overallMinLeftX = Math.min(overallMinLeftX, currentRectOuterLeft);
            overallMaxRightX = Math.max(overallMaxRightX, currentRectOuterRight);
            overallMinTopY = Math.min(overallMinTopY, currentRectOuterTop);
            overallMaxBottomY = Math.max(overallMaxBottomY, currentRectOuterBottom);
        }
    }

    if (isPerformanceRun) {
        return null;
    } else {
        // For withExtremesCheck, expected values are inclusive pixel coordinates.
        // The right/bottom boundary from calculation is typically exclusive, so subtract 1 if it's an integer,
        // or floor if it's subpixel. The guide's examples use Math.floor for subpixel-derived boundaries.
        // And `rightX: x + rectWidth + sw / 2 - 1` (inclusive boundary)
        const checkData = {
            leftX: Math.floor(overallMinLeftX),
            rightX: Math.floor(overallMaxRightX -1), // Adjust to inclusive pixel
            topY: Math.floor(overallMinTopY),
            bottomY: Math.floor(overallMaxBottomY -1)  // Adjust to inclusive pixel
        };
        if (numToDraw === 0) { // Should not happen with numToDraw=10 default but good for safety
             return {logs, checkData: {leftX:0, rightX:0, topY:0, bottomY:0}};
        }
        return { logs, checkData };
    }
}

// Register the test
registerHighLevelTest(
    'rect-m10-szMix-fSemi-sMix-swMix-lytSpread-cenMixPG-edgeCrisp-ornAxial-test',
    drawTest,
    'rectangles',
    {
        extremes: true,
        compare: { swTol: 3, refTol: 1, diffTol: 0 }
    },
    {
        title: 'Rectangles: Axis-aligned, Multiple, Variable Size, Random Fill & Stroke, Random Position, No Rotation',
        description: 'Tests rendering of multiple axis-aligned rectangles with random sizes, fills (variable alpha), strokes (opaque, even width), and positions. No rotation.',
        displayName: 'Perf: Rects AxAlign Multi Random'
    }
); 
