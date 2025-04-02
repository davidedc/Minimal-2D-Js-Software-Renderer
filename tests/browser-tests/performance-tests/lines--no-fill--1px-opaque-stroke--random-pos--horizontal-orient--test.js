// Lines with no fill and 1px opaque stroke, random positioning and horizontal orientation
function draw_lines__no_fill__1px_opaque_stroke__random_pos__horizontal_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Generate random y position
    const y = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    
    // Generate random x positions, ensuring line stays within canvas bounds
    const minX = 0;
    const maxX = CANVAS_WIDTH - 1;
    const x1 = Math.floor(SeededRandom.getRandom() * (maxX - minX)) + minX;
    const x2 = Math.floor(SeededRandom.getRandom() * (maxX - minX)) + minX;
    
    // Keep y2 the same as y1 for horizontal orientation
    const y1 = y;
    const y2 = y;
    
    const lineWidth = 1; // Fixed 1px stroke
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // Fully opaque stroke
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.strokeLine(x1, y1, x2, y2);
  }
}