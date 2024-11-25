class RenderComparison {
  static sections = [];

  constructor(id, title) {
    RenderComparison.sections.push({ id, title });
    
    this.id = id;
    this.flipState = true;
    this.shapes = [];
    
    // Create container with anchor
    this.container = document.createElement('div');
    this.container.style.marginBottom = '20px';
    this.container.id = id;
    
    // Add divider
    const divider = document.createElement('hr');
    divider.style.width = '100%';
    divider.style.margin = '30px 0 20px 0';
    this.container.appendChild(divider);
    
    // Add top link
    const topLink = document.createElement('div');
    topLink.style.textAlign = 'center';
    topLink.style.marginBottom = '10px';
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = '\u2191 top';  // Unicode escape for ↑
    link.style.color = '#666';
    link.style.textDecoration = 'none';
    link.style.fontSize = '14px';
    topLink.appendChild(link);
    this.container.appendChild(topLink);
    
    // Add title
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '20px';
    titleElement.style.fontFamily = 'sans-serif';
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
    
    // Add metrics container
    this.metricsContainer = document.createElement('div');
    this.metricsContainer.style.textAlign = 'center';
    this.metricsContainer.style.marginTop = '5px';
    this.metricsContainer.style.fontFamily = 'monospace';
    
    this.container.appendChild(this.metricsContainer);
    
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

  countUniqueColors(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const middleY = Math.floor(ctx.canvas.height / 2);
    const uniqueColors = new Set();
    
    // Scan middle row
    for(let x = 0; x < ctx.canvas.width; x++) {
      const i = (middleY * ctx.canvas.width + x) * 4;
      // Skip white pixels (255,255,255)
      if(data[i] === 255 && data[i+1] === 255 && data[i+2] === 255) continue;
      // Create color key
      const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
      uniqueColors.add(colorKey);
    }
    
    return uniqueColors.size;
  }

  showMetrics(metricsFunction) {
    if (metricsFunction) {
      const result = metricsFunction(this);
      this.metricsContainer.textContent = result;
    } else {
      this.metricsContainer.textContent = '';
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

  static createNavigation() {
    const nav = document.createElement('div');
    nav.style.textAlign = 'center';
    nav.style.padding = '10px';
    nav.style.whiteSpace = 'nowrap';
    
    RenderComparison.sections.forEach((section, index) => {
      if (index > 0) {
        nav.appendChild(document.createTextNode(' - '));
      }
      
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = section.title;
      link.style.color = '#0066cc';
      link.style.textDecoration = 'none';
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
  // Add centered rounded rect comparison
  addRenderComparison(
    "Single Centered Rounded Rectangle",
    'centered-rounded-rect', 
    (shapes) => {
      addCenteredRoundedRect(shapes);
    },
    (comparison) => {
      const swColors = comparison.countUniqueColors(comparison.swCtx);
      const canvasColors = comparison.countUniqueColors(comparison.canvasCtx);
      return `Unique colors in middle row: SW: ${swColors}, Canvas: ${canvasColors}`;
    }
  );
  
  // Add thin rounded rects comparison
  addRenderComparison(
    "Multiple Thin-Stroke Rounded Rectangles",
    'thin-rounded-rects', 
    (shapes) => {
      addThinStrokeRoundedRectangles(10, shapes);
    }
  );
  
  // Add main comparison with all shapes
  addRenderComparison(
    "All Shape Types Combined",
    'all-shapes', 
    (shapes) => {
      buildScene(shapes);
    }
  );

  // Create navigation after all sections are added
  RenderComparison.createNavigation();
});