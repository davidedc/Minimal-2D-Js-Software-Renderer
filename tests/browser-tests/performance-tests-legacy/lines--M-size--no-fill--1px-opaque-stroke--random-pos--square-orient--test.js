// Lines with medium size, no fill and 1px opaque stroke, random positioning and square orientation
function draw_lines__no_fill__1px_opaque_stroke__random_pos__square_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Medium line length: 30-100px
    const lineLength = Math.floor(SeededRandom.getRandom() * 70) + 30;
    
    // Generate a random starting point with enough room for the line
    const x1 = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - lineLength));
    const y1 = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - lineLength));
    
    // Randomly decide if line is horizontal or vertical
    const isHorizontal = Math.floor(SeededRandom.getRandom() * 2) === 0;
    
    let x2, y2;
    if (isHorizontal) {
      // Horizontal line: keep y2 = y1, set x2 based on medium length
      x2 = x1 + lineLength;
      y2 = y1;
    } else {
      // Vertical line: keep x2 = x1, set y2 based on medium length
      x2 = x1;
      y2 = y1 + lineLength;
    }
    
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