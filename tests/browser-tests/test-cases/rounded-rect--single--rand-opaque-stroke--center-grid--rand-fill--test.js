/**
 * @fileoverview Test definition for a single centered rounded rectangle with random opaque stroke and random fill, centered at a grid point.
 */

// Helper functions like _colorObjectToString, getRandomColor, placeCloseToCenterAtGrid (implicitly by centerX/Y calc),
// and adjustDimensionsForCrispStrokeRendering are assumed to be globally available.
// parseColor (for polyfills) also assumed global.

/**
 * Draws a single centered rounded rectangle with random opaque stroke and random fill.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it should draw one primary shape for visual
 *                  regression, and `instances` count for performance, each with unique properties based on SeededRandom.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rect_single_rand_opaque_stroke_center_grid_rand_fill(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const maxWidth = canvasWidth * 0.6;
    const maxHeight = canvasHeight * 0.6;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp grid-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Center is at grid crossing
        const centerX = Math.floor(canvasWidth / 2);
        const centerY = Math.floor(canvasHeight / 2);

        // SeededRandom Call 1: strokeWidth
        const strokeWidth = Math.round(SeededRandom.getRandom() * 10 + 1);
        // SeededRandom Call 2: baseRectWidth
        const baseRectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
        // SeededRandom Call 3: baseRectHeight
        const baseRectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

        // Adjust dimensions for crisp rendering with the random strokeWidth
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseRectWidth, baseRectHeight, strokeWidth, { x: centerX, y: centerY });
        const finalRectWidth = adjusted.width;
        const finalRectHeight = adjusted.height;

        // SeededRandom Call 4: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        
        // SeededRandom Call 5 (potentially multiple inside getRandomColor): strokeColor (opaque)
        const strokeColorObj = getRandomColor(255, 255); 
        // SeededRandom Call 6 (potentially multiple inside getRandomColor): fillColor (can be semi-transparent)
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        let geomX = centerX - finalRectWidth / 2;
        let geomY = centerY - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        // Set styles before drawing
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = strokeWidth;

        // Use the new context methods. Order: fill then stroke.
        ctx.fillRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        if (strokeWidth > 0) { // only stroke if there is a stroke width
            ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        }

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `CenteredRRect: center=(${centerX},${centerY}), baseW/H=(${baseRectWidth},${baseRectHeight}), adjW/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, sw=${strokeWidth.toFixed(1)}`
            ];
            if (i === 0) logs = logs.concat(currentLogs);
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    // No checkData for extremes, but return logs for visual regression run.
    return { logs }; 
}

/**
 * Defines and registers the centered rounded rectangle with random opaque stroke test case.
 */
function define_rounded_rect_single_rand_opaque_stroke_center_grid_rand_fill_test() {
    return new RenderTestBuilder()
        .withId('rounded-rect--single--rand-opaque-stroke--center-grid--rand-fill')
        .withTitle('Single Centered Rounded Rectangle (Random Opaque Stroke, Random Fill, Grid Center)')
        .withDescription('Tests a single rounded rectangle with random stroke widths (opaque), random fills, centered at a grid crossing.')
        .runCanvasCode(draw_rounded_rect_single_rand_opaque_stroke_center_grid_rand_fill)
        .withColorCheckMiddleRow({ expectedUniqueColors: 2 }) // From original test
        .withColorCheckMiddleColumn({ expectedUniqueColors: 2 }) // From original test
        .withSpecklesCheckOnSwCanvas() // From original test
        // No explicit compareWithThreshold in original, defaults to (0,0)
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_rounded_rect_single_rand_opaque_stroke_center_grid_rand_fill_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_rounded_rect_single_rand_opaque_stroke_center_grid_rand_fill === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'rounded-rect--single--rand-opaque-stroke--center-grid--rand-fill',
        drawFunction: draw_rounded_rect_single_rand_opaque_stroke_center_grid_rand_fill,
        displayName: 'Perf: RRect RandStroke Opaque Grid Fill',
        description: 'Performance of a single centered rounded rectangle with random opaque stroke and random fill.',
        category: 'rounded-rectangles' 
    });
} 