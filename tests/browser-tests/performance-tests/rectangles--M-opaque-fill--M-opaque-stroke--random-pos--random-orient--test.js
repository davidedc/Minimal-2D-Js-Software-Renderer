// Rectangles with medium opaque fill and medium opaque stroke, random positioning and orientation
function draw_rectangles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const width = Math.floor(SeededRandom.getRandom() * 100) + 20;
    const height = Math.floor(SeededRandom.getRandom() * 100) + 20;
    const hasFill = SeededRandom.getRandom() > 0.3;
    const hasStroke = SeededRandom.getRandom() > 0.3;
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 0.3 + SeededRandom.getRandom() * 0.7;
    const lineWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    
    if (hasFill) {
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(x, y, width, height);
    }
    
    if (hasStroke) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.strokeRect(x, y, width, height);
    }
  }
}