// Circles with extra large opaque fill and 1px opaque stroke, random positioning and orientation
function draw_circles__XL_opaque_fill__1px_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Extra large circles: 80-200px radius per documentation
    const radius = Math.floor(SeededRandom.getRandom() * 120) + 80;
    
    // Ensure circle stays within canvas bounds by constraining center coordinates
    const centerX = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - 2 * radius)) + radius;
    const centerY = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - 2 * radius)) + radius;
    
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // Fully opaque
    const strokeWidth = 1; // Fixed 1px stroke
    
    const sr = Math.floor(SeededRandom.getRandom() * 256);
    const sg = Math.floor(SeededRandom.getRandom() * 256);
    const sb = Math.floor(SeededRandom.getRandom() * 256);
    const sa = 255; // Fully opaque stroke
    
    ctx.fillAndStrokeCircle(
      centerX, centerY, radius,
      r, g, b, a,
      strokeWidth,
      sr, sg, sb, sa
    );
  }
}