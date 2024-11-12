// Main application logic and event handlers
function drawShapes() {
  clearFrameBuffer();
  shapes = [];
  
  // Draw random lines
  for (let i = 0; i < 15; i++) {
    const start = toIntegerPoint(getRandomPoint());
    const end = toIntegerPoint(getRandomPoint());
    const thickness = Math.floor(Math.random() * 10) + 1;
    const color = getRandomColor(150, 255);

    shapes.push({
      type: 'line',
      start: start,
      end: end,
      thickness: thickness,
      color: color
    });
    
    drawLine(
      start.x, start.y,
      end.x, end.y,
      thickness,
      color.r, color.g, color.b, color.a
    );
  }

  // Draw axis-aligned rectangles
  for (let i = 0; i < 5; i++) {
    const center = toIntegerPoint(getRandomPoint());
    const rectWidth = Math.floor(30 + Math.random() * 100);
    const rectHeight = Math.floor(30 + Math.random() * 100);
    const strokeWidth = Math.floor(Math.random() * 10) + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);
    
    shapes.push({
      type: 'rect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
    
    drawAxisAlignedRect(
      center.x, center.y, rectWidth, rectHeight,
      strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a,
      fillColor.r, fillColor.g, fillColor.b, fillColor.a,
      strokeWidth
    );
  }

  // Draw rotated rectangles
  for (let i = 0; i < 5; i++) {
    const center = toIntegerPoint(getRandomPoint());
    const rectWidth = Math.floor(30 + Math.random() * 100);
    const rectHeight = Math.floor(30 + Math.random() * 100);
    const rotation = Math.random() * Math.PI * 2;
    const strokeWidth = Math.floor(Math.random() * 10) + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);
    
    shapes.push({
      type: 'rect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      rotation: rotation,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
    
    drawRotatedRect(
      center.x, center.y, rectWidth, rectHeight, rotation,
      strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a,
      fillColor.r, fillColor.g, fillColor.b, fillColor.a,
      strokeWidth
    );
  }

  // Draw circles
  for (let i = 0; i < 5; i++) {
    const center = toIntegerPoint(getRandomPoint());
    const radius = Math.floor(15 + Math.random() * 50);
    const strokeWidth = Math.floor(Math.random() * 10) + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);
    
    shapes.push({
      type: 'circle',
      center: center,
      radius: radius,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
    
    // Draw filled circle first if there's a fill color
    if (fillColor.a > 0) {
      drawCircle(
        center.x, center.y, radius,
        fillColor.r, fillColor.g, fillColor.b, fillColor.a,
        true
      );
    }
    
    // Draw stroke if there's a stroke width and color
    if (strokeColor.a > 0 && strokeWidth > 0) {
      drawCircle(
        center.x, center.y, radius,
        strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a,
        false, strokeWidth
      );
    }
  }


  updateCanvas();
  drawShapesCanvas();
  updateCanvas3();
}

function flipCanvas() {
  flipState = !flipState;
  updateCanvas3();
}

// Initial draw on page load
drawShapes();