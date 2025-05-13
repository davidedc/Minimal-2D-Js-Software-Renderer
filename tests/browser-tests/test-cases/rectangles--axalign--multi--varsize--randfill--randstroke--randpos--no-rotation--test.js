/**
 * @fileoverview Test definition for multiple axis-aligned rectangles with random parameters,
 * matching the new descriptive naming convention.
 */

/**
 * Adjusts width and height to ensure crisp rendering based on stroke width and center position.
 * Adapted from src/scene-creation/scene-creation-utils.js
 * @param {number} width - Original width.
 * @param {number} height - Original height.
 * @param {number} strokeWidth - Width of the stroke.
 * @param {{x: number, y: number}} center - Center coordinates {x, y}.
 * @returns {{width: number, height: number}} Adjusted width and height.
 */
function _adjustDimensionsForCrispStrokeRendering(width, height, strokeWidth, center) {
    let adjustedWidth = Math.floor(width);
    let adjustedHeight = Math.floor(height);

    // FIXING THE WIDTH
    if (Number.isInteger(center.x)) { // Center x is on grid
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedWidth % 2 === 0) adjustedWidth++; // Width must be odd
        } else { // Even stroke
            if (adjustedWidth % 2 !== 0) adjustedWidth++; // Width must be even
        }
    } else if (center.x % 1 === 0.5) { // Center x is on pixel center
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedWidth % 2 !== 0) adjustedWidth++; // Width must be even
        } else { // Even stroke
            if (adjustedWidth % 2 === 0) adjustedWidth++; // Width must be odd
        }
    }

    // FIXING THE HEIGHT
    if (Number.isInteger(center.y)) { // Center y is on grid
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedHeight % 2 === 0) adjustedHeight++; // Height must be odd
        } else { // Even stroke
            if (adjustedHeight % 2 !== 0) adjustedHeight++; // Height must be even
        }
    } else if (center.y % 1 === 0.5) { // Center y is on pixel center
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedHeight % 2 !== 0) adjustedHeight++; // Height must be even
        } else { // Even stroke
            if (adjustedHeight % 2 === 0) adjustedHeight++; // Height must be odd
        }
    }
    return { width: adjustedWidth, height: adjustedHeight };
}

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

/**
 * Converts a color object to an rgba string.
 * @param {{r: number, g: number, b: number, a: number}} colorObj Color object.
 * @returns {string} CSS rgba string.
 */
function _colorObjectToString(colorObj) {
    if (!colorObj) return 'rgba(0,0,0,0)';
    const alpha = (typeof colorObj.a === 'number') ? (colorObj.a / 255).toFixed(3) : 1;
    return `rgba(${colorObj.r},${colorObj.g},${colorObj.b},${alpha})`;
}

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
function draw_rectangles_axalign_multi_varsize_randfill_randstroke_randpos_no_rotation(ctx, currentIterationNumber, instances = null) {
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

/**
 * Defines and registers the test case with the new descriptive ID.
 */
function define_rectangles_axalign_multi_varsize_randfill_randstroke_randpos_no_rotation_test() {
    return new RenderTestBuilder()
        .withId('rectangles--axalign--multi--varsize--randfill--randstroke--randpos--no-rotation')
        .withTitle('Rectangles: Axis-aligned, Multiple, Variable Size, Random Fill & Stroke, Random Position, No Rotation')
        .withDescription('Tests rendering of multiple axis-aligned rectangles with random sizes, fills (variable alpha), strokes (opaque, even width), and positions. No rotation.')
        .runCanvasCode(draw_rectangles_axalign_multi_varsize_randfill_randstroke_randpos_no_rotation)
        .withExtremesCheck()
        .compareWithThreshold(3,1) // Matching the single axis-aligned rect test threshold
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_rectangles_axalign_multi_varsize_randfill_randstroke_randpos_no_rotation_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_rectangles_axalign_multi_varsize_randfill_randstroke_randpos_no_rotation === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'rectangles--axalign--multi--varsize--randfill--randstroke--randpos--no-rotation',
        drawFunction: draw_rectangles_axalign_multi_varsize_randfill_randstroke_randpos_no_rotation,
        displayName: 'Perf: Rects AxAlign Multi Random',
        description: 'Performance test for multiple axis-aligned rectangles with various random parameters.',
        category: 'rectangles'
    });
} 