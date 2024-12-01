class RenderComparison {
  static sections = [];

  constructor(id, title) {
    RenderComparison.sections.push({ id, title });
    
    this.id = id;
    this.flipState = true;
    this.shapes = [];
    
    // Create container with anchor
    this.container = document.createElement('div');
    this.container.className = 'comparison-container';
    this.container.id = id;
    
    // Add divider
    const divider = document.createElement('hr');
    this.container.appendChild(divider);
    
    // Add top link
    const topLink = document.createElement('div');
    topLink.className = 'top-link-container';
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = '\u2191 top';  // Unicode escape for ↑
    link.className = 'top-link';
    topLink.appendChild(link);
    this.container.appendChild(topLink);
    
    // Add title
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.className = 'comparison-title';
    this.container.appendChild(titleElement);
    
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
    buttonContainer.className = 'button-container';
    
    // Add New Example button first
    const runButton = document.createElement('button');
    runButton.textContent = 'New Example';
    runButton.onclick = () => this.render(this.buildShapesFn);
    runButton.className = 'action-button';
    
    // Add run 10 examples button
    const run10Button = document.createElement('button');
    run10Button.textContent = 'Run 10 Examples';
    run10Button.onclick = () => this.runMultipleExamples(10);
    run10Button.className = 'action-button';

    // Add run 100 examples button
    const run100Button = document.createElement('button');
    run100Button.textContent = 'Run 100 Examples';
    run100Button.onclick = () => this.runMultipleExamples(100);
    run100Button.className = 'action-button';
    
    // Add flip button last
    const flipButton = document.createElement('button');
    flipButton.textContent = 'Flip alternating view';
    flipButton.onclick = () => this.flip();
    flipButton.className = 'action-button';
    
    buttonContainer.appendChild(runButton);
    buttonContainer.appendChild(run10Button);
    buttonContainer.appendChild(run100Button);
    buttonContainer.appendChild(flipButton);
    this.container.appendChild(buttonContainer);
    
    // Add metrics container
    this.metricsContainer = document.createElement('div');
    this.metricsContainer.className = 'metrics-container';
    this.container.appendChild(this.metricsContainer);
    
    // Add errors container
    this.errorsContainer = document.createElement('div');
    this.errorsContainer.className = 'errors-container';
    this.errorsContainer.style.color = 'red';
    this.container.appendChild(this.errorsContainer);
    
    document.body.appendChild(this.container);
  }

  createCanvas(name) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = 'comparison-canvas';
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

  countUniqueColorsInMiddleRow(ctx, expectedColors = null) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const middleY = Math.floor(ctx.canvas.height / 2);
    const uniqueColors = new Set();
    
    // Scan middle row
    for(let x = 0; x < ctx.canvas.width; x++) {
      const i = (middleY * ctx.canvas.width + x) * 4;
      // Skip background pixels - those are fully transparent
      if(data[i+3] === 255) continue;
      // Create color key
      const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
      uniqueColors.add(colorKey);
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      this.showError(`Expected ${expectedColors} colors but found ${count} colors in middle row of ${ctx.canvas.title}`);
    }
    
    return count;
  }

  countUniqueColorsInMiddleColumn(ctx, expectedColors = null) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const middleX = Math.floor(ctx.canvas.width / 2);
    const uniqueColors = new Set();
    
    // Scan middle column
    for(let y = 0; y < ctx.canvas.height; y++) {
      const i = (y * ctx.canvas.width + middleX) * 4;
      // Skip background pixels - those are fully transparent
      if(data[i+3] === 255) continue;
      // Create color key
      const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
      uniqueColors.add(colorKey);
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      this.showError(`Expected ${expectedColors} colors but found ${count} colors in middle column of ${ctx.canvas.title}`);
    }
    
    return count;
  }

  showError(message) {
    // Create and add clear errors button if not already present
    if (!this.clearErrorsButton) {
      this.clearErrorsButton = document.createElement('button');
      this.clearErrorsButton.textContent = 'Clear Errors';
      this.clearErrorsButton.className = 'action-button';
      this.clearErrorsButton.onclick = () => this.clearErrors();
      this.errorsContainer.appendChild(document.createElement('br'));
      this.errorsContainer.appendChild(this.clearErrorsButton);
    }

    const errorMessage = document.createElement('div');
    errorMessage.textContent = message;
    this.errorsContainer.insertBefore(errorMessage, this.clearErrorsButton);
    
  }

  clearErrors() {
    this.errorsContainer.textContent = '';
    if (this.clearErrorsButton) {
      this.clearErrorsButton.remove();
      this.clearErrorsButton = null;
    }
  }

  showMetrics(metricsFunction) {
    if (metricsFunction) {
      const result = metricsFunction(this);
      this.metricsContainer.innerHTML = result;
    } else {
      this.metricsContainer.innerHTML = '';
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
    
    this.showMetrics(this.metricsFunction);
  }

  runMultipleExamples(count) {
    let current = 0;
    const intervalId = setInterval(() => {
      this.render(this.buildShapesFn);
      current++;
      if (current >= count) {
        clearInterval(intervalId);
      }
    }, 100); // Run a new example every 100ms
  }

  static createNavigation() {
    const nav = document.createElement('div');
    nav.className = 'nav-container';
    
    const title = document.createElement('h1');
    title.textContent = 'All Tests';
    title.className = 'nav-title';
    nav.appendChild(title);
    
    RenderComparison.sections.forEach((section, index) => {
      if (index > 0) {
        nav.appendChild(document.createTextNode(' - '));
      }
      
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = section.title;
      link.className = 'nav-link';
      nav.appendChild(link);
    });
    
    document.body.insertBefore(nav, document.body.firstChild);
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

function addRenderComparison(title, id, buildShapesFn, metricsFunction = null) {
  const comparison = new RenderComparison(id, title);
  comparison.metricsFunction = metricsFunction;
  comparison.render(buildShapesFn);
  return comparison;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  addRenderComparisons();

  // Create navigation after all sections are added
  RenderComparison.createNavigation();
});

function addRenderComparisons() {
  addCenteredRoundedRectComparison();
  addThinRoundedRectsComparison();
  addEverythingTogetherComparison();
}
function addEverythingTogetherComparison() {
  addRenderComparison(
    "All Shape Types Combined",
    'all-shapes',
    (shapes) => {
      buildScene(shapes);
    }
  );
}

function addThinRoundedRectsComparison() {
  addRenderComparison(
    "Multiple Thin-Stroke Rounded Rectangles",
    'thin-rounded-rects',
    (shapes) => {
      addThinStrokeRoundedRectangles(10, shapes);
    }
  );
}

function addCenteredRoundedRectComparison() {
  addRenderComparison(
    "Single Centered Rounded Rectangle",
    'centered-rounded-rect',
    (shapes) => {
      addCenteredRoundedRect(shapes);
    },
    (comparison) => {
      const swColorsMiddleRow = comparison.countUniqueColorsInMiddleRow(comparison.swCtx, 2);
      const canvasColorsMiddleRow = comparison.countUniqueColorsInMiddleRow(comparison.canvasCtx, 2);
      const swColorsMiddleColumn = comparison.countUniqueColorsInMiddleColumn(comparison.swCtx, 2);
      const canvasColorsMiddleColumn = comparison.countUniqueColorsInMiddleColumn(comparison.canvasCtx, 2);
      
      const row = `Unique colors in middle row: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`;
      const column = `Unique colors in middle column: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`;
      return row + '<br>' + column;
    }
  );
}

