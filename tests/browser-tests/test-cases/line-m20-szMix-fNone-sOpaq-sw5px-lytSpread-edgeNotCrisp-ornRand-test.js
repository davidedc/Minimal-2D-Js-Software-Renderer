/**
 * TEST SUMMARY:
 * =================
 *
 * Description: Renders 20 lines with a 5px black opaque stroke at random positions and with random orientations.
 *
 *
 * ---
 *
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine`.
 * | Count                  | multi-20       | The test is configured to draw 20 lines in its default visual regression mode (`initialCount = 20`).
 * | SizeCategory           | mixed          | Line length is determined by two random points on the canvas, leading to a wide, unpredictable range of lengths that spans multiple size categories (XS to XL).
 * | FillStyle              | none           | Lines do not have a fill, and `ctx.fillStyle` is set to be fully transparent. Only a stroke operation is performed.
 * | StrokeStyle            | opaque         | The stroke color is explicitly set to `rgb(0,0,0)`, which is fully opaque.
 * | StrokeThickness        | 5px            | The context's `lineWidth` is hardcoded to 5.
 * | Layout                 | spread         | The start and end points for each of the 20 lines are chosen randomly, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable to lines, as their primary anchor points are their ends, not a geometric center.
 * | EdgeAlignment          | not-crisp      | The line coordinates are random integers and the stroke width is odd (5px). No crisping logic is applied, so the final rendered edges are not guaranteed to align with pixel boundaries.
 * | Orientation            | random         | With both start and end points chosen randomly for each line, the resulting orientation is also random.
 * | ArcAngleExtent         | N/A            | Not applicable to lines.
 * | RoundRectRadius        | N/A            | Not applicable to lines.
 * | ContextTranslation     | none           | The test does not use `ctx.translate()`.
 * | ContextRotation        | none           | The test does not use `ctx.rotate()`.
 * | ContextScaling         | none           | The test does not use `ctx.scale()`.
 * | Clipped on shape       | none           | The test does not apply any clipping regions.
 * | Clipped on shape count | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape arrangement | n/a      | Not applicable as there is no clipping.
 * | Clipped on shape size  | n/a            | Not applicable as there is no clipping.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 *
 * ---
 *
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The line length is randomized from 0 up to the canvas diagonal length. The stroke color is fixed to opaque black.
 *
 */

/**
 * @fileoverview
 * Test definition for rendering multiple (typically 20 for visual regression,
 * 'instances' count for performance) 5px thick, black, opaque stroke lines
 * at random positions and with random orientations.
 *
 * Guiding Principles for this draw function:
 * - General:
 *   - The function is designed to draw a variable number of lines.
 *   - `currentIterationNumber` is used to seed `SeededRandom` if drawing the 'initialCount'
 *     of lines (e.g., for visual regression tests where reproducibility of the scene is key).
 *     However, for the core logic of getting random points for lines, this function
 *     directly uses `SeededRandom.getRandom()` as per standard practice, assuming
 *     `RenderTest` handles initial seeding.
 * - `initialCount` Parameter:
 *   - This parameter defines the number of lines to draw for a standard visual test run.
 *   - It's passed to `runCanvasCode` by the `define_..._test` function.
 * - `instances` Parameter (for Performance Testing):
 *   - If `instances` is provided (not null and > 0), it signifies a performance test run.
 *   - The function will then draw 'instances' number of lines instead of 'initialCount'.
 *   - In this mode, logging is skipped, and `null` is returned.
 *   - `SeededRandom` is still used for coordinates to maintain the nature of the test,
 *     but the sheer number of operations is the focus.
 * - Return Value:
 *   - Returns an object with a `logs` array for single/initialCount runs.
 *   - Returns `null` if `instances` is set (performance mode) or if no logs are generated.
 *   - No `checkData` is returned as this test primarily focuses on rendering multiple
 *     lines without specific positional or color checks beyond visual comparison and
 *     performance measurement.
 */

/**
 * Draws multiple 5px thick, black, opaque lines at random positions.
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function drawTest(ctx, currentIterationNumber, instances = null) {
    const initialCount = 20; // number of lines to draw for visual regression mode (i.e. not in performance mode)
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    // Set constant drawing properties
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgb(0,0,0)'; // Opaque black in RGB format
    ctx.fillStyle = 'rgba(0,0,0,0)'; // No fill for lines

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // Helper to get a random point within canvas boundaries (integer for simplicity here)
    // SeededRandom.getRandom() is expected to be seeded by RenderTest per iteration.
    const getRandomPoint = () => ({
        x: Math.floor(SeededRandom.getRandom() * canvasWidth),
        y: Math.floor(SeededRandom.getRandom() * canvasHeight)
    });

    for (let i = 0; i < lineCount; i++) {
        const start = getRandomPoint();
        const end = getRandomPoint();

        // --- Single Drawing Block ---
        // Using strokeLine as it's common in these tests.
        // Assumes it's available/polyfilled on ctx.
        ctx.strokeLine(start.x, start.y, end.x, end.y);
        // --- End Single Drawing Block ---

        if (!isPerformanceRun) {
            logs.push(`&#x2500; 5px Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        }
    }

    if (!isPerformanceRun && logs.length === 0) {
        // Ensure logs array is not empty if it wasn't a perf run but no lines were drawn (e.g. initialCount = 0)
        logs.push('No 5px black lines drawn.');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'line-m20-szMix-fNone-sOpaq-sw5px-lytSpread-edgeNotCrisp-ornRand-test',
    drawTest,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
    },
    {
        title: 'Lines: Multi-20 No-Fill 5px-Black-Opaque-Stroke Random-Pos Random-Orient',
        displayName: 'Perf: Lines Multi 5px Black Random',
        description: 'Performance test for rendering multiple (default 20, or N from harness) 5px black lines at random positions.'
    }
); 
