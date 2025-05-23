/**
 * @fileoverview Test definition for multiple fully random circles.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws multiple circles with fully random parameters (position, size, colors, stroke width).
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 8 circles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_circles_multi_8_fully_random(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 8; // Original test draws 8

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Each parameter is generated fresh for each circle in the loop, ensuring randomness for all.
        
        // SeededRandom Call 1 & 2 (inside getRandomPoint for x, y)
        const center = getRandomPoint(1, canvasWidth, canvasHeight); 
        // SeededRandom Call 3: radius
        const radius = 15 + SeededRandom.getRandom() * 50; 
        // SeededRandom Call 4 & 5 for angles are skipped as we draw a full circle.
        // SeededRandom Call 6: strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        // SeededRandom Call 7: strokeColor 
        const strokeColorObj = getRandomColor(200, 255); 
        // SeededRandom Call 8: fillColor
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        // In performance mode, getRandomPoint already ensures positions are varied across the canvas for each instance.
        // For visual regression, the 8 circles will also be randomly placed by getRandomPoint.
        let drawCenterX = center.x;
        let drawCenterY = center.y;

        if (isPerformanceRun && numToDraw > 1 && i > 0) {
            // While getRandomPoint already randomizes, explicitly use Math.random for subsequent perf instances for wider spread if desired.
            // However, the original getRandomPoint should already suffice for distribution.
            // For this test, as each circle is fully random, including its center from getRandomPoint,
            // additional Math.random() for position is not strictly necessary as in fixed-center tests.
            // The existing SR calls make each circle unique in all aspects.
        }
        
        ctx.fillAndStrokeCircle(
            drawCenterX, drawCenterY, radius, 
            fillColorForRender.r, fillColorForRender.g, fillColorForRender.b, fillColorForRender.a,
            strokeWidth, 
            strokeColorForRender.r, strokeColorForRender.g, strokeColorForRender.b, strokeColorForRender.a
        );

        if (!isPerformanceRun) { // Log all 8 circles in visual regression mode
            logs.push(
                `FullyRandomCircle ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

/**
 * Defines and registers the multiple fully random circles test case.
 */
function define_circles_multi_8_fully_random_test() {
    return new RenderTestBuilder()
        .withId('circles--multi-8--fully-random') // Derived from: random-circles
        .withTitle('Multiple Fully Random Circles')
        .withDescription('Tests rendering of 8 circles with fully random positions, sizes, colors, and strokes.')
        .runCanvasCode(draw_circles_multi_8_fully_random)
        // No specific checks in original test definition
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_circles_multi_8_fully_random_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_circles_multi_8_fully_random === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'circles--multi-8--fully-random',
        drawFunction: draw_circles_multi_8_fully_random,
        displayName: 'Perf: 8 FullyRandom Circles',
        description: 'Performance of 8 fully random circles.',
        category: 'circles' 
    });
} 