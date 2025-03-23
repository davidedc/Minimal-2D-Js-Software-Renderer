// Circles with medium fill and medium stroke test functions
function drawCirclesMFillMStroke(ctx, count) {
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

function drawCirclesMFillMStrokeHTML5(ctx, count) {
  for (let i = 0; i < count; i++) {
    const centerX = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const centerY = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const radius = Math.floor(SeededRandom.getRandom() * 40) + 10;
    const drawType = SeededRandom.getRandom();
    
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 0.3 + SeededRandom.getRandom() * 0.7;
    const strokeWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    
    // 33% fill only, 33% stroke only, 33% both
    if (drawType < 0.33) {
      // Fill only
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fill();
    } else if (drawType < 0.66) {
      // Stroke only
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    } else {
      // Both fill and stroke
      const sr = Math.floor(SeededRandom.getRandom() * 256);
      const sg = Math.floor(SeededRandom.getRandom() * 256);
      const sb = Math.floor(SeededRandom.getRandom() * 256);
      const sa = 0.3 + SeededRandom.getRandom() * 0.7;
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fill();
      
      ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${sa})`;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }
}