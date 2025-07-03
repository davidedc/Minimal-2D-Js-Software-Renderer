/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Tests the crisp rendering of a single, 1px red-stroked rounded rectangle. The shape is centered on a physical pixel's center coordinates to test for precise alignment.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | rounded-rects  | The test draws and registers itself as a 'rounded-rects' test.
 * | Count                  | single         | The test draws a single shape instance in its primary visual regression mode.
 * | SizeCategory           | mixed          | Base rect dimensions are randomized in [20, 149], spanning size categories S, M, and L.
 * | FillStyle              | none           | The test only calls `ctx.strokeRoundRect()` and does not apply a fill.
 * | StrokeStyle            | opaque         | The stroke color is hardcoded to `rgba(255,0,0,1)`, which is fully opaque.
 * | StrokeThickness        | 1px            | `ctx.lineWidth` is hardcoded to 1.
 * | Layout                 | centered       | The shape is positioned relative to the canvas center.
 * | CenteredAt             | pixel          | Center coordinates are calculated as `floor(dim / 2) + 0.5`.
 * | EdgeAlignment          | crisp          | The code explicitly uses `adjustDimensionsForCrispStrokeRendering()` to ensure sharp edges.
 * | Orientation            | square         | The rectangle is axis-aligned with no rotation.
 * | ArcAngleExtent         | N/A            | This facet is not applicable to rectangle shapes.
 * | RoundRectRadius        | randomized     | The corner radius is calculated using `SeededRandom.getRandom()`.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not involve clipping.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * - The stroke color is not just opaque, it is specifically opaque red. This level of detail is not
 *   captured in the filename facets.
 */

/**
 * @fileoverview Test definition for a single 1px stroked rounded rectangle centered at a pixel.
 */

// Helper functions like _colorObjectToString, getRandomColor, placeCloseToCenterAtPixel, 
// and adjustDimensionsForCrispStrokeRendering are assumed to be globally available
// from included utility scripts (e.g., random-utils.js, scene-creation-utils.js)
// and use SeededRandom internally as needed. 
// parseColor (for polyfills) also assumed global.

/**
 * Draws a single 1px stroked rounded rectangle, centered at a pixel.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of instances to draw. Passed by the performance
 *                  testing harness. For this test, it should draw one primary shape for visual
 *                  regression, and `instances` count for performance, each with unique properties based on SeededRandom.
 * @returns {?{logs: string[], checkData: object}} Logs and data for checks for single-instance
 *                  mode, or null for performance mode.
 */
function draw_rounded_rect_single_1px_stroke_crisp_center_pixel(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    let checkData = null; 

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Pre-condition check from original test
    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        const msg = 'Warning: Canvas dimensions are not even. Crisp pixel-centered rendering might be affected.';
        if (!isPerformanceRun) logs.push(msg);
    }

    for (let i = 0; i < numToDraw; i++) {
        // Determine center point (e.g., 100.5, 100.5 for pixel centering)
        // Adapting placeCloseToCenterAtPixel(canvasWidth, canvasHeight) from scene-creation-utils.js
        const centerX = Math.floor(canvasWidth / 2) + 0.5;
        const centerY = Math.floor(canvasHeight / 2) + 0.5;

        // SeededRandom Call 1: rectWidth base
        const baseRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
        // SeededRandom Call 2: rectHeight base
        const baseRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

        // Adjust dimensions for a 1px stroke centered at the pixel center
        const adjusted = adjustDimensionsForCrispStrokeRendering(baseRectWidth, baseRectHeight, 1, { x: centerX, y: centerY });
        const finalRectWidth = adjusted.width;
        const finalRectHeight = adjusted.height;

        // SeededRandom Call 3: radius
        const radius = Math.round(SeededRandom.getRandom() * Math.min(finalRectWidth, finalRectHeight) * 0.2);
        
        const strokeColorStr = 'rgba(255,0,0,1)'; // Red, Opaque
        // fillColor is transparent, so not explicitly set before strokeRoundRect if it defaults or isn't used by it.
        // If strokeRoundRect also fills, we would need: ctx.fillStyle = 'rgba(0,0,0,0)';

        let geomX = centerX - finalRectWidth / 2;
        let geomY = centerY - finalRectHeight / 2;

        if (isPerformanceRun && numToDraw > 1) {
            geomX = Math.random() * Math.max(0, canvasWidth - finalRectWidth);
            geomY = Math.random() * Math.max(0, canvasHeight - finalRectHeight);
        }
        
        ctx.strokeStyle = strokeColorStr;
        ctx.lineWidth = 1;
        // Assumes fillStyle is not used by strokeRoundRect or is already transparent.
        // If fillRoundRect also fills, ensure fillStyle is transparent:
        // const originalFillStyle = ctx.fillStyle;
        // ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.strokeRoundRect(geomX, geomY, finalRectWidth, finalRectHeight, radius);
        // if (originalFillStyle) ctx.fillStyle = originalFillStyle;

        if (!isPerformanceRun || i === 0) { 
            const currentLogs = [
                `RoundedRect Centered@Pixel: center=(${centerX},${centerY}), base W/H=(${baseRectWidth},${baseRectHeight}), adj W/H=(${finalRectWidth},${finalRectHeight}), r=${radius}, geom=(${geomX.toFixed(1)},${geomY.toFixed(1)})`
            ];
            if (i === 0) logs = logs.concat(currentLogs);

            if (i === 0) {
                checkData = {
                    leftX: Math.floor(geomX),
                    rightX: Math.floor(geomX + finalRectWidth),
                    topY: Math.floor(geomY),
                    bottomY: Math.floor(geomY + finalRectHeight)
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
    'roundrect-sgl-szMix-fNone-sOpaq-sw1px-lytCenter-cenPx-edgeCrisp-ornAxial-rrrRand-test.js',
    draw_rounded_rect_single_1px_stroke_crisp_center_pixel,
    'rounded-rects',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Single 1px Stroked Rounded Rectangle (Crisp, Centered at Pixel)',
        description: 'Tests crisp rendering of a single 1px red stroked rounded rectangle, centered at a pixel center.',
        displayName: 'Perf: RRect 1px Crisp Pixel Center'
    }
); 
