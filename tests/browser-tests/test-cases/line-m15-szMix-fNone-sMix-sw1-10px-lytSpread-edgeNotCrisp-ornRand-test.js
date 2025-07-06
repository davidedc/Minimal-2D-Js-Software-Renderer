/**
 * TEST SUMMARY:
 * =================
 *
 * Description: 15 lines, no fill, random stroke, random positions, random orientations.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine()`.
 * | Count                  | multi-15       | The test is configured to draw 15 lines in a loop for its visual regression mode.
 * | SizeCategory           | mixed          | Line start/end points are random within canvas bounds, so line length can vary greatly, spanning all size categories (XS-XL).
 * | FillStyle              | none           | The test only calls `ctx.strokeLine()` and does not use any fill operations.
 * | StrokeStyle            | mixed          | The stroke alpha is randomized in `[150, 255]`, resulting in both opaque (alpha=255) and semi-transparent strokes.
 * | StrokeThickness        | 1px-10px       | `ctx.lineWidth` is set to `Math.floor(SeededRandom.getRandom() * 10) + 1`, yielding an integer in the range [1, 10].
 * | Layout                 | spread         | Each line's start and end points are randomized independently, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to line primitives.
 * | EdgeAlignment          | not-crisp      | Line coordinates are fully random floating-point values with no logic to align them to pixel boundaries.
 * | Orientation            | random         | With both start and end points chosen randomly, the resulting line orientation is also random.
 * | ArcAngleExtent         | N/A            | This facet is only applicable to arc shapes.
 * | RoundRectRadius        | N/A            | This facet is only applicable to rounded rectangle shapes.
 * | ContextTranslation     | none           | The test code does not contain any calls to `ctx.translate()`.
 * | ContextRotation        | none           | The test code does not contain any calls to `ctx.rotate()`.
 * | ContextScaling         | none           | The test code does not contain any calls to `ctx.scale()`.
 * | Clipped on shape       | none           | The test code does not contain any calls to `ctx.clip()`.
 * | Clipped on shape count | n/a            | Clipping is not used in this test.
 * | Clipped on shape arrangement | n/a      | Clipping is not used in this test.
 * | Clipped on shape size  | n/a            | Clipping is not used in this test.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * Stroke color has randomized RGB values and an alpha randomized in the range [150, 255]. strokeWidth: floor(SR.get()*10)+1 => 1-10px. Line length [1,~301) spans XS,S,M,L,XL.
 *
 */

/**
 * @fileoverview
 * Test definition for rendering multiple (typically 15 for visual regression,
 * 'instances' count for performance) lines with random thickness, color (including alpha),
 * positions, and orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines with varied properties.
 *   - `RenderTest` handles initial seeding of `SeededRandom.getRandom()`.
 * - `initialCount` Parameter:
 *   - Defines the number of lines for a standard visual test run.
 *   - Passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If provided (not null and > 0), signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - Logging is skipped, and `null` is returned in this mode.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering capability
 *     and visual variety, rather than precise checks.
 */

/**
 * Draws multiple lines with random properties (position, thickness, color).
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration.
 * @param {number} initialCount - The number of lines to draw for a standard (non-performance) run.
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function draw_lines__multi_15__no_fill__random_stroke__random_pos__random_orient(ctx, currentIterationNumber, initialCount = 15, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Helper to get a random point within canvas boundaries
    const getRandomPoint = () => ({
        x: SeededRandom.getRandom() * canvasWidth,
        y: SeededRandom.getRandom() * canvasHeight
    });

    // Helper to get a random color string (rgba)
    // Original used getRandomColor(150, 255) where alpha is generated first.
    const getRandomColorString = () => {
        // Match order of SeededRandom.getRandom() calls in global getRandomColor: Alpha, then R, G, B
        const minAlphaForThisTest = 150;
        const maxAlphaForThisTest = 255;
        const a_byte = Math.floor(minAlphaForThisTest + SeededRandom.getRandom() * (maxAlphaForThisTest - minAlphaForThisTest + 1));
        
        const r = Math.floor(SeededRandom.getRandom() * 256);
        const g = Math.floor(SeededRandom.getRandom() * 256);
        const b = Math.floor(SeededRandom.getRandom() * 256);
        
        return `rgba(${r},${g},${b},${(a_byte / 255).toFixed(3)})`;
    };

    for (let i = 0; i < lineCount; i++) {
        const start = getRandomPoint();
        const end = getRandomPoint();
        const thickness = Math.floor(SeededRandom.getRandom() * 10) + 1; // Thickness 1 to 10
        const colorStr = getRandomColorString();

        ctx.lineWidth = thickness;
        ctx.strokeStyle = colorStr;
        // ctx.fillStyle is not relevant for lines unless they have caps that might be filled differently, which is not the case here.

        // --- Single Drawing Block ---
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; Random Line from (${start.x.toFixed(1)}, ${start.y.toFixed(1)}) to (${end.x.toFixed(1)}, ${end.y.toFixed(1)}) thickness: ${thickness}, color: ${colorStr}`);
        }
    }

    if (!isPerformanceRun && logs.length === 0 && lineCount > 0) {
        logs.push('Attempted to draw random lines, but none were generated in the loop.');
    } else if (!isPerformanceRun && lineCount === 0) {
        logs.push('No random lines drawn (lineCount was 0).');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m15-szMix-fNone-sMix-sw1-10px-lytSpread-edgeNotCrisp-ornRand-test.js',
    draw_lines__multi_15__no_fill__random_stroke__random_pos__random_orient,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        drawFunctionArgs: [15] // initialCount for the draw function
    },
    {
        title: 'Lines: Multi-15 No-Fill Random-Stroke Random-Pos Random-Orient',
        displayName: 'Perf: Lines Multi Random Props',
        description: 'Performance test for rendering multiple (default 15, or N from harness) lines with random properties.'
    }
); 
