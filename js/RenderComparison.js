const renderComparisonWidth = 600;
const renderComparisonHeight = 600;

class RenderComparison {
  static sections = [];
  static GRID_COLUMNS = 11;
  static GRID_ROWS = 21;

  constructor(id, title, buildShapesFn, metricsFunction = null, comparisonDescription = '') {
    this.width = renderComparisonWidth;
    this.height = renderComparisonHeight;
    this.frameBuffer = new Uint8ClampedArray(this.width * this.height * 4);

    RenderComparison.sections.push({ id, title });
    
    this.id = id;
    this.flipState = true;
    this.shapes = [];
    this.metricsFunction = metricsFunction;
    
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
    
    // Add description if provided
    if (comparisonDescription) {
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = comparisonDescription;
      descriptionElement.className = 'comparison-description';
      this.container.appendChild(descriptionElement);
    }
    
    // Create canvases
    this.swCanvas = this.createCanvas('sw');
    this.canvasCanvas = this.createCanvas('canvas');
    this.displayCanvas = this.createCanvas('display');
    
    // Add mouse event listeners for inspection
    this.swCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, this.swCanvas));
    this.canvasCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e, this.canvasCanvas));
    this.swCanvas.addEventListener('mouseout', () => this.handleMouseOut());
    this.canvasCanvas.addEventListener('mouseout', () => this.handleMouseOut());
    
    // Set cursor style
    this.swCanvas.style.cursor = 'crosshair';
    this.canvasCanvas.style.cursor = 'crosshair';
    
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
    runButton.onclick = () => this.render(buildShapesFn);
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
    
    // Add a container for the log
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'log-container';
    this.container.appendChild(this.logContainer);

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
    
    // Initialize RenderChecks
    this.renderChecks = new RenderChecks(this);

    // Render initial scene
    this.render(buildShapesFn);
  }

  createCanvas(name) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.className = 'comparison-canvas';
    canvas.title = `${this.id}-${name}`;
    return canvas;
  }

  clearFrameBuffer() {
    this.frameBuffer.fill(0);
  }

  updateSWRenderOutput() {
    const imageData = new ImageData(this.frameBuffer, this.width, this.height);
    this.swCtx.putImageData(imageData, 0, 0);
  }

  drawSceneCanvas() {
    this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtx.clearRect(0, 0, this.canvasCanvas.width, this.canvasCanvas.height);
    drawShapesImpl(this.shapes, true, this.canvasCtx);
  }

  drawSceneSW() {
    this.clearFrameBuffer();
    drawShapesImpl(this.shapes, false, null, this.frameBuffer);
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
    this.logContainer.innerHTML = '';
    // this returned value is used in the metrics/tests
    this.builderReturnValue = buildShapesFn(this.shapes, this.logContainer);
    
    this.drawSceneSW();
    this.updateSWRenderOutput();
    
    this.drawSceneCanvas();
    
    this.flipState = true;
    this.updateFlipOutput();
    
    this.showMetrics(this.metricsFunction);
  }

  runMultipleExamples(count) {
    let current = 0;
    const initialErrorCount = this.errorsContainer.children.length;
    const runFrame = () => {
      try {
        this.render(this.buildShapesFn);
        current++;
        // if there are no new errors, run the next example in the next frame
        if (current < count && this.errorsContainer.children.length === initialErrorCount) {
          requestAnimationFrame(runFrame);
        }
      } catch (error) {
        this.showError(`Error during multiple examples: ${error.message}`);
      }
    };
    requestAnimationFrame(runFrame);
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

  handleMouseMove(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    
    // Clear display canvas
    this.displayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);    

    // Get image data from both canvases at the same position
    const swImageData = this.swCtx.getImageData(
      Math.max(0, x - Math.floor(RenderComparison.GRID_COLUMNS/2)),
      Math.max(0, y - Math.floor(RenderComparison.GRID_ROWS/2)),
      RenderComparison.GRID_COLUMNS,
      RenderComparison.GRID_ROWS
    );

    const canvasImageData = this.canvasCtx.getImageData(
      Math.max(0, x - Math.floor(RenderComparison.GRID_COLUMNS/2)),
      Math.max(0, y - Math.floor(RenderComparison.GRID_ROWS/2)),
      RenderComparison.GRID_COLUMNS,
      RenderComparison.GRID_ROWS
    );

    // Calculate pixel size for the magnified view
    const pixelSize = Math.min(
      (this.displayCanvas.width / 2) / RenderComparison.GRID_COLUMNS,
      this.displayCanvas.height / RenderComparison.GRID_ROWS
    );

    // Function to draw magnified grid
    const drawMagnifiedGrid = (imageData, offsetX) => {
      // Calculate the actual coordinates of the top-left pixel in the source image
      const sourceX = x - Math.floor(RenderComparison.GRID_COLUMNS/2);
      const sourceY = y - Math.floor(RenderComparison.GRID_ROWS/2);
      
      // Calculate where to start reading from the imageData
      const readOffsetX = Math.max(0, -sourceX);
      const readOffsetY = Math.max(0, -sourceY);
      
      for (let py = 0; py < RenderComparison.GRID_ROWS; py++) {
        for (let px = 0; px < RenderComparison.GRID_COLUMNS; px++) {
          // Calculate actual source coordinates for this pixel
          const actualX = sourceX + px;
          const actualY = sourceY + py;
          
          // Check if the pixel is within canvas bounds
          const isOutOfBounds = actualX < 0 || actualY < 0 || 
                               actualX >= canvas.width || actualY >= canvas.height;

          if (isOutOfBounds) {
            // Draw grey pixel for out of bounds
            this.displayCtx.fillStyle = 'rgb(128,128,128)';
          } else {
            // Calculate correct index in the imageData
            const dataX = px - readOffsetX;
            const dataY = py - readOffsetY;
            const i = (dataY * RenderComparison.GRID_COLUMNS + dataX) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            this.displayCtx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
          }

          this.displayCtx.fillRect(
            offsetX + px * pixelSize,
            py * pixelSize,
            pixelSize,
            pixelSize
          );

          // Draw grid lines
          this.displayCtx.strokeStyle = 'rgba(128,128,128,0.5)';
          this.displayCtx.strokeRect(
            offsetX + px * pixelSize,
            py * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }

      // Draw crosshair
      this.displayCtx.strokeStyle = 'red';
      this.displayCtx.lineWidth = 2;
      
      // Vertical line
      this.displayCtx.beginPath();
      this.displayCtx.moveTo(offsetX + (RenderComparison.GRID_COLUMNS/2) * pixelSize, 0);
      this.displayCtx.lineTo(offsetX + (RenderComparison.GRID_COLUMNS/2) * pixelSize, RenderComparison.GRID_ROWS * pixelSize);
      this.displayCtx.stroke();
      
      // Horizontal line
      this.displayCtx.beginPath();
      this.displayCtx.moveTo(offsetX, (RenderComparison.GRID_ROWS/2) * pixelSize);
      this.displayCtx.lineTo(offsetX + RenderComparison.GRID_COLUMNS * pixelSize, (RenderComparison.GRID_ROWS/2) * pixelSize);
      this.displayCtx.stroke();
    };

    // Draw left side (SW renderer)
    drawMagnifiedGrid(swImageData, 0);

    // Draw right side (Canvas renderer)
    drawMagnifiedGrid(canvasImageData, this.displayCanvas.width / 2);

    // Draw separator line
    this.displayCtx.strokeStyle = 'rgba(128,128,128,0.8)';
    this.displayCtx.lineWidth = 6;
    this.displayCtx.beginPath();
    this.displayCtx.moveTo(this.displayCanvas.width / 2, 0);
    this.displayCtx.lineTo(this.displayCanvas.width / 2, this.displayCanvas.height);
    this.displayCtx.stroke();

    // Add white highlights on the sides of the separator
    this.displayCtx.strokeStyle = 'rgba(255,255,255,0.5)';
    this.displayCtx.lineWidth = 2;
    
    // Left highlight
    this.displayCtx.beginPath();
    this.displayCtx.moveTo(this.displayCanvas.width / 2 - 3, 0);
    this.displayCtx.lineTo(this.displayCanvas.width / 2 - 3, this.displayCanvas.height);
    this.displayCtx.stroke();
    
    // Right highlight
    this.displayCtx.beginPath();
    this.displayCtx.moveTo(this.displayCanvas.width / 2 + 3, 0);
    this.displayCtx.lineTo(this.displayCanvas.width / 2 + 3, this.displayCanvas.height);
    this.displayCtx.stroke();

    // Draw coordinates at top center
    this.displayCtx.font = '14px monospace';
    this.displayCtx.textAlign = 'center';
    this.displayCtx.textBaseline = 'top';
    const coordsText = `(${x}, ${y})`;
    this.displayCtx.fillStyle = 'black';
    this.displayCtx.fillText(coordsText, this.displayCanvas.width / 2, 25);
  }

  handleMouseOut() {
    // Restore normal display canvas view
    this.updateFlipOutput();
  }
}