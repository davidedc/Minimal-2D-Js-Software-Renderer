function drawCirclesTestScene(ctx) {
  // Clear the canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Test 1: fillCircle with different colors
  // Row 1: Basic filled circles with different colors
  const row1Y = 80;
  const colors = [
    [255, 0, 0, 255],      // Red
    [0, 255, 0, 255],      // Green
    [0, 0, 255, 255],      // Blue
    [255, 255, 0, 255],    // Yellow
    [0, 255, 255, 255],    // Cyan
    [255, 0, 255, 255]     // Magenta
  ];
  
  for (let i = 0; i < colors.length; i++) {
    const x = 80 + i * 120;
    const [r, g, b, a] = colors[i];
    ctx.fillCircle(x, row1Y, 40, r, g, b, a);
  }
  
  // Test 2: strokeCircle with different widths
  // Row 2: Stroked circles with different widths
  const row2Y = 200;
  const strokeWidths = [1, 2, 4, 8, 12, 16];
  
  for (let i = 0; i < strokeWidths.length; i++) {
    const x = 80 + i * 120;
    const strokeWidth = strokeWidths[i];
    ctx.strokeCircle(x, row2Y, 40, strokeWidth, 0, 0, 0, 255);
  }
  
  // Test 3: strokeCircle with different colors and alpha
  // Row 3: Stroked circles with different colors and alpha
  const row3Y = 320;
  
  for (let i = 0; i < colors.length; i++) {
    const x = 80 + i * 120;
    const [r, g, b, a] = colors[i];
    ctx.strokeCircle(x, row3Y, 40, 4, r, g, b, a);
  }
  
  // Test 4: fillAndStrokeCircle with different combinations
  // Row 4: Combined fill and stroke with different color combinations
  const row4Y = 440;
  
  for (let i = 0; i < colors.length; i++) {
    const x = 80 + i * 120;
    const fillColor = colors[i];
    const strokeColor = colors[(i + 3) % colors.length];
    ctx.fillAndStrokeCircle(
      x, row4Y, 40,
      fillColor[0], fillColor[1], fillColor[2], 128, // Semi-transparent fill
      4,
      strokeColor[0], strokeColor[1], strokeColor[2], 255 // Solid stroke
    );
  }
  
  // Test 5: Transformation effects on circles
  // Row 5: Circles with transforms (translation, rotation, scale)
  const row5Y = 560;
  
  ctx.save();
  
  // Translated circle
  ctx.translate(80, row5Y);
  ctx.fillCircle(0, 0, 30, 255, 0, 0, 128);
  ctx.strokeCircle(0, 0, 30, 2, 0, 0, 0, 255);
  
  // Rotated and translated circle (rotation doesn't affect circles visually)
  ctx.translate(120, 0);
  ctx.rotate(Math.PI / 4);
  ctx.fillCircle(0, 0, 30, 0, 255, 0, 128);
  ctx.strokeCircle(0, 0, 30, 2, 0, 0, 0, 255);
  
  // Scaled circle (larger)
  ctx.resetTransform();
  ctx.translate(320, row5Y);
  ctx.scale(1.5, 1.5);
  ctx.fillCircle(0, 0, 30, 0, 0, 255, 128);
  ctx.strokeCircle(0, 0, 30, 2, 0, 0, 0, 255);
  
  // Scaled circle (smaller)
  ctx.resetTransform();
  ctx.translate(440, row5Y);
  ctx.scale(0.5, 0.5);
  ctx.fillCircle(0, 0, 30, 255, 255, 0, 128);
  ctx.strokeCircle(0, 0, 30, 4, 0, 0, 0, 255);
  
  // Scaled circle (larger)
  ctx.resetTransform();
  ctx.translate(560, row5Y);
  ctx.scale(1.5, 1.5);
  ctx.fillCircle(0, 0, 30, 255, 0, 255, 128);
  ctx.strokeCircle(0, 0, 30, 3, 0, 0, 0, 255);
  
  // Combined transforms
  ctx.resetTransform();
  ctx.translate(680, row5Y);
  ctx.rotate(Math.PI / 6);
  ctx.scale(1.2, 1.2);
  ctx.fillAndStrokeCircle(
    0, 0, 30,
    0, 255, 255, 128,
    4,
    255, 0, 0, 255
  );
  
  ctx.restore();
}

function createCirclesTest() {
  return new RenderTestBuilder()
    .withId('circles-test')
    .withTitle('Circles Rendering Test')
    .withDescription('Tests rendering circles with fill, stroke, and combinations with transformations')
    .runCanvasCode(drawCirclesTestScene)
    .build();
}