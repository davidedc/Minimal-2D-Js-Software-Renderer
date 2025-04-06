// Circles with medium opaque fill and no stroke, random positioning and orientation
function draw_circles__M_size__opaque_fill__no_NA_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Medium circles: 10-50px radius per documentation
    const radius = Math.floor(SeededRandom.getRandom() * 40) + 10;
    
    // Ensure circle stays within canvas bounds by constraining center coordinates
    const centerX = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - 2 * radius)) + radius;
    const centerY = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - 2 * radius)) + radius;
    
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // Fully opaque fill
    
    // No stroke - using fillCircle instead of fillAndStrokeCircle
    ctx.fillCircle(
      centerX, centerY, radius,
      r, g, b, a
    );
  }
}