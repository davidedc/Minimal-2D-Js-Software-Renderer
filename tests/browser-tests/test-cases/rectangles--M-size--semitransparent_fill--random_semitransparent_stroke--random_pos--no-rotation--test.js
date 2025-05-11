/**
 * @fileoverview
 * Test definition for rendering a single, medium-sized, axis-aligned rectangle.
 * This version aims to replicate the logic from the original low-level test's
 * addAxisAlignedRectangles, including its direct use of getRandomColor.
 *
 * Guiding Principles for this draw function:
 * - Reproducibility: Uses SeededRandom for all random elements of the archetype.
 * - Properties: Derived from adapted logic of placeRoundedRectWithFillAndStrokeBothCrisp and addAxisAlignedRectangles.
 * - Checks: Returns extremes data for `withExtremesCheck`.
 * - Performance: Draws multiple instances at random positions in performance mode.
 */

// Helper to convert color object from getRandomColor to CSS rgba string
function _testHelper_colorObjectToRgbaCss(colorObj) {
    if (!colorObj || typeof colorObj.r === 'undefined') return 'rgba(0,0,0,0)'; // Basic check
    return `rgba(${colorObj.r},${colorObj.g},${colorObj.b},${(colorObj.a / 255).toFixed(3)})`;
}

/**
 * Draws a single axis-aligned rectangle based on original low-level test logic, or multiple for performance.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @param {?number} instances - Optional. If > 0, draws multiple instances for performance.
 * @returns {?{ logs: string[], checkData: object }} 
 *          Log entries and data for checks, or null if in multi-instance mode.
 */
function draw_rectangles__M_size__semitransparent_fill__random_semitransparent_stroke__random_pos__no_rotation(ctx, currentIterationNumber, instances = null) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const isPerformanceRun = instances !== null && instances > 0;
    const numToDraw = isPerformanceRun ? instances : 1;

    let logs = isPerformanceRun ? null : [];
    let checkData = null; 

    // --- Archetype Properties (determined by SeededRandom, adapting original logic) ---
    // Adapted from addAxisAlignedRectangles and placeRoundedRectWithFillAndStrokeBothCrisp
    
    const maxStrokeWidth = 10; 
    let archetypeStrokeWidth = Math.round(SeededRandom.getRandom() * maxStrokeWidth + 1);
    archetypeStrokeWidth = archetypeStrokeWidth % 2 === 0 ? archetypeStrokeWidth : archetypeStrokeWidth + 1;

    let archetypeBaseCenter = { x: canvasWidth / 2, y: canvasHeight / 2 };
    if (SeededRandom.getRandom() < 0.5) {
        archetypeBaseCenter = { x: archetypeBaseCenter.x + 0.5, y: archetypeBaseCenter.y + 0.5 };
    }

    const maxWidth = canvasWidth * 0.6;
    const maxHeight = canvasHeight * 0.6;
    let initialRectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
    let initialRectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

    const { 
        width: archetypeRectWidth, 
        height: archetypeRectHeight 
    } = adjustDimensionsForCrispStrokeRendering(initialRectWidth, initialRectHeight, archetypeStrokeWidth, archetypeBaseCenter);

    let finalArchetypeCenter = { ...archetypeBaseCenter }; 
    const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
    const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
    finalArchetypeCenter.x += xOffset;
    finalArchetypeCenter.y += yOffset;

    // Use getRandomColor directly as per original low-level test - ORDER MATTERS!
    const strokeObj = getRandomColor(200, 255); // Stroke color generated FIRST in original
    const fillObj = getRandomColor(100, 200);   // Fill color generated SECOND in original

    const archetypeFillColor = _testHelper_colorObjectToRgbaCss(fillObj);
    const archetypeStrokeColor = _testHelper_colorObjectToRgbaCss(strokeObj);

    // --- End Archetype Properties ---

    for (let i = 0; i < numToDraw; i++) {
        let currentX, currentY;
        let centerForLog = { ...finalArchetypeCenter };

        if (isPerformanceRun) {
            currentX = Math.floor(Math.random() * (canvasWidth - archetypeRectWidth));
            currentY = Math.floor(Math.random() * (canvasHeight - archetypeRectHeight));
            centerForLog.x = currentX + archetypeRectWidth / 2;
            centerForLog.y = currentY + archetypeRectHeight / 2;
        } else {
            currentX = finalArchetypeCenter.x - archetypeRectWidth / 2;
            currentY = finalArchetypeCenter.y - archetypeRectHeight / 2;
        }

        ctx.fillStyle = archetypeFillColor;
        ctx.fillRect(currentX, currentY, archetypeRectWidth, archetypeRectHeight);

        ctx.strokeStyle = archetypeStrokeColor;
        ctx.lineWidth = archetypeStrokeWidth;
        ctx.strokeRect(currentX, currentY, archetypeRectWidth, archetypeRectHeight);

        if (!isPerformanceRun) {
            logs.push(`Drew Axis-Aligned Rectangle at (${currentX.toFixed(1)},${currentY.toFixed(1)}), size ${archetypeRectWidth}x${archetypeRectHeight}, stroke: ${archetypeStrokeWidth}px, center: (${centerForLog.x.toFixed(1)}, ${centerForLog.y.toFixed(1)}), fill: ${archetypeFillColor}, stroke: ${archetypeStrokeColor}`);
            
            const sw = archetypeStrokeWidth;
            checkData = {
                leftX: currentX - sw / 2,
                rightX: currentX + archetypeRectWidth + sw / 2 - 1, 
                topY: currentY - sw / 2,
                bottomY: currentY + archetypeRectHeight + sw / 2 - 1  
            };
        }
    }

    if (isPerformanceRun) return null;
    return { logs, checkData }; 
}

/**
 * Defines and registers the test case.
 */
function define_rectangles__M_size__semitransparent_fill__random_semitransparent_stroke__random_pos__no_rotation_test() {
    return new RenderTestBuilder()
        .withId('rectangles--M-size--semitransparent_fill--random_semitransparent_stroke--random_pos--no-rotation')
        .withTitle('Rectangles: M-Size Semi-Transparent Fill, Random Semi-Transparent Stroke, Random Position, No Rotation')
        .withDescription('Tests a single axis-aligned rectangle with random dimensions, stroke width, and semi-transparent colors, mimicking original low-level logic including color generation.')
        .runCanvasCode(draw_rectangles__M_size__semitransparent_fill__random_semitransparent_stroke__random_pos__no_rotation)
        .withExtremesCheck()
        .compareWithThreshold(3, 1) // From original low-level test addSingleAxisAlignedRectangleTest
        .build();
}

// Define and register the visual regression test.
if (typeof RenderTestBuilder === 'function') {
    define_rectangles__M_size__semitransparent_fill__random_semitransparent_stroke__random_pos__no_rotation_test();
}

// Register for performance testing.
if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' &&
    typeof draw_rectangles__M_size__semitransparent_fill__random_semitransparent_stroke__random_pos__no_rotation === 'function') {
    window.PERFORMANCE_TESTS_REGISTRY.push({
        id: 'rectangles--M-size--semitransparent_fill--random_semitransparent_stroke__random_pos--no-rotation',
        drawFunction: draw_rectangles__M_size__semitransparent_fill__random_semitransparent_stroke__random_pos__no_rotation,
        displayName: 'Perf: Rect M Axis-Aligned (Original Logic)',
        description: 'Performance of rendering axis-aligned rectangles, mimicking original low-level logic for parameter generation.',
        category: 'rectangles' 
    });
} 