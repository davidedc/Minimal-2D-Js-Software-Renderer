// Circles with extra large opaque fill and extra large opaque stroke, random positioning and orientation
function draw_circles__XL_opaque_fill__XL_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Extra large circles: 80-200px radius per documentation
    const radius = Math.floor(SeededRandom.getRandom() * 120) + 80;
    
    // Extra large stroke: 10-20px per documentation
    const strokeWidth = Math.floor(SeededRandom.getRandom() * 11) + 10;
    const totalRadius = radius + strokeWidth/2;
    
    // Ensure circle stays within canvas bounds by constraining center coordinates
    const centerX = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - 2 * totalRadius)) + totalRadius;
    const centerY = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - 2 * totalRadius)) + totalRadius;
    
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // Fully opaque fill

    const sr = Math.floor(SeededRandom.getRandom() * 256);
    const sg = Math.floor(SeededRandom.getRandom() * 256);
    const sb = Math.floor(SeededRandom.getRandom() * 256);
    const sa = 255; // Fully opaque stroke
    
    ctx.fillAndStrokeCircle(centerX, centerY, radius, new Color(r, g, b, a), strokeWidth, new Color(sr, sg, sb, sa));
  }
}