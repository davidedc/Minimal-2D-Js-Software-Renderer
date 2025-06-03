/**
 * @fileoverview Arc drawing tests for CrispSwContext.
 */

/**
 * Draws a filled arc (pie slice).
 * @param {CrispSwContext} ctx The CrispSwContext to draw on.
 */
function draw_filled_arc_test(ctx) {
    ctx.fillStyle = 'rgba(255,0,0,0.7)'; // Red, semi-transparent
    ctx.fillArc(100, 75, 50, 0, Math.PI / 2, false); // 90 degree arc
    
    ctx.fillStyle = 'rgba(0,255,0,0.6)'; // Green, semi-transparent
    ctx.fillArc(100, 200, 60, Math.PI / 4, Math.PI * 1.5, false); // Larger arc, different angles
    
    ctx.fillStyle = 'rgba(0,0,255,0.5)'; // Blue, semi-transparent
    ctx.fillArc(250, 125, 40, 0, Math.PI * 2, false); // Full circle as an arc
}

/**
 * Draws a stroked arc.
 * @param {CrispSwContext} ctx The CrispSwContext to draw on.
 */
function draw_stroked_arc_test(ctx) {
    ctx.strokeStyle = 'rgba(0,0,255,1)'; // Blue, opaque
    ctx.lineWidth = 5;
    ctx.outerStrokeArc(100, 75, 50, 0, Math.PI / 2, false);
    
    ctx.strokeStyle = 'rgba(255,0,255,1)'; // Magenta, opaque
    ctx.lineWidth = 8;
    ctx.outerStrokeArc(100, 200, 60, Math.PI / 4, Math.PI * 1.5, true); // Anticlockwise
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,128,0,0.5)'; // Green, semi-transparent
    ctx.outerStrokeArc(250, 125, 40, Math.PI / 6, Math.PI, false);
}

/**
 * Draws a filled and stroked arc.
 * @param {CrispSwContext} ctx The CrispSwContext to draw on.
 */
function draw_fill_and_stroke_arc_test(ctx) {
    ctx.fillStyle = 'rgba(255,255,0,0.5)'; // Yellow, semi-transparent
    ctx.strokeStyle = 'rgba(0,0,0,1)';   // Black, opaque
    ctx.lineWidth = 3;
    ctx.fillAndOuterStrokeArc(100, 75, 50, Math.PI, Math.PI * 1.75, false);
    
    ctx.fillStyle = 'rgba(128,0,128,0.8)'; // Purple, semi-transparent
    ctx.strokeStyle = 'rgba(255,165,0,1)'; // Orange, opaque
    ctx.lineWidth = 1;
    ctx.fillAndOuterStrokeArc(250, 150, 60, 0, Math.PI * 0.8, true); // Anticlockwise
}

/**
 * Defines and registers the arc tests.
 */
function createArcsTest() {
    new RenderTestBuilder()
        .withId('crisp-sw-arc-fill')
        .withTitle('Crisp SW: Filled Arcs')
        .withDescription('Tests drawing of filled arcs (pie slices) using fillArc.')
        .runCanvasCode(draw_filled_arc_test)
        .build();

    new RenderTestBuilder()
        .withId('crisp-sw-arc-stroke')
        .withTitle('Crisp SW: Stroked Arcs')
        .withDescription('Tests drawing of stroked arcs using outerStrokeArc.')
        .runCanvasCode(draw_stroked_arc_test)
        .build();

    new RenderTestBuilder()
        .withId('crisp-sw-arc-fill-and-stroke')
        .withTitle('Crisp SW: Filled & Stroked Arcs')
        .withDescription('Tests drawing of filled and stroked arcs using fillAndOuterStrokeArc.')
        .runCanvasCode(draw_fill_and_stroke_arc_test)
        .build();
} 