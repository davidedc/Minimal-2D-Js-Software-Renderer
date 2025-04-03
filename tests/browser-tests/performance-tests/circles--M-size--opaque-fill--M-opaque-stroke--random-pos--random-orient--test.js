// Circles with medium opaque fill and medium opaque stroke, random positioning and orientation
function draw_circles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    const radius = Math.floor(SeededRandom.getRandom() * 40) + 10;
    const strokeWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    const totalRadius = radius + strokeWidth/2;

    // Ensure circle stays within canvas bounds by constraining center coordinates
    const centerX = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - 2*totalRadius)) + totalRadius;
    const centerY = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - 2*totalRadius)) + totalRadius;
    
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // fully opaque fill
    
    const sr = Math.floor(SeededRandom.getRandom() * 256);
    const sg = Math.floor(SeededRandom.getRandom() * 256);
    const sb = Math.floor(SeededRandom.getRandom() * 256);
    const sa = 255; // fully opaque stroke
    
    ctx.fillAndStrokeCircle(
      centerX, centerY, radius,
      r, g, b, a,
      strokeWidth,
      sr, sg, sb, sa
    );
  }
}