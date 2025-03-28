// Circles with medium opaque fill and medium opaque stroke, random positioning and orientation
function draw_circles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    const centerX = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const centerY = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const radius = Math.floor(SeededRandom.getRandom() * 40) + 10;
    const drawType = SeededRandom.getRandom();
    
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = Math.floor((0.3 + SeededRandom.getRandom() * 0.7) * 255);
    const strokeWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    
    // 33% fill only, 33% stroke only, 33% both
    if (drawType < 0.33) {
      // Fill only
      ctx.fillCircle(centerX, centerY, radius, r, g, b, a);
    } else if (drawType < 0.66) {
      // Stroke only
      ctx.strokeCircle(centerX, centerY, radius, strokeWidth, r, g, b, a);
    } else {
      // Both fill and stroke
      const sr = Math.floor(SeededRandom.getRandom() * 256);
      const sg = Math.floor(SeededRandom.getRandom() * 256);
      const sb = Math.floor(SeededRandom.getRandom() * 256);
      const sa = Math.floor((0.3 + SeededRandom.getRandom() * 0.7) * 255);
      
      ctx.fillAndStrokeCircle(
        centerX, centerY, radius,
        r, g, b, a,
        strokeWidth,
        sr, sg, sb, sa
      );
    }
  }
}