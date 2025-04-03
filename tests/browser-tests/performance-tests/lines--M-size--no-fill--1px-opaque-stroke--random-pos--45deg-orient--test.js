// Lines with medium size, no fill and 1px opaque stroke, random positioning and 45-degree orientation
function draw_lines__no_fill__1px_opaque_stroke__random_pos__45deg_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Medium line length: 30-100px
    const lineLength = Math.floor(SeededRandom.getRandom() * 70) + 30;
    
    // Calculate padding needed for diagonal lines
    const padding = lineLength * Math.sqrt(2); // Diagonal length
    
    // Generate a random starting point with enough room for diagonal lines
    const x1 = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - padding));
    const y1 = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - padding));
    
    // Randomly choose one of the four diagonal directions
    const diagonalType = Math.floor(SeededRandom.getRandom() * 4);
    let x2, y2;
    
    // Length for a 45-degree line (same distance in both x and y)
    const diagonalMove = lineLength / Math.sqrt(2);
    
    switch (diagonalType) {
      case 0: // Northeast: x increases, y decreases
        x2 = x1 + diagonalMove;
        y2 = y1 - diagonalMove;
        break;
      case 1: // Southeast: x increases, y increases
        x2 = x1 + diagonalMove;
        y2 = y1 + diagonalMove;
        break;
      case 2: // Southwest: x decreases, y increases
        x2 = x1 - diagonalMove;
        y2 = y1 + diagonalMove;
        break;
      case 3: // Northwest: x decreases, y decreases
        x2 = x1 - diagonalMove;
        y2 = y1 - diagonalMove;
        break;
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