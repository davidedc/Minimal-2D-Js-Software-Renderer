// Lines with no fill and large opaque stroke, random positioning and orientation
function draw_lines__no_fill__L_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    const x1 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y1 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const x2 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y2 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const lineWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // fully opaque stroke
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.strokeLine(x1, y1, x2, y2);
  }
}