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
  // Clear and reset canvas state completely
  ctx2.setTransform(1, 0, 0, 1, 0, 0); // Reset any transforms
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

function flipCanvas() {
  flipState = !flipState;
  updateFlipOutput();
}

function updateFlipOutput() {
  ctx3.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
  
  if (flipState) {
    ctx3.drawImage(canvas, 0, 0, canvas3.width, canvas3.height);
  } else {
    ctx3.drawImage(canvas2, 0, 0, canvas3.width, canvas3.height);
  }
}

function buildSceneAndDraw() {
  buildScene();

  drawSceneSW();
  updateSWRenderOutput();

  drawSceneCanvas();

  flipState = true; // Ensure initial state is set
  updateFlipOutput(); // Show software renderer output initially
}

// Remove or comment out the initial buildSceneAndDraw() call since it's called by the DOMContentLoaded handler

// Add DOM ready handler
document.addEventListener('DOMContentLoaded', () => {
  // Ensure all canvases have the same size as the frame buffer
  [canvas, canvas2, canvas3].forEach(c => {
    c.width = width;
    c.height = height;
    // Make canvases visible with different background colors for debugging
    c.style.border = '1px solid black';
  });
  
  buildSceneAndDraw();

});