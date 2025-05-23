/**
 * @fileoverview Test definition for multiple fully random arcs.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws multiple arcs with fully random parameters.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For visual regression (instances is null/0), 5 arcs are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_arcs_multi_5_fully_random(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 5; // Original test draws 5

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // Parameters from getRandomArc()
        // SeededRandom Call 1 & 2 (inside getRandomPoint for x, y)
        const center = getRandomPoint(1, canvasWidth, canvasHeight); 
        // SeededRandom Call 3: radius
        const radius = 15 + SeededRandom.getRandom() * 50; 
        // SeededRandom Call 4: startAngle (degrees)
        const startAngleDeg = SeededRandom.getRandom() * 360;
        // SeededRandom Call 5: endAngle (degrees, relative to start)
        const endAngleDeg = startAngleDeg + SeededRandom.getRandom() * 270 + 90;
        // SeededRandom Call 6: strokeWidth
        const strokeWidth = SeededRandom.getRandom() * 10 + 1;
        // SeededRandom Call 7: strokeColor 
        const strokeColorObj = getRandomColor(200, 255); 
        // SeededRandom Call 8: fillColor
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorForRender = { r: strokeColorObj.r, g: strokeColorObj.g, b: strokeColorObj.b, a: strokeColorObj.a };
        const fillColorForRender = { r: fillColorObj.r, g: fillColorObj.g, b: fillColorObj.b, a: fillColorObj.a };

        // Convert angles to radians for context arc methods
        const startAngleRad = startAngleDeg * Math.PI / 180;
        const endAngleRad = endAngleDeg * Math.PI / 180;

        let drawCenterX = center.x;
        let drawCenterY = center.y;

        // The getRandomPoint already randomizes position for each arc.
        // No additional Math.random() offset needed for performance mode spreading for this test.
        
        ctx.fillStyle = _colorObjectToString(fillColorForRender); // Set for fillAndStrokeArc
        ctx.strokeStyle = _colorObjectToString(strokeColorForRender); // Set for fillAndStrokeArc
        ctx.lineWidth = strokeWidth;

        // Use fillAndStrokeArc as both fill and stroke are defined with random colors
        // The polyfill and CrispSwContext method should handle drawing fill then stroke.
        ctx.fillAndStrokeArc(drawCenterX, drawCenterY, radius, startAngleRad, endAngleRad, false);

        if (!isPerformanceRun) { 
            logs.push(
                `RandArc ${i+1}: center=(${center.x.toFixed(1)},${center.y.toFixed(1)}), r=${radius.toFixed(1)}, ang=(${startAngleDeg.toFixed(0)}°,${endAngleDeg.toFixed(0)}°), sw=${strokeWidth.toFixed(1)}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

/**
 * Defines and registers the multiple fully random arcs test case.
 */
function define_arcs_multi_5_fully_random_test() {
    return new RenderTestBuilder()
        .withId('arcs--multi-5--fully-random') // Derived from: random-arcs
        .withTitle('Multiple Fully Random Arcs')
        .withDescription('Tests rendering of 5 arcs with fully random positions, angles, sizes, colors, and strokes.')
        .runCanvasCode(draw_arcs_multi_5_fully_random)
        // No specific checks in original test definition
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_arcs_multi_5_fully_random_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_arcs_multi_5_fully_random === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'arcs--multi-5--fully-random',
        drawFunction: draw_arcs_multi_5_fully_random,
        displayName: 'Perf: 5 FullyRandom Arcs',
        description: 'Performance of 5 fully random arcs.',
        category: 'arcs' 
    });
} 