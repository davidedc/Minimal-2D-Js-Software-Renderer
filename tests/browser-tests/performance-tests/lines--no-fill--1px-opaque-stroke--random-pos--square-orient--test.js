// Lines with no fill and 1px opaque stroke, random positioning and square orientation
function draw_lines__no_fill__1px_opaque_stroke__random_pos__square_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Generate a random starting point
    const x1 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y1 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    
    // Randomly decide if line is horizontal or vertical
    const isHorizontal = Math.floor(SeededRandom.getRandom() * 2) === 0;
    
    let x2, y2;
    if (isHorizontal) {
      // Horizontal line: keep y2 = y1, randomize x2
      const maxLength = Math.min(CANVAS_WIDTH - x1, x1);
      const length = Math.floor(SeededRandom.getRandom() * maxLength);
      // Randomly choose direction (left or right)
      x2 = Math.floor(SeededRandom.getRandom() * 2) === 0 ? 
           x1 + length : x1 - length;
      y2 = y1;
    } else {
      // Vertical line: keep x2 = x1, randomize y2
      const maxLength = Math.min(CANVAS_HEIGHT - y1, y1);
      const length = Math.floor(SeededRandom.getRandom() * maxLength);
      // Randomly choose direction (up or down)
      y2 = Math.floor(SeededRandom.getRandom() * 2) === 0 ? 
           y1 + length : y1 - length;
      x2 = x1;
    }
    
    // Ensure coordinates are in bounds
    x2 = Math.max(0, Math.min(CANVAS_WIDTH - 1, x2));
    y2 = Math.max(0, Math.min(CANVAS_HEIGHT - 1, y2));
    
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