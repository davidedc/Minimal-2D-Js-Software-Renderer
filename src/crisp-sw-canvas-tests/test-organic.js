function drawOrganicTestScene(ctx) {
  // Basic red rectangle with fill
  // however we are not going to see it
  // because we are going to clear the whole canvas
  // after drawing it
  ctx.fillStyle = "rgb(255, 0, 0)";
  ctx.fillRect(100, 100, 150, 100);
  // clear the whole canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // test clipping
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

  ctx.save()
  ctx.save();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.translate(20,20);
  ctx.save();
  //ctx.beginPath();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();

  ctx.translate(140,-20);

  ctx.save();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.translate(20,20);
  ctx.save();
  ctx.beginPath();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();

  ctx.translate(140,-20);

  ctx.save();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.rotate(Math.PI / 16);
  ctx.save();
  //ctx.beginPath();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();

  ctx.translate(140,-20);

  ctx.save();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.translate(20,20);
  ctx.save();
  ctx.beginPath();
  ctx.rect(50, 50, 100, 100);
  ctx.clip();
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  ctx.restore();

  // Stroked rectangle with crisp lines
  ctx.strokeStyle = "rgb(0, 0, 255)";

  ctx.lineWidth = 1;
  ctx.strokeRect(1.5, 1.5, 5, 5);
  ctx.strokeRect(20.5, 20.5, 249, 199);

  ctx.rotate(Math.PI / 16);

  // Demonstrate transformations
  ctx.save();
  ctx.translate(150, 150);
  ctx.rotate(Math.PI / 16);
  ctx.scale(2, 2);
  ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
  ctx.fillRect(0, 0, 50, 50);
  ctx.restore();

  // Example of overlapping shapes
  ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
  ctx.fillRect(250, 80, 100, 100);
  
  ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
  ctx.fillRect(300, 130, 100, 100);

  // Example of clearing a region
  ctx.fillStyle = "rgba(128, 0, 128, 1)";
  ctx.fillRect(450, 50, 200, 200);
  ctx.clearRect(500, 100, 100, 100);

  // Example of nested transformations
  ctx.save();
  ctx.translate(350, 350);
  
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillRect(-25, -25, 50, 50);
  
  ctx.rotate(Math.PI / 16);
  ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
  ctx.fillRect(-25, -25, 50, 50);
  
  ctx.scale(1.5, 1.5);
  ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
  ctx.fillRect(-25, -25, 50, 50);
  
  ctx.restore();

  ctx.save();
  ctx.translate(500, 350);
  
  // Draw three overlapping rectangles with different globalAlpha values
  ctx.fillStyle = "rgb(255, 0, 0)";
  ctx.globalAlpha = 1.0;
  ctx.fillRect(-50, -50, 100, 100);
  
  ctx.fillStyle = "rgb(0, 255, 0)";
  ctx.globalAlpha = 0.5;
  ctx.fillRect(-25, -25, 100, 100);
  
  ctx.fillStyle = "rgb(0, 0, 255)";
  ctx.globalAlpha = 0.25;
  ctx.fillRect(0, 0, 100, 100);
  ctx.restore();
  
  // Add lines to demonstrate the new strokeLine functionality
  ctx.save();
  ctx.globalAlpha = 1.0;
  
  // Draw a grid pattern
  ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
  ctx.lineWidth = 1;
  
  // Vertical lines
  for (let x = 50; x <= 250; x += 50) {
    ctx.strokeLine(x, 400, x, 550);
  }
  
  // Horizontal lines
  for (let y = 400; y <= 550; y += 50) {
    ctx.strokeLine(50, y, 250, y);
  }
  
  // Draw a star pattern with lines
  ctx.save();
  ctx.translate(650, 450);
  
  // Thick star lines
  ctx.lineWidth = 3;
  const colors = [
    "rgb(255, 0, 0)",      // Red
    "rgb(0, 255, 0)",      // Green
    "rgb(0, 0, 255)",      // Blue
    "rgba(255, 255, 0, 1)", // Yellow
    "rgba(0, 255, 255, 1)"  // Cyan
  ];
  
  for (let i = 0; i < 10; i++) {
    ctx.strokeStyle = colors[i % colors.length];
    const angle = (i / 10) * Math.PI * 2;
    const x = Math.cos(angle) * 80;
    const y = Math.sin(angle) * 80;
    ctx.strokeLine(0, 0, x, y);
  }
  
  ctx.restore();
  ctx.restore();
}

function createOrganicTest() {
  return new RenderComparisonBuilder()
    .withId('organic-shapes-and-transforms')
    .withTitle('Organic Shapes with Transformations')
    .withDescription('Tests complex rendering with clipping, transformations, and alpha blending')
    .runCanvasCode(drawOrganicTestScene)
    .build();
}