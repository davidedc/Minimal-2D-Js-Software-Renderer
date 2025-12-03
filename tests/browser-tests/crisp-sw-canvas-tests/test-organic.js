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
  
  // Add some circles to demonstrate the new circle drawing functionality
  ctx.save();
  ctx.globalAlpha = 1.0;
  
  // Add a cluster of circles with different fill and stroke styles
  const centerX = 150;
  const centerY = 300;
  
  // Large background circle with fill only
  ctx.fillCircle(centerX, centerY, 60, new Color(230, 230, 250, 255));

  // Medium circle with both fill and stroke
  ctx.fillAndStrokeCircle(
    centerX, centerY, 45,
    new Color(200, 100, 100, 180),  // Semi-transparent reddish fill
    3,                               // 3px stroke width
    new Color(100, 50, 50, 255)      // Solid darker red stroke
  );

  // Small circle with stroke only
  ctx.strokeCircle(centerX, centerY, 25, 2, new Color(50, 50, 150, 255));

  // Tiny circle with fill only in the center
  ctx.fillCircle(centerX, centerY, 10, new Color(255, 255, 255, 255));
  
  ctx.restore();

  // Test circle clipping
  ctx.save();
  ctx.translate(400, 450); // Position for the circle clipping test

  ctx.beginPath(); // Important to start a new path for clipping
  // Define a circular path for clipping
  // arc(x, y, radius, startAngle, endAngle, anticlockwise = false)
  ctx.arc(50, 50, 50, 0, 2 * Math.PI);
  ctx.clip();

  // Draw shapes that should be clipped by the circle
  ctx.fillStyle = "rgba(255, 0, 255, 0.7)"; // Magenta
  ctx.fillRect(0, 0, 100, 100); // A square that will be clipped into a circle segment

  ctx.strokeStyle = "rgba(0, 255, 0, 1)"; // Green
  ctx.lineWidth = 5;
  ctx.strokeLine(0, 50, 100, 50); // Horizontal line through the circle center
  ctx.strokeLine(50, 0, 50, 100); // Vertical line through the circle center

  ctx.strokeStyle = "rgba(255, 255, 0, 1)"; // Yellow
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, 50, 50); // A smaller rectangle inside the circle
  
  // Draw lines that extend outside the circle
  ctx.strokeStyle = "rgba(0, 0, 0, 1)"; // Black
  ctx.lineWidth = 3;
  ctx.strokeLine(-20, -20, 120, 120); // Diagonal line across the clipping region
  ctx.strokeLine(-20, 120, 120, -20); // Another diagonal line

  ctx.restore();
}

function createOrganicTest() {
  return new RenderTestBuilder()
    .withId('organic-shapes-and-transforms')
    .withTitle('Organic Shapes with Transformations')
    .withDescription('Tests complex rendering with clipping, transformations, and alpha blending')
    .runCanvasCode(drawOrganicTestScene)
    .build();
}