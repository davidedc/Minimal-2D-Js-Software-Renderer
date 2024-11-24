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

function drawSceneCanvas() {
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  drawShapesImpl(shapes, true);
}

function drawSceneSW() {
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
    } else if (shape.type === 'roundedRect') {
      const draw = isCanvas ? drawRoundedRectCanvas : drawRoundedRectSW;
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

function buildSceneAndDraw() {
  buildScene();

  drawSceneSW();
  updateSWRenderOutput();

  drawSceneCanvas();

  updateFlipOutput();
}

function flipCanvas() {
  flipState = !flipState;
  updateFlipOutput();
}

// Initial draw on page load
buildSceneAndDraw();