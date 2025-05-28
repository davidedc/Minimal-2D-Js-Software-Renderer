/**
 * @fileoverview Test definition for a combined scene with all shape types.
 */

// Assumes all individual scene-creation functions (addRandomLines, addAxisAlignedRectangles, etc.)
// and helper functions (_colorObjectToString, getRandomColor, getRandomPoint, etc.) are globally available
// as they are included in the HTML test pages.

/**
 * Draws a combined scene mimicking the original buildScene function.
 *
 * @param {CanvasRenderingContext2D | CrispSwContext} ctx The rendering context.
 * @param {number} currentIterationNumber The current test iteration (for seeding via RenderTest).
 * @param {?number} instances Optional: Number of full scenes to draw. 
 *                  In visual mode (instances is null/0), one full scene is drawn with original counts.
 *                  In performance mode, `instances` full scenes are drawn.
 * @returns {?{logs: string[]}} Logs for the visual regression run.
 */
function draw_scene_all_shapes_combined(ctx, currentIterationNumber, instances = null) {
    const isPerformanceRun = instances !== null && instances > 0;
    const numScenesToDraw = isPerformanceRun ? instances : 1;

    let logs = [];
    const dummyLog = { innerHTML: '' }; // Original functions write to log.innerHTML

    // Helper to draw shapes from the array populated by original add... functions
    function drawShapesFromArray(shapesArray, context) {
        shapesArray.forEach(shape => {
            const fillColorStr = shape.fillColor ? _colorObjectToString(shape.fillColor) : 'rgba(0,0,0,0)';
            const strokeColorStr = shape.strokeColor ? _colorObjectToString(shape.strokeColor) : 'rgba(0,0,0,0)';
            context.fillStyle = fillColorStr;
            context.strokeStyle = strokeColorStr;
            context.lineWidth = shape.strokeWidth || (shape.thickness || 0); // Use thickness for lines

            if (shape.type === 'rect') {
                if (shape.rotation && shape.rotation !== 0) {
                    context.save();
                    context.translate(shape.center.x, shape.center.y);
                    context.rotate(shape.rotation);
                    if (shape.fillColor && shape.fillColor.a > 0) {
                        context.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
                    }
                    if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                        context.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
                    }
                    context.restore();
                } else {
                    const x = shape.center.x - shape.width / 2;
                    const y = shape.center.y - shape.height / 2;
                    if (shape.fillColor && shape.fillColor.a > 0) {
                        context.fillRect(x, y, shape.width, shape.height);
                    }
                    if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                        context.strokeRect(x, y, shape.width, shape.height);
                    }
                }
            } else if (shape.type === 'roundedRect') {
                const x = shape.center.x - shape.width / 2;
                const y = shape.center.y - shape.height / 2;
                if (shape.fillColor && shape.fillColor.a > 0) {
                    context.fillRoundRect(x, y, shape.width, shape.height, shape.radius);
                }
                if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                    context.strokeRoundRect(x, y, shape.width, shape.height, shape.radius);
                }
            } else if (shape.type === 'circle') {
                if (shape.fillColor && shape.fillColor.a > 0 && shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                     context.fillAndStrokeCircle(shape.center.x, shape.center.y, shape.radius,
                        shape.fillColor.r, shape.fillColor.g, shape.fillColor.b, shape.fillColor.a,
                        shape.strokeWidth,
                        shape.strokeColor.r, shape.strokeColor.g, shape.strokeColor.b, shape.strokeColor.a);
                } else if (shape.fillColor && shape.fillColor.a > 0) {
                    context.fillCircle(shape.center.x, shape.center.y, shape.radius,
                        shape.fillColor.r, shape.fillColor.g, shape.fillColor.b, shape.fillColor.a);
                } else if (shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
                     context.strokeCircle(shape.center.x, shape.center.y, shape.radius, shape.strokeWidth,
                        shape.strokeColor.r, shape.strokeColor.g, shape.strokeColor.b, shape.strokeColor.a);
                }
            } else if (shape.type === 'line') {
                context.strokeLine(shape.start.x, shape.start.y, shape.end.x, shape.end.y);
            } else if (shape.type === 'arc') {
                const startAngleRad = (shape.startAngle || 0) * Math.PI / 180;
                const endAngleRad = (shape.endAngle || 0) * Math.PI / 180;
                // Assuming fill implies fill, stroke implies stroke, both implies both
                const hasFill = shape.fillColor && shape.fillColor.a > 0;
                const hasStroke = shape.strokeColor && shape.strokeColor.a > 0 && shape.strokeWidth > 0;

                if (hasFill && hasStroke) {
                    context.fillAndStrokeArc(shape.center.x, shape.center.y, shape.radius, 
                                           startAngleRad, endAngleRad, shape.counterClockwise || false);
                } else if (hasFill) {
                    context.fillArc(shape.center.x, shape.center.y, shape.radius, 
                                  startAngleRad, endAngleRad, shape.counterClockwise || false);
                } else if (hasStroke) {
                    context.strokeArc(shape.center.x, shape.center.y, shape.radius, 
                                    startAngleRad, endAngleRad, shape.counterClockwise || false);
                }
            }
        });
    }

    for (let sceneIdx = 0; sceneIdx < numScenesToDraw; sceneIdx++) {
        const effectiveIterationNumber = currentIterationNumber + sceneIdx;
        let shapes = [];

        // 1. Random Lines (Original count: 15)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRandomLines(shapes, dummyLog, effectiveIterationNumber, 15); 
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 2. Axis Aligned Rectangles (Original count: 5)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addAxisAlignedRectangles(shapes, dummyLog, effectiveIterationNumber, 5);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 3. Rotated Rectangles (Original count: 5)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRotatedRectangles(shapes, dummyLog, effectiveIterationNumber, 5);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 4. Axis-Aligned Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addAxisAlignedRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 5. Large Transparent Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addLargeTransparentRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 6. No-Stroke Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addNoStrokeRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 7. 90-degree Arcs (Original: no count, creates 12)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addNinetyDegreeArcs(shapes, dummyLog, effectiveIterationNumber);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 8. Random Arcs (Original count: 3)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRandomArcs(shapes, dummyLog, effectiveIterationNumber, 3);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 9. Random Circles (Original count: 5)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addRandomCircles(shapes, dummyLog, effectiveIterationNumber, 5);
        drawShapesFromArray(shapes, ctx); shapes = [];

        // 10. Thin Opaque Stroke Rounded Rectangles (Original count: 10)
        SeededRandom.seedWithInteger(effectiveIterationNumber);
        addThinOpaqueStrokeRoundedRectangles(shapes, dummyLog, effectiveIterationNumber, 10);
        drawShapesFromArray(shapes, ctx); shapes = [];
        
        if (!isPerformanceRun) { // Log only for the single visual pass (which is sceneIdx = 0)
            logs.push(`Drew combined scene instance ${sceneIdx + 1} based on effective iteration ${effectiveIterationNumber}.`);
        }
    }

    if (isPerformanceRun) {
        return null; 
    }
    return { logs };
}

// Register the test
registerHighLevelTest(
    'scene--all-shapes-combined--test.js',
    draw_scene_all_shapes_combined,
    'scenes',
    {
        //compare: { swTol: 0, refTol: 0, diffTol: 0 } // Default visual comparison
    },
    {
        displayName: 'Perf: Scene All Combined',
        description: 'Performance of drawing a combined scene with multiple shape types.'
    }
); 