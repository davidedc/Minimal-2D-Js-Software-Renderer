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

    // this returned value is used in the metrics/tests
    this.builderReturnValue = buildShapesFn(this.shapes);
    
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

  checkPlacementOf4Sides(swCtx, canvasCtx, edges) {
    const results = [];
    const contexts = [
      { name: 'Software Renderer', ctx: swCtx },
      { name: 'Canvas', ctx: canvasCtx }
    ];
    
    for (const { name, ctx } of contexts) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Check horizontal middle line (for left and right edges)
      const middleY = Math.floor(height / 2);
      let actualLeftX = -1;
      let actualRightX = -1;
      
      // Scan from left to right for the first non-transparent pixel (left edge)
      for (let x = 0; x < width; x++) {
        const i = (middleY * width + x) * 4;
        if (data[i + 3] > 0) {
          actualLeftX = x;
          break;
        }
      }
      
      // Scan from right to left for the first non-transparent pixel (right edge)
      for (let x = width - 1; x >= 0; x--) {
        const i = (middleY * width + x) * 4;
        if (data[i + 3] > 0) {
          actualRightX = x;
          break;
        }
      }
      
      // Check vertical middle line (for top and bottom edges)
      const middleX = Math.floor(width / 2);
      let actualTopY = -1;
      let actualBottomY = -1;
      
      // Scan from top to bottom for the first non-transparent pixel (top edge)
      for (let y = 0; y < height; y++) {
        const i = (y * width + middleX) * 4;
        if (data[i + 3] > 0) {
          actualTopY = y;
          break;
        }
      }
      
      // Scan from bottom to top for the first non-transparent pixel (bottom edge)
      for (let y = height - 1; y >= 0; y--) {
        const i = (y * width + middleX) * 4;
        if (data[i + 3] > 0) {
          actualBottomY = y;
          break;
        }
      }
      
      // Debug info
      console.log(`${name} found edges:`, {
        actualLeftX,
        actualRightX,
        actualTopY,
        actualBottomY
      });
      console.log('Expected edges:', edges);
      
      // Compare with expected positions
      const edgeResults = [];
      if (actualLeftX !== edges.leftX) {
        const message = `Left edge expected at ${edges.leftX}, found at ${actualLeftX}`;
        edgeResults.push(message);
        this.showError(message);
      }
      if (actualRightX !== edges.rightX) {
        const message = `Right edge expected at ${edges.rightX}, found at ${actualRightX}`;
        edgeResults.push(message);
        this.showError(message);
      }
      if (actualTopY !== edges.topY) {
        const message = `Top edge expected at ${edges.topY}, found at ${actualTopY}`;
        edgeResults.push(message);
        this.showError(message);
      }
      if (actualBottomY !== edges.bottomY) {
        const message = `Bottom edge expected at ${edges.bottomY}, found at ${actualBottomY}`;
        edgeResults.push(message);
        this.showError(message);
      }
      else {
        results.push(`${name} results:${
          edgeResults.length === 0 
            ? ' All edges correctly placed!'
            : '\n- ' + edgeResults.join('\n- ')
        }`);
      }
    }
    
    return results.join('\n\n');
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
  add1PxStrokedRoundedRectCenteredAtGridComparison();
  add1PxStrokedRoundedRectCenteredAtPixelComparison();
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

function add1PxStrokedRoundedRectCenteredAtGridComparison() {
  addRenderComparison(
      "Single 1px Stroked Rounded Rectangle centered at grid",
      'centered-1px-rounded-rect',
      (shapes) => {
          const edges = add1PxStrokedRoundedRectCenteredAtGrid(shapes);
          return edges;  // This will now be stored in this.builderReturnValue
      },
      (comparison) => {
          const edges = comparison.builderReturnValue;
          if (!edges) return "No edges data available";
          
          const result = comparison.checkPlacementOf4Sides(
              comparison.swCtx,
              comparison.canvasCtx,
              edges
          );
          
          return result;
      }
  );
}

function add1PxStrokedRoundedRectCenteredAtGrid(shapes) {
  // Define rectangle dimensions as random integers between 20 and 150
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  // if width and height are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
  
  // We place the rectangle in the very middle of the grid.
  // In theory only even rectangle widths and heights work neatly, but actually the
  // drawing routines use getCornerBasedRepresentation and getCrispStrokeGeometry to fix the
  // other cases (with snapping to the top left where needed).
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  // Calculate edges
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth - 1;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight - 1;
  
  // Add the rounded rectangle to shapes
  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    // radius between 0 and 20% of the smallest dimension
    radius: Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }  // Transparent fill
  });
  
  // Return the edge positions
  return { leftX, rightX, topY, bottomY };
}

function add1PxStrokedRoundedRectCenteredAtPixelComparison() {
  addRenderComparison(
      "Single 1px Stroked Rounded Rectangle centered at pixel",
      'centered-1px-rounded-rect',
      (shapes) => {
          const edges = add1PxStrokedRoundedRectCenteredAtPixel(shapes);
          return edges;  // This will now be stored in this.builderReturnValue
      },
      (comparison) => {
          const edges = comparison.builderReturnValue;
          if (!edges) return "No edges data available";
          
          const result = comparison.checkPlacementOf4Sides(
              comparison.swCtx,
              comparison.canvasCtx,
              edges
          );
          
          return result;
      }
  );
}

function add1PxStrokedRoundedRectCenteredAtPixel(shapes) {
  // Define rectangle dimensions as random integers between 20 and 150
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  // if width and height are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
  
  // We center the rectangle in the middle of a pixel near the center of the canvas.
  // The canvas is even in both dimensions, so there isn't a perfect center pixel, we
  // choose the one to the left and top of the center, and we place the rectangle
  // in the middle of it
  // In theory only odd rectangle widths and heights work neatly, but actually the
  // drawing routines use getCornerBasedRepresentation and getCrispStrokeGeometry to fix the
  // other cases (with snapping to the top left where needed).
  const centerX = Math.floor(width / 2) + 0.5;
  const centerY = Math.floor(height / 2) + 0.5;
  
  // Calculate edges
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth - 1;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight - 1;
  
  // Add the rounded rectangle to shapes
  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    // radius between 0 and 20% of the smallest dimension
    radius: Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }  // Transparent fill
  });
  
  // Return the edge positions
  return { leftX, rightX, topY, bottomY };
}