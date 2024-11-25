class RenderComparison {
  constructor(id) {
    this.id = id;
    this.flipState = true;
    this.shapes = [];
    
    // Create container
    this.container = document.createElement('div');
    this.container.style.marginBottom = '20px';
    
    // Create canvases
    this.swCanvas = this.createCanvas('sw');
    this.canvasCanvas = this.createCanvas('canvas');
    this.displayCanvas = this.createCanvas('display');
    
    this.container.appendChild(this.swCanvas);
    this.container.appendChild(this.canvasCanvas);
    this.container.appendChild(this.displayCanvas);
    
    // Get contexts
    this.swCtx = this.swCanvas.getContext('2d');
    this.canvasCtx = this.canvasCanvas.getContext('2d');
    this.displayCtx = this.displayCanvas.getContext('2d');
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.marginTop = '10px';
    
    // Add flip button
    const flipButton = document.createElement('button');
    flipButton.textContent = 'Flip View';
    flipButton.onclick = () => this.flip();
    flipButton.style.margin = '0 5px';
    
    // Add new random button
    const randomButton = document.createElement('button');
    randomButton.textContent = 'New Random Examples';
    randomButton.onclick = () => this.render(this.buildShapesFn);
    randomButton.style.margin = '0 5px';
    
    buttonContainer.appendChild(flipButton);
    buttonContainer.appendChild(randomButton);
    this.container.appendChild(buttonContainer);
    
    document.body.appendChild(this.container);
  }

  createCanvas(name) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = '1px solid black';
    canvas.title = `${this.id}-${name}`;
    return canvas;
  }

  clearFrameBuffer() {
    frameBuffer.fill(0);
  }

  updateSWRenderOutput() {
    const imageData = new ImageData(frameBuffer, width, height);
    this.swCtx.putImageData(imageData, 0, 0);
  }

  drawSceneCanvas() {
    this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtx.clearRect(0, 0, this.canvasCanvas.width, this.canvasCanvas.height);
    drawShapesImpl(this.shapes, true, this.canvasCtx);
  }

  drawSceneSW() {
    this.clearFrameBuffer();
    drawShapesImpl(this.shapes, false);
  }

  flip() {
    this.flipState = !this.flipState;
    this.updateFlipOutput();
  }

  updateFlipOutput() {
    this.displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);
    
    if (this.flipState) {
      this.displayCtx.drawImage(this.swCanvas, 0, 0);
    } else {
      this.displayCtx.drawImage(this.canvasCanvas, 0, 0);
    }
  }

  render(buildShapesFn) {
    this.buildShapesFn = buildShapesFn; // Store the function for later use
    this.shapes = [];
    buildShapesFn(this.shapes);
    
    this.drawSceneSW();
    this.updateSWRenderOutput();
    
    this.drawSceneCanvas();
    
    this.flipState = true;
    this.updateFlipOutput();
  }
}

// Modified drawShapesImpl to accept ctx as parameter
function drawShapesImpl(shapes, isCanvas, ctx = null) {
  for (let shape of shapes) {
    if (shape.type === 'line') {
      const draw = isCanvas ? drawLineCanvas : drawLineSW;
      const args = [
        shape.start.x, shape.start.y,
        shape.end.x, shape.end.y,
        shape.thickness,
        shape.color.r, shape.color.g, shape.color.b, shape.color.a
      ];
      isCanvas ? draw(ctx, ...args) : draw(...args);
    } else if (shape.type === 'rect') {
      const draw = isCanvas ? drawRectCanvas : drawRectSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'circle') {
      const draw = isCanvas ? drawCircleCanvas : drawCircleSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'arc') {
      const draw = isCanvas ? drawArcCanvas : drawArcSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'roundedRect') {
      const draw = isCanvas ? drawRoundedRectCanvas : drawRoundedRectSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    }
  }
}

function addRenderComparison(id, buildShapesFn) {
  const comparison = new RenderComparison(id);
  comparison.render(buildShapesFn);
  return comparison;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Add centered rounded rect comparison
  addRenderComparison('centered-rounded-rect', (shapes) => {
    addCenteredRoundedRect(shapes);
  });
  
  // Add thin rounded rects comparison
  addRenderComparison('thin-rounded-rects', (shapes) => {
    addThinStrokeRoundedRectangles(10, shapes);
  });
  
  // Add main comparison with all shapes
  addRenderComparison('all-shapes', (shapes) => {
    buildScene(shapes);
  });
});