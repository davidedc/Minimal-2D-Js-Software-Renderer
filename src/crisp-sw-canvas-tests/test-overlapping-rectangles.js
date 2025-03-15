function drawOverlappingRectanglesScene(ctx) {
  ctx.fillStyle = "rgb(0, 0, 255)";
  ctx.fillRect(50, 50, 200, 200);
  ctx.fillStyle = "rgb(0, 255, 0)";
  ctx.fillRect(100, 100, 200, 200);
  ctx.fillStyle = "rgb(255, 0, 0)";
  ctx.fillRect(150, 150, 200, 200);
  // create a yellow rectangle in a random position
  const randomPoint = getRandomPoint();
  ctx.fillStyle = "rgb(255, 255, 0)";
  ctx.fillRect(randomPoint.x, randomPoint.y, 100, 100);
}

function createOverlappingRectanglesTest() {
  return new RenderComparisonBuilder()
    .withId('overlapping-rectangles')
    .withTitle('Overlapping Rectangles Test')
    .withDescription('Tests rendering of multiple overlapping rectangles with different colors')
    .runCanvasCode(drawOverlappingRectanglesScene)
    .build();
}