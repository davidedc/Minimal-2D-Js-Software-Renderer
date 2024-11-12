// Canvas management and updates
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const canvas2 = document.getElementById('canvas2');
const ctx2 = canvas2.getContext('2d');
ctx2.translate(0.5, 0.5);

const canvas3 = document.getElementById('canvas3');
const ctx3 = canvas3.getContext('2d');

let flipState = true;

function clearFrameBuffer() {
  frameBuffer.fill(0);
}

function updateCanvas() {
  const imageData = new ImageData(frameBuffer, width, height);
  ctx.putImageData(imageData, 0, 0);
}

function drawShapesCanvas() {
  ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

  for (let shape of shapes) {
    if (shape.type === 'line') {
      drawLineCanvas(ctx2, shape);
    } else if (shape.type === 'rect') {
      drawRectCanvas(ctx2, shape);
    }
  }
}

function updateCanvas3() {
  if (flipState) {
    ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
    ctx3.drawImage(canvas, 0, 0);
  } else {
    ctx3.clearRect(0, 0, canvas3.width, canvas3.height);
    ctx3.drawImage(canvas2, 0, 0);
  }
}