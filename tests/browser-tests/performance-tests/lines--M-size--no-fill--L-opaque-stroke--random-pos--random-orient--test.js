// Lines with medium size, no fill and large opaque stroke, random positioning and orientation
function draw_lines__no_fill__L_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Medium line length: 30-100px
    const lineLength = Math.floor(SeededRandom.getRandom() * 70) + 30;
    
    // Random starting point
    const x1 = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - lineLength));
    const y1 = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - lineLength));
    
    // Calculate endpoint based on random angle and medium length
    const angle = SeededRandom.getRandom() * Math.PI * 2; // Random angle in radians
    const x2 = x1 + Math.cos(angle) * lineLength;
    const y2 = y1 + Math.sin(angle) * lineLength;
    
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