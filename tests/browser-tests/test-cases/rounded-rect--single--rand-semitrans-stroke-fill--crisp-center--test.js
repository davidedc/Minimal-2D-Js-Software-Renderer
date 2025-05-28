/**
 * @fileoverview Test definition for a single centered rounded rectangle with semi-transparent stroke and fill.
 */

// Helper functions _colorObjectToString, getRandomColor, adjustDimensionsForCrispStrokeRendering 
// are assumed globally available.

/**
 * Adapted from placeRoundedRectWithFillAndStrokeBothCrisp in src/scene-creation/scene-creation-rounded-rects.js
 * Calculates parameters for a rectangle aiming for crisp fill and stroke.
 * This version is specific to the needs of the transparent strokes test (e.g. maxStrokeWidth = 40).
 * @param {number} canvasWidth The width of the canvas.
 * @param {number} canvasHeight The height of the canvas.
 * @returns {{center: {x: number, y: number}, adjustedDimensions: {width: number, height: number}, strokeWidth: number}}
 */
function _placeRectForTransparentTest(canvasWidth, canvasHeight) {
    const maxAllowedContentWidth = canvasWidth * 0.6;
    const maxAllowedContentHeight = canvasHeight * 0.6;
    const maxStrokeWidth = 40; // As used in the original addCenteredRoundedRectTransparentStrokesRandomStrokeWidth

    // SeededRandom Call 1: base strokeWidth
    let strokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidth + 1);
    // Ensure strokeWidth is even for this placement strategy for crisp fill and stroke with one path
    strokeWidth = strokeWidth % 2 === 0 ? strokeWidth : strokeWidth + 1;

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
    return { center: initialCenter, adjustedDimensions, strokeWidth };
}


/**
 * Draws a single centered rounded rectangle with semi-transparent stroke and fill.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rect_single_rand_semitrans_stroke_fill_crisp_center(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Calls 1-4 for SeededRandom happen inside _placeRectForTransparentTest
        const placement = _placeRectForTransparentTest(canvasWidth, canvasHeight);
        const center = placement.center;
        const finalRectWidth = placement.adjustedDimensions.width;
        const finalRectHeight = placement.adjustedDimensions.height;
        const strokeWidth = placement.strokeWidth;

        // SeededRandom Call 5: strokeColor (semi-transparent)
        const strokeColorObj = getRandomColor(50, 150); 
        // SeededRandom Call 6: fillColor (semi-transparent)
        const fillColorObj = getRandomColor(50, 150);
        // SeededRandom Call 7: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        let geomX = center.x - finalRectWidth / 2;
        let geomY = center.y - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        if (strokeWidth > 0) {
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        }

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `TransparentRRect: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), adjW/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, sw=${strokeWidth.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'rounded-rect--single--rand-semitrans-stroke-fill--crisp-center--test.js',
    draw_rounded_rect_single_rand_semitrans_stroke_fill_crisp_center,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 },
        uniqueColors: {
            middleRow: { count: 3 },
            middleColumn: { count: 3 }
        },
        speckles: true
    },
    {
        title: 'Single Centered Rounded Rectangle (Semi-Transparent Stroke & Fill, Crisp Center)',
        description: 'Tests a single rounded rectangle with random stroke widths and semi-transparent colors, centered crisply (grid or pixel).',
        displayName: 'Perf: RRect RandTrans Stroke/Fill CrispCenter'
    }
);