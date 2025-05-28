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
    'lines--multi_15--no-fill--random-stroke__random_pos--random_orient--test.js',
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