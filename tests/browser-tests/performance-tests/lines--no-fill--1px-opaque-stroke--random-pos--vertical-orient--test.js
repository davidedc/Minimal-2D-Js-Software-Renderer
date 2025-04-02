// Lines with no fill and 1px opaque stroke, random positioning and vertical orientation
function draw_lines__no_fill__1px_opaque_stroke__random_pos__vertical_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Generate random x position
    const x = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    
    // Generate random y positions, ensuring line stays within canvas bounds
    const minY = 0;
    const maxY = CANVAS_HEIGHT - 1;
    const y1 = Math.floor(SeededRandom.getRandom() * (maxY - minY)) + minY;
    const y2 = Math.floor(SeededRandom.getRandom() * (maxY - minY)) + minY;
    
    // Keep x2 the same as x1 for vertical orientation
    const x1 = x;
    const x2 = x;
    
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