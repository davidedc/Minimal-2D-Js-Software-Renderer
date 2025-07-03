/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests rendering of 10 rounded rectangles with 1px opaque strokes, random semi-transparent fills, and crisp center adjustment to ensure pixel-aligned edges.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws rounded rectangles using `ctx.fillRoundRect` and `ctx.strokeRoundRect`.
 * | Count                  | multi-10       | The test draws 10 instances in a loop for visual regression.
 * | SizeCategory           | mixed          | `width` and `height` are randomized in `[50, 150]`, which spans 'M' (40-79px) and 'L' (80-159px) size categories.
 * | FillStyle              | semitransparent| `fillColorObj` is created via `getRandomColor(100, 200)`, resulting in an alpha channel between 100-200.
 * | StrokeStyle            | opaque         | `strokeColorObj` is created via `getRandomColor(255, 255)`, resulting in a fixed alpha of 255.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is hardcoded to `1`.
 * | Layout                 | spread         | The 10 shapes are positioned independently at randomized locations, distributing them across the canvas.
 * | CenteredAt             | mixed-pixel-grid| The center is first rounded to an integer grid, then adjusted by `adjustCenterForCrispStrokeRendering` to a pixel center (`*.5`).
 * | EdgeAlignment          | crisp          | The test explicitly calls `adjustCenterForCrispStrokeRendering` to ensure shape edges align with pixel boundaries.
 * | Orientation            | square         | The rectangles are axis-aligned with no rotation.
 * | ArcAngleExtent         | N/A            | Not an arc.
 * | RoundRectRadius        | randomized     | The corner radius is randomized based on a factor of the shape's smaller dimension.
 * | ContextTranslation     | none           | No calls to `ctx.translate()`.
 * | ContextRotation        | none           | No calls to `ctx.rotate()`.
 * | ContextScaling         | none           | No calls to `ctx.scale()`.
 * | Clipped on shape       | none           | No clipping is applied in this test.
 * | Clipped on shape count | n/a            | No clipping.
 * | Clipped on shape arrangement | n/a      | No clipping.
 * | Clipped on shape size  | n/a            | No clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The specifics of `crisp-center-adj` logic are handled by the `adjustCenterForCrispStrokeRendering` helper function. The fill color is semi-transparent,
 * but the stroke is always fully opaque. The rectangle dimensions are randomized within the range `[50, 150]`, which covers the M and L size categories.
 *
 */
/**
 * @fileoverview Test definition for 10 thin, opaque-stroked rounded rectangles with 1px line width.
 */

// Helper functions _colorObjectToString, getRandomColor, getRandomPoint, adjustCenterForCrispStrokeRendering 
// are assumed globally available and use SeededRandom internally as needed.

/**
 * Rounds the x and y coordinates of a point object.
 * @param {{x: number, y: number}} point The point to round.
 * @returns {{x: number, y: number}} The point with rounded coordinates.
 */
function _roundPoint(point) {
    return { x: Math.round(point.x), y: Math.round(point.y) };
}

/**
 * Draws 10 thin, opaque-stroked rounded rectangles.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For visual regression (instances is null/0), 10 rectangles are drawn.
 * @returns {?{logs: string[]}} Logs for single-instance mode, or null for performance mode.
 */
function draw_rounded_rects_multi_10_1px_opaque_stroke_rand_fill_crisp_center_adj(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 10; // Original test draws 10

    let logs = [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    for (let i = 0; i < numToDraw; i++) {
        // SeededRandom Call 1: width
        const width = Math.round(50 + SeededRandom.getRandom() * 100);
        // SeededRandom Call 2: height
        const height = Math.round(50 + SeededRandom.getRandom() * 100);
        
        // SeededRandom Call 3 & 4 (approx, inside getRandomPoint)
        // The starting initialisation of center is a random point, then rounded for grid crossing.
        const randomCenter = getRandomPoint(1, canvasWidth, canvasHeight); // Assuming decimalPlaces=1, then pass canvas W/H
        const centerGrid = _roundPoint(randomCenter); // Ensures integer coords for grid alignment before adjustment

        // adjustCenterForCrispStrokeRendering is for a 1px stroke.
        const adjustedCenter = adjustCenterForCrispStrokeRendering(centerGrid.x, centerGrid.y, width, height, 1);

        // SeededRandom Call 5: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2);
        
        // SeededRandom Call 6: strokeColor (opaque)
        const strokeColorObj = getRandomColor(255, 255); 
        // SeededRandom Call 7: fillColor (can be semi-transparent)
        const fillColorObj = getRandomColor(100, 200);

        const strokeColorStr = _colorObjectToString(strokeColorObj);
        const fillColorStr = _colorObjectToString(fillColorObj);

        // For drawing, use the adjusted center and original width/height
        let geomX = adjustedCenter.x - width / 2;
        let geomY = adjustedCenter.y - height / 2;

        if (isPerformanceRun) { // For additional instances in perf mode, spread them out
             if (i > 0) { // Keep first instance as per original logic for potential single-frame visual check
                geomX = Math.random() * Math.max(0, canvasWidth - width);
                geomY = Math.random() * Math.max(0, canvasHeight - height);
             }
        } else { // For visual regression, ensure shapes are reasonably on canvas
            geomX = Math.max(0 - width/4, Math.min(geomX, canvasWidth - width*3/4));
            geomY = Math.max(0 - height/4, Math.min(geomY, canvasHeight - height*3/4 ));
        }
        
        ctx.fillStyle = fillColorStr;
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1; // Fixed 1px stroke

        ctx.fillRoundRect(geomX, geomY, width, height, radius);
        ctx.strokeRoundRect(geomX, geomY, width, height, radius);

        if (!isPerformanceRun) { 
            logs.push(
                `ThinRRect ${i+1}: adjCenter=(${adjustedCenter.x.toFixed(1)},${adjustedCenter.y.toFixed(1)}), W/H=(${width},${height}), r=${radius}`
            );
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs }; 
}

// Register the test
registerHighLevelTest(
    'roundrect-m10-szMix-fSemi-sOpaq-sw1px-lytSpread-cenMixPG-edgeCrisp-ornAxial-rrrRand-test.js',
    draw_rounded_rects_multi_10_1px_opaque_stroke_rand_fill_crisp_center_adj,
    'rounded-rects',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: '10 Thin Opaque-Stroke Rounded Rectangles (1px, Crisp Center Adj.)',
        description: 'Tests rendering of 10 rounded rectangles with 1px opaque strokes, random fills, and crisp center adjustment.',
        displayName: 'Perf: 10 RRects ThinOpaque AdjCenter'
    }
); 
