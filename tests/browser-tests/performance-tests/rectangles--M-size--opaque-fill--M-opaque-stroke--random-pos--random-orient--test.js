// Rectangles with medium opaque fill and medium opaque stroke, random positioning and orientation
function draw_rectangles__M_opaque_fill__M_opaque_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
    const y = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
    const width = Math.floor(SeededRandom.getRandom() * 100) + 20;
    const height = Math.floor(SeededRandom.getRandom() * 100) + 20;

    const r = Math.floor(SeededRandom.getRandom() * 256);
    const g = Math.floor(SeededRandom.getRandom() * 256);
    const b = Math.floor(SeededRandom.getRandom() * 256);
    const a = 255; // fully opaque fill

    const lineWidth = Math.floor(SeededRandom.getRandom() * 5) + 1;
    const sr = Math.floor(SeededRandom.getRandom() * 256);
    const sg = Math.floor(SeededRandom.getRandom() * 256);
    const sb = Math.floor(SeededRandom.getRandom() * 256);
    const sa = 255; // fully opaque stroke
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillRect(x, y, width, height);
    
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${sa})`;
    ctx.strokeRect(x, y, width, height);
  }
}