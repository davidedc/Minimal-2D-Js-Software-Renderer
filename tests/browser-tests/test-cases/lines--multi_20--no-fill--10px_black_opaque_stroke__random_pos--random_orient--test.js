/**
 * TEST SUMMARY:
 * =================
 * 
 * Description: Renders 20 lines with 10px black opaque strokes at random positions and orientations. This test is used for both visual regression and performance measurement.
 * 
 * New Filename: line-m20-szMix-fNone-sOpaq-sw10px-lytSpread-edgeNotCrisp-ornRand-test.js
 * 
 * ---
 * 
 * | Facet                  | Value          | Reason
 * |------------------------|----------------|-----------------------------------------------------------------------------------------------------
 * | Shape category         | lines          | The test draws lines using `ctx.strokeLine`.
 * | Count                  | multi-20       | The test is configured to draw 20 lines in its standard visual regression mode.
 * | SizeCategory           | mixed          | Line length is determined by two random points, resulting in a variable length that spans multiple size categories.
 * | FillStyle              | none           | `ctx.fillStyle` is set to `rgba(0,0,0,0)`, meaning no fill is applied.
 * | StrokeStyle            | opaque         | `ctx.strokeStyle` is set to `rgb(0,0,0)`, which is fully opaque.
 * | StrokeThickness        | 10px           | `ctx.lineWidth` is explicitly set to the constant value `10`.
 * | Layout                 | spread         | 20 lines are drawn, each with independently randomized start/end points, distributing them across the canvas.
 * | CenteredAt             | N/A            | This facet is not applicable for lines, which are defined by endpoints, not a geometric center.
 * | EdgeAlignment          | not-crisp      | The random start and end points result in angled lines that are inherently not pixel-aligned.
 * | Orientation            | random         | The orientation of each line is determined by its two random endpoints, resulting in random angles.
 * | ArcAngleExtent         | N/A            | Not an arc shape.
 * | RoundRectRadius        | N/A            | Not a rounded rectangle shape.
 * | ContextTranslation     | none           | The drawing context is not translated; no `ctx.translate()` is called.
 * | ContextRotation        | none           | The drawing context is not rotated; no `ctx.rotate()` is called.
 * | ContextScaling         | none           | The drawing context is not scaled; no `ctx.scale()` is called.
 * | Clipped on shape       | none           | No clipping region is defined or applied in this test.
 * | Clipped on shape count | n/a            | Not applicable as no clipping is used.
 * | Clipped on shape arrangement | n/a      | Not applicable as no clipping is used.
 * | Clipped on shape size  | n/a            | Not applicable as no clipping is used.
 * | Clipped on shape edge alignment | n/a   | Not applicable as there is no clipping.
 * 
 * ---
 * 
 * UNCAPTURED ASPECTS IN FILENAME / FACETS ABOVE:
 * ----------------------------------------------
 * The line length is randomized between 1 and ~301 pixels, which spans the XS, S, M, L, and XL size categories. 
 * The position and orientation are fully randomized within the canvas bounds. The stroke color is fixed black.
 */
/**
 * @fileoverview
 * Test definition for rendering multiple (typically 20 for visual regression,
 * 'instances' count for performance) 10px thick, black, opaque stroke lines
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
 * Draws multiple 10px thick, black, opaque lines at random positions.
 * The number of lines drawn depends on whether 'instances' (for performance mode)
 * or 'initialCount' (for visual regression mode) is active.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx - The rendering context.
 * @param {number} currentIterationNumber - The current test iteration (used by RenderTest for seeding).
 * @param {number} initialCount - The number of lines to draw for a standard (non-performance) run.
 * @param {?number} instances - Optional. If provided and > 0, this many lines are drawn for performance testing.
 * @returns {?{ logs: string[] }} An object with logs, or null (especially in performance mode).
 */
function draw_lines__multi_20__no_fill__10px_black_opaque_stroke__random_pos__random_orient(ctx, currentIterationNumber, initialCount = 20, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const lineCount = isPerformanceRun ? instances : initialCount;

    let logs = isPerformanceRun ? null : [];

    // Set constant drawing properties
    ctx.lineWidth = 10;
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
            logs.push(`&#x2500; 10px Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
        }
    }

    if (!isPerformanceRun && logs.length === 0) {
        // Ensure logs array is not empty if it wasn't a perf run but no lines were drawn (e.g. initialCount = 0)
        logs.push('No 10px black lines drawn.');
    }
    
    return logs && logs.length > 0 ? { logs } : null;
}

// Register the test
registerHighLevelTest(
    'lines--multi_20--no-fill--10px_black_opaque_stroke__random_pos--random_orient--test.js',
    draw_lines__multi_20__no_fill__10px_black_opaque_stroke__random_pos__random_orient,
    'lines',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 }, // Default visual comparison
        drawFunctionArgs: [20] // initialCount for the draw function
    },
    {
        title: 'Lines: Multi-20 No-Fill 10px-Black-Opaque-Stroke Random-Pos Random-Orient',
        // Visual description will be default generated. The one in perf config is more specific to perf.
        displayName: 'Perf: Lines Multi 10px Black Random',
        description: 'Performance test for rendering multiple (default 20, or N from harness) 10px black lines at random positions.'
    }
); 