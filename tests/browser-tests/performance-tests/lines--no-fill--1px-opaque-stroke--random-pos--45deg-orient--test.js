// Lines with no fill and 1px opaque stroke, random positioning and 45-degree orientation
function draw_lines__no_fill__1px_opaque_stroke__random_pos__45deg_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Generate a random starting point
    const x1 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y1 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    
    // Calculate the maximum possible length for 45-degree line
    // The line needs to stay within canvas bounds in both x and y directions
    const maxPosXLength = CANVAS_WIDTH - 1 - x1;
    const maxPosYLength = CANVAS_HEIGHT - 1 - y1;
    const maxNegXLength = x1;
    const maxNegYLength = y1;
    
    // Randomly choose one of the four diagonal directions
    const diagonalType = Math.floor(SeededRandom.getRandom() * 4);
    let x2, y2;
    
    switch (diagonalType) {
      case 0: // Northeast: x increases, y decreases
        {
          const maxLength = Math.min(maxPosXLength, maxNegYLength);
          const length = Math.floor(SeededRandom.getRandom() * maxLength);
          x2 = x1 + length;
          y2 = y1 - length;
        }
        break;
      case 1: // Southeast: x increases, y increases
        {
          const maxLength = Math.min(maxPosXLength, maxPosYLength);
          const length = Math.floor(SeededRandom.getRandom() * maxLength);
          x2 = x1 + length;
          y2 = y1 + length;
        }
        break;
      case 2: // Southwest: x decreases, y increases
        {
          const maxLength = Math.min(maxNegXLength, maxPosYLength);
          const length = Math.floor(SeededRandom.getRandom() * maxLength);
          x2 = x1 - length;
          y2 = y1 + length;
        }
        break;
      case 3: // Northwest: x decreases, y decreases
        {
          const maxLength = Math.min(maxNegXLength, maxNegYLength);
          const length = Math.floor(SeededRandom.getRandom() * maxLength);
          x2 = x1 - length;
          y2 = y1 - length;
        }
        break;
    }
    
    // Ensure coordinates are in bounds (shouldn't be necessary with the calculations above)
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