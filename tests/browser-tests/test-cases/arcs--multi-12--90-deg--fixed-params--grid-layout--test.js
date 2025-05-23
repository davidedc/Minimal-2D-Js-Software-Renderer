/**
 * @fileoverview Test definition for 90-degree arcs with various radii and stroke widths.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint are assumed globally available.

/**
 * Draws 90-degree arcs. 
 * In visual regression mode, it draws a fixed grid of 12 arcs.
 * In performance mode, it draws `instances` number of fully randomized 90-degree arcs.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. For this test, it always draws
 *                  the predefined set of 12 arcs for visual regression. For performance, it draws `instances` arcs.
 * @returns {?{logs: string[]}} Logs for the visual regression run.
 */
function draw_arcs_multi_12_90_deg_fixed_params_grid_layout(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDrawForPerf = isPerformanceRun ? instances : 0;
    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (!isPerformanceRun) {
        // --- Visual Regression Mode: Draw the fixed grid of 12 arcs ---
        const strokeSizes = [1, 2, 3, 4];
        const radii = [20, 40, 60];
        let xOffset = 150;
        const fixedStrokeColorObj = { r: 200, g: 100, b: 100, a: 255 };
        const fixedStrokeColorStr = _colorObjectToString(fixedStrokeColorObj);

        for (const strokeWidth of strokeSizes) {
            let yOffset = 150;
            for (const radius of radii) {
                const centerX = xOffset;
                const centerY = yOffset;
                const startAngleRad = 0; // 0 degrees
                const endAngleRad = Math.PI / 2;   // 90 degrees

                ctx.strokeStyle = fixedStrokeColorStr;
                ctx.lineWidth = strokeWidth;
                ctx.strokeArc(centerX, centerY, radius, startAngleRad, endAngleRad, false);

                logs.push(
                    `\u25DC 90° Arc (Fixed Grid): center=(${centerX},${centerY}), r=${radius}, sw=${strokeWidth}`
                );
                yOffset += radius * 2 + 20;
            }
            xOffset += 120;
        }
        return { logs };

    } else {
        // --- Performance Mode: Draw `numToDrawForPerf` randomized 90-degree arcs ---
        const quadrants = [0, Math.PI / 2, Math.PI, Math.PI * 3 / 2];

        for (let i = 0; i < numToDrawForPerf; i++) {
            // Each arc gets fully random parameters
            const radius = 10 + SeededRandom.getRandom() * 50; // Random radius 10-60
            const strokeWidth = 1 + SeededRandom.getRandom() * 4; // Random stroke width 1-5
            
            // Random starting quadrant for the 90-degree arc
            const startAngleRad = quadrants[Math.floor(SeededRandom.getRandom() * 4)];
            const endAngleRad = startAngleRad + Math.PI / 2;

            const strokeColorObj = getRandomColor(200, 255); // Opaque random color
            const strokeColorStr = _colorObjectToString(strokeColorObj);

            // Base position from SeededRandom
            let drawCenterX = SeededRandom.getRandom() * canvasWidth;
            let drawCenterY = SeededRandom.getRandom() * canvasHeight;

            // Additional large random offset for performance test spread (using Math.random)
            drawCenterX = Math.random() * canvasWidth;
            drawCenterY = Math.random() * canvasHeight;
            
            // Ensure it's somewhat on screen (simple clamp)
            drawCenterX = Math.max(radius + strokeWidth, Math.min(drawCenterX, canvasWidth - radius - strokeWidth));
            drawCenterY = Math.max(radius + strokeWidth, Math.min(drawCenterY, canvasHeight - radius - strokeWidth));

            ctx.strokeStyle = strokeColorStr;
            ctx.lineWidth = strokeWidth;
            ctx.strokeArc(drawCenterX, drawCenterY, radius, startAngleRad, endAngleRad, false);
        }
        return null; // No logs for performance run
    }
}

/**
 * Defines and registers the 90-degree arcs test case.
 */
function define_arcs_multi_12_90_deg_fixed_params_grid_layout_test() {
    return new RenderTestBuilder()
        .withId('arcs--multi-12--90-deg--fixed-params--grid-layout')
        .withTitle('90\u00B0 Arcs (Multiple, Fixed Params, Grid Layout)')
        .withDescription('Tests rendering of 90° arcs with various fixed radii and stroke widths in a grid.')
        .runCanvasCode(draw_arcs_multi_12_90_deg_fixed_params_grid_layout)
        // No specific checks in original test definition
        .build();
}

// Define and register the visual regression test immediately.
if (typeof RenderTestBuilder === 'function') {
    define_arcs_multi_12_90_deg_fixed_params_grid_layout_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_arcs_multi_12_90_deg_fixed_params_grid_layout === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'arcs--multi-12--90-deg--fixed-params--grid-layout',
        drawFunction: draw_arcs_multi_12_90_deg_fixed_params_grid_layout,
        displayName: 'Perf: 12 90Deg Arcs FixedGrid',
        description: 'Performance of 12 90-degree arcs with fixed parameters.',
        category: 'arcs' 
    });
} 