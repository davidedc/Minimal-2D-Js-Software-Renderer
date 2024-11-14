// Main application logic and event handlers
function drawShapes() {
  clearFrameBuffer();
  shapes = [];
  
  // Draw random lines
  for (let i = 0; i < 15; i++) {
    const start = getRandomPoint();
    const end = getRandomPoint();
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
    const center = getRandomPoint();
    const rectWidth = 30 + Math.random() * 100;
    const rectHeight = 30 + Math.random() * 100;
    const strokeWidth = Math.random() * 10 + 1;
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
    
    drawAxisAlignedRectSW(
      center.x, center.y, rectWidth, rectHeight,
      strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a,
      fillColor.r, fillColor.g, fillColor.b, fillColor.a,
      strokeWidth
    );
  }

  // Draw rotated rectangles
  for (let i = 0; i < 5; i++) {
    const center = getRandomPoint();
    const rectWidth = 30 + Math.random() * 100;
    const rectHeight = 30 + Math.random() * 100;
    const rotation = Math.random() * Math.PI * 2;
    const strokeWidth = Math.random() * 10 + 1;
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

  // Draw 90-degree arcs with different stroke sizes and radii
  const strokeSizes = [1, 2, 3, 4];
  const radii = [20, 40, 60];
  let xOffset = 150;
  
  for (const strokeSize of strokeSizes) {
      let yOffset = 150;
      for (const radius of radii) {
          const shape = {
              type: 'arc',
              center: { x: xOffset, y: yOffset },
              radius: radius,
              startAngle: 0,
              endAngle: 90,
              strokeWidth: strokeSize,
              strokeColor: { r: 200, g: 100, b: 100, a: 255 },
              fillColor: { r: 0, g: 0, b: 0, a: 0 }
          };
          
          shapes.push(shape);
          drawArcSW(
              shape.center.x, shape.center.y,
              shape.radius,
              shape.startAngle, shape.endAngle,
              shape.strokeColor.r, shape.strokeColor.g, shape.strokeColor.b, shape.strokeColor.a,
              false, shape.strokeWidth
          );
          
          yOffset += radius * 2 + 20;
      }
      xOffset += 120;
  }

  // Add some random filled arcs
  for (let i = 0; i < 3; i++) {
      const arc = getRandomArc();
      shapes.push(arc);
      
      if (arc.fillColor.a > 0) {
          drawArcSW(
              arc.center.x, arc.center.y,
              arc.radius,
              arc.startAngle, arc.endAngle,
              arc.fillColor.r, arc.fillColor.g, arc.fillColor.b, arc.fillColor.a,
              true
          );
      }
      
      if (arc.strokeColor.a > 0 && arc.strokeWidth > 0) {
          drawArcSW(
              arc.center.x, arc.center.y,
              arc.radius,
              arc.startAngle, arc.endAngle,
              arc.strokeColor.r, arc.strokeColor.g, arc.strokeColor.b, arc.strokeColor.a,
              false, arc.strokeWidth
          );
      }
  }

// Draw circles
for (let i = 0; i < 5; i++) {
  const center = getRandomPoint();
  const radius = 15 + Math.random() * 50;
  const strokeWidth = Math.random() * 10 + 1;
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
    drawCircleBresenham(
      center.x, center.y,
      radius,
      fillColor.r, fillColor.g, fillColor.b, fillColor.a,
      true  // fill = true
    );
  }
  
  // Draw stroke if there's a stroke width and color
  if (strokeColor.a > 0 && strokeWidth > 0) {
    drawCircleBresenham(
      center.x, center.y,
      radius,
      strokeColor.r, strokeColor.g, strokeColor.b, strokeColor.a,
      false,  // fill = false
      strokeWidth
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