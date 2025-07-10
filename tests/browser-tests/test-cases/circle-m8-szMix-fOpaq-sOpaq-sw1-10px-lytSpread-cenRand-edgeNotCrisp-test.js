/**
* TEST SUMMARY:
* =================
*
* Description: Test with 8 circles, all parameters fully randomized.
*
*
* ---
*
* | Facet                  | Value          | Reason
* |------------------------|----------------|--------------------------------------------------------------------------------------------------------------------------------------------
* | Shape category         | circles        | The test draws circles using `ctx.fillAndStrokeCircle`.
* | Count                  | multi-8        | The test draws 8 instances in a loop (`numToDraw = isPerformanceRun ? instances : 8`).
* | SizeCategory           | mixed          | Radius is randomized as `15 + SR.get() * 50`, spanning `[15, 65)`, which covers both S (`16-39px`) and M (`40-79px`) size categories.
* | FillStyle              | opaque         | `getRandomColor()` is called for fill, which returns a fully opaque color (alpha=255) by default.
* | StrokeStyle            | opaque         | `getRandomColor()` is called for stroke, which returns a fully opaque color (alpha=255) by default.
* | StrokeThickness        | 1px-10px       | `strokeWidth` is `SR.get() * 10 + 1`, resulting in a continuous range of `[1, 11)`, i.e., 1px to 10px.
* | Layout                 | spread         | `getRandomPoint()` is called for each of the 8 circles, distributing them randomly across the canvas.
* | CenteredAt             | random         | `getRandomPoint()` returns floating-point coordinates with no specific alignment to pixel or grid centers.
* | EdgeAlignment          | not-crisp      | The test uses fully random, floating-point values for position, radius, and stroke, with no crisping logic applied.
* | Orientation            | N/A            | Not applicable for circles, which are rotationally symmetrical.
* | ArcAngleExtent         | N/A            | Not applicable for circles.
* | RoundRectRadius        | N/A            | Not applicable for circles.
* | ContextTranslation     | none           | The code contains no calls to `ctx.translate()`.
* | ContextRotation        | none           | The code contains no calls to `ctx.rotate()`.
* | ContextScaling         | none           | The code contains no calls to `ctx.scale()`.
* | Clipped on shape       | none           | The code contains no calls to `ctx.clip()`.
* | Clipped on shape count | n/a            | Clipping is not used.
* | Clipped on shape arrangement | n/a      | Clipping is not used.
* | Clipped on shape size  | n/a            | Clipping is not used.
* | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
*
* ---
*
* UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
* ----------------------------------------------
* The precise randomization ranges for the fill color (`100, 200`) and stroke color (`200, 255`) are not captured in the filename.
*/

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

// Register the test
registerHighLevelTest(
    'circle-m8-szMix-fOpaq-sOpaq-sw1-10px-lytSpread-cenRand-edgeNotCrisp-test',
    draw_circles_multi_8_fully_random,
    'circles',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Circle: 8 fully random',
        displayName: 'Perf: 8 FullyRandom Circles',
        description: 'Performance of 8 fully random circles.'
    }
); 
