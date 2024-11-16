// Main application logic and event handlers

// Canvas management and updates
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');

const canvas3 = document.getElementById('canvas3');
const ctx3 = canvas3.getContext('2d');

let flipState = true;

function clearFrameBuffer() {
  frameBuffer.fill(0);
}

function updateSWRenderOutput() {
  const imageData = new ImageData(frameBuffer, width, height);
  ctx.putImageData(imageData, 0, 0);
}

function drawShapesCanvas() {
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  drawShapesImpl(shapes, true);
}

function drawShapesSW() {
  clearFrameBuffer();
  drawShapesImpl(shapes, false);
}

function drawShapesImpl(shapes, isCanvas) {
  for (let shape of shapes) {
    if (shape.type === 'line') {
      const draw = isCanvas ? drawLineCanvas : drawLineSW;
      const args = [
        shape.start.x, shape.start.y,
        shape.end.x, shape.end.y,
        shape.thickness,
        shape.color.r, shape.color.g, shape.color.b, shape.color.a
      ];
      isCanvas ? draw(ctx2, ...args) : draw(...args);
    } else if (shape.type === 'rect') {
      const draw = isCanvas ? drawRectCanvas : drawRectSW;
      isCanvas ? draw(ctx2, shape) : draw(shape);
    } else if (shape.type === 'circle') {
      const draw = isCanvas ? drawCircleCanvas : drawCircleSW;
      isCanvas ? draw(ctx2, shape) : draw(shape);
    } else if (shape.type === 'arc') {
      const draw = isCanvas ? drawArcCanvas : drawArcSW;
      isCanvas ? draw(ctx2, shape) : draw(shape);
    }
  }
}

function updateFlipOutput() {
  if (flipState) {
    ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
    ctx3.drawImage(canvas, 0, 0);
  } else {
    ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
    ctx3.drawImage(canvas2, 0, 0);
  }
}

function drawShapes() {
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
          
          yOffset += radius * 2 + 20;
      }
      xOffset += 120;
  }

  // Add some random filled arcs
  for (let i = 0; i < 3; i++) {
      const arc = getRandomArc();
      shapes.push(arc);
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
  }

  drawShapesSW();
  updateSWRenderOutput();

  drawShapesCanvas();

  updateFlipOutput();
}

function flipCanvas() {
  flipState = !flipState;
  updateFlipOutput();
}

// Initial draw on page load
drawShapes();