/**
 * @fileoverview
 * Test definition for rendering a single, small-to-medium sized, 1px thick, red, opaque stroked rectangle
 * with no fill, centered at a pixel center (X.5, Y.5 coordinates), and with no rotation.
 *
 * Guiding Principles for this draw function:
 * - Reproducibility: Uses SeededRandom for all random elements.
 * - Crispness: Center coordinates are X.5, Y.5. `adjustDimensionsForCrispStrokeRendering` is used.
 * - Checks: Returns extremes data for `withExtremesCheck`.
 * - Pre-conditions: Checks for even canvas dimensions (as original test did).
 */

/**
 * Draws a single 1px red-stroked rectangle, centered at a pixel center.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If > 0, draws multiple instances for performance.
 * @returns {?{ logs: string[], checkData: {leftX: number, rightX: number, topY: number, bottomY: number} }} 
 *          Log entries and expected pixel extremes, or null if in multi-instance mode.
 */
function draw_rectangles__S_size__no_fill__1px_red_opaque_stroke__centered_at_pixel__no_rotation(ctx, currentIterationNumber, instances = null) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    if (canvasWidth % 2 !== 0 || canvasHeight % 2 !== 0) {
        throw new Error("Canvas width and height must be even for this test (original test implies this dependency for predictable centering).");
    }

    const isPerformanceRun = instances !== null && instances > 0;
    const numRectsToDraw = isPerformanceRun ? instances : 1;

    let logs = isPerformanceRun ? null : [];
    let checkData = null; 

    // --- Base calculations for the archetype rectangle (using SeededRandom for reproducibility) ---
    // Center is at pixel center (X.5, Y.5)
    const baseCenterX = Math.floor(canvasWidth / 2) + 0.5;
    const baseCenterY = Math.floor(canvasHeight / 2) + 0.5;

    // Base Rectangle Dimensions (random but seeded)
    let initialRectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
    let initialRectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

    // Use adjustDimensionsForCrispStrokeRendering for the archetype.
    // For center at X.5, Y.5 and 1px stroke (odd), dimensions should be even.
    const { width: archetypeRectWidth, height: archetypeRectHeight } = adjustDimensionsForCrispStrokeRendering(
        initialRectWidth, 
        initialRectHeight, 
        1, // strokeWidth
        { x: baseCenterX, y: baseCenterY } // center coordinates are X.5, Y.5
    );

    // Calculate top-left for the archetype rectangle (relative to its center)
    // If baseCenterX is X.5 and archetypeRectWidth is even, then archetypeX will be Y.5
    const archetypeX = baseCenterX - archetypeRectWidth / 2;
    const archetypeY = baseCenterY - archetypeRectHeight / 2;
    // --- End base calculations ---

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255,0,0)'; // Red, Opaque
    ctx.fillStyle = 'rgba(0,0,0,0)';   // Transparent fill

    for (let i = 0; i < numRectsToDraw; i++) {
        let currentX = archetypeX;
        let currentY = archetypeY;
        let currentLogCenterX = baseCenterX; // For logging the original intended center
        let currentLogCenterY = baseCenterY;

        if (isPerformanceRun && i > 0) { 
            // For performance, place the archetype at random top-left *.5 coordinates
            // to cover the whole canvas while maintaining the pixel-alignment characteristic.
            currentX = Math.floor(Math.random() * (canvasWidth - archetypeRectWidth)) + 0.5;
            currentY = Math.floor(Math.random() * (canvasHeight - archetypeRectHeight)) + 0.5;

            // For logging, the *intended* conceptual center of the offset shape might shift
            // This logging part is usually skipped in perf runs anyway but shown for completeness if it were active.
            // currentLogCenterX = currentX + archetypeRectWidth / 2;
            // currentLogCenterY = currentY + archetypeRectHeight / 2;
        } else if (!isPerformanceRun) {
            logs.push(`&#x25A1; 1px Red Stroked Rectangle at (${currentX.toFixed(1)}, ${currentY.toFixed(1)}), size ${archetypeRectWidth}x${archetypeRectHeight}, centered at (${baseCenterX.toFixed(1)}, ${baseCenterY.toFixed(1)})`);
            
            checkData = {
                leftX: Math.floor(currentX),                       
                rightX: Math.floor(currentX + archetypeRectWidth),     
                topY: Math.floor(currentY),                        
                bottomY: Math.floor(currentY + archetypeRectHeight)
            };
        }

        ctx.strokeRect(currentX, currentY, archetypeRectWidth, archetypeRectHeight);
    }

    if (isPerformanceRun) return null;
    return { logs, checkData }; 
}

// Register the test
registerHighLevelTest(
    'rectangles--S-size--no-fill--1px_red_opaque_stroke--centered_at_pixel--no-rotation--test.js',
    draw_rectangles__S_size__no_fill__1px_red_opaque_stroke__centered_at_pixel__no_rotation,
    'rectangles',
    {
        extremes: true,
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        title: 'Rectangles: S-Size No-Fill 1px-Red-Opaque-Stroke Centered-At-Pixel No-Rotation',
        description: 'Tests a single 1px red stroked rectangle, centered at pixel centers (X.5,Y.5), with adjusted even dimensions.',
        displayName: 'Perf: Rect S 1px Red Centered Pixel'
    }
); 