// Long stroked lines test functions for performance testing
function drawLongStrokedLines(ctx, count) {
  for (let i = 0; i < count; i++) {
    const x1 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y1 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const x2 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y2 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const lineWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 0.3 + SeededRandom.getRandom() * 0.7;
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.strokeLine(x1, y1, x2, y2);
  }
}

function drawLongStrokedLinesHTML5(ctx, count) {
  for (let i = 0; i < count; i++) {
    const x1 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y1 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const x2 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y2 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const lineWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 0.3 + SeededRandom.getRandom() * 0.7;
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}