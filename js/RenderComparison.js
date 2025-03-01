const renderComparisonWidth = 600;
const renderComparisonHeight = 600;

class RenderComparison {
  static sections = [];
  static GRID_COLUMNS = 11;
  static GRID_ROWS = 21;

  constructor(id, title, buildShapesFn, canvasCodeFn = null, metricsFunction = null, comparisonDescription = '') {
    this.width = renderComparisonWidth;
    this.height = renderComparisonHeight;
    this.frameBuffer = new Uint8ClampedArray(this.width * this.height * 4);

    RenderComparison.sections.push({ id, title });
    
    this.id = id;
    this.flipState = true;
    this.shapes = [];
    this.metricsFunction = metricsFunction;
    this.canvasCodeFn = canvasCodeFn;
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
    
    // Create wrapper divs and hash containers
    this.swWrapper = document.createElement('div');
    this.swWrapper.className = 'canvas-wrapper';
    this.canvasWrapper = document.createElement('div');
    this.canvasWrapper.className = 'canvas-wrapper';
    this.displayWrapper = document.createElement('div');
    this.displayWrapper.className = 'canvas-wrapper';
    
    // Create hash containers
    this.swHashContainer = document.createElement('div');
    this.swHashContainer.className = 'hash-container';
    
    this.canvasHashContainer = document.createElement('div');
    this.canvasHashContainer.className = 'hash-container';
    
    // Add canvases and hashes to their wrappers
    this.swWrapper.appendChild(this.swCanvas);
    this.swWrapper.appendChild(this.swHashContainer);
    
    this.canvasWrapper.appendChild(this.canvasCanvas);
    this.canvasWrapper.appendChild(this.canvasHashContainer);
    
    this.displayWrapper.appendChild(this.displayCanvas);
    
    // Add wrappers to container
    this.container.appendChild(this.swWrapper);
    this.container.appendChild(this.canvasWrapper);
    this.container.appendChild(this.displayWrapper);
    
    // Get contexts
    this.swCtx = this.swCanvas.getContext('2d');
    this.canvasCtx = this.canvasCanvas.getContext('2d');
    this.displayCtx = this.displayCanvas.getContext('2d');
    
    // Create outer container for counter and buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '20px';
    
    // Create counter container
    const counterContainer = document.createElement('div');
    
    // Add current example label
    const currentLabel = document.createElement('label');
    currentLabel.textContent = 'Current Example #1 | ';
    currentLabel.style.marginRight = '10px';
    this.currentLabel = currentLabel;  // Store reference to update it later
    counterContainer.appendChild(currentLabel);
    
    const counterLabel = document.createElement('label');
    counterLabel.textContent = 'Next example #: ';
    counterContainer.appendChild(counterLabel);
    
    this.exampleCounter = document.createElement('input');
    this.exampleCounter.type = 'text';
    this.exampleCounter.value = '1';
    this.exampleCounter.style.width = '70px';
    this.exampleCounter.style.marginLeft = '5px';
    counterContainer.appendChild(this.exampleCounter);
    
    controlsContainer.appendChild(counterContainer);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';
    
    // Add buttons to button container
    const runButton = document.createElement('button');
    runButton.textContent = '1 example';
    runButton.onclick = () => this.render(buildShapesFn, canvasCodeFn);
    runButton.className = 'action-button';
    
    // Add run 10 examples button
    const run10Button = document.createElement('button');
    run10Button.textContent = '10 examples';
    run10Button.onclick = () => this.runMultipleExamples(10);
    run10Button.className = 'action-button';

    // Add run 100 examples button
    const run100Button = document.createElement('button');
    run100Button.textContent = '100 examples';
    run100Button.onclick = () => this.runMultipleExamples(100);
    run100Button.className = 'action-button';

    // Add a button to collect defects on 1000 examples
    const run1000Button = document.createElement('button');
    run1000Button.textContent = 'Collect defects / 1k examples';
    run1000Button.onclick = () => this.runMultipleExamples(1000, false);
    run1000Button.className = 'action-button';

    // Add flip button last
    const flipButton = document.createElement('button');
    flipButton.textContent = 'Flip alternating view';
    flipButton.onclick = () => this.flip();
    flipButton.className = 'action-button';
    
    buttonContainer.appendChild(runButton);
    buttonContainer.appendChild(run10Button);
    buttonContainer.appendChild(run100Button);
    buttonContainer.appendChild(run1000Button);
    buttonContainer.appendChild(flipButton);
    controlsContainer.appendChild(buttonContainer);
    
    this.container.appendChild(controlsContainer);
    
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

    // Add CrispSwCanvas instance if we have a canvasCodeFn
    if (canvasCodeFn) {
        this.crispSwCanvas = new CrispSwCanvas(this.width, this.height);
        this.crispSwCtx = this.crispSwCanvas.getContext('2d');
    }

    // Add required CSS
    const style = document.createElement('style');
    style.textContent = `
      .canvas-wrapper {
        display: inline-block;
        vertical-align: top;
      }
      .hash-container {
        font-family: monospace;
        font-size: 12px;
        margin: -5px 0 10px 10px;
        color: #666;
        background: white;
        padding: 2px 5px;
        display: block;
        border-radius: 3px;
        width: fit-content;
      }
    `;
    document.head.appendChild(style);

    // Render initial scene
    this.render(buildShapesFn, canvasCodeFn);
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
    if (this.swCtx.getHashString) this.updateHashes();
  }

  drawSceneCanvas() {
    this.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtx.clearRect(0, 0, this.canvasCanvas.width, this.canvasCanvas.height);
    drawShapesImpl(this.shapes, true, this.canvasCtx);
    if (this.swCtx.getHashString) this.updateHashes();
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

    // Get the current example number from the label
    const currentExampleNum = this.currentLabel ? 
      this.currentLabel.textContent.match(/Current Example #(\d+)/) ?
      parseInt(this.currentLabel.textContent.match(/Current Example #(\d+)/)[1]) : 1 : 1;
    
    // Prefix the message with the example number
    const prefixedMessage = `Example #${currentExampleNum}: ${message}`;
    
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = prefixedMessage; // Using innerHTML to preserve HTML formatting
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

  updateHashes() {
    this.swHashContainer.textContent = `Hash: ${this.swCtx.getHashString()}`;
    this.canvasHashContainer.textContent = `Hash: ${this.canvasCtx.getHashString()}`;
  }

  render(buildShapesFn, canvasCodeFn = null) {
    // Update current example label to match the next example number
    const currentCount = parseInt(this.exampleCounter.value) || 1;
    this.currentLabel.textContent = `Current Example #${currentCount}`;
    
    // Increment counter for next example
    this.exampleCounter.value = (currentCount + 1).toString();
    
    this.buildShapesFn = buildShapesFn; // Store the function for later use
    this.shapes = [];
    this.logContainer.innerHTML = '';
    
    if (buildShapesFn) {
      // this returned value is used in the metrics/tests
      this.builderReturnValue = buildShapesFn(this.shapes, this.logContainer, currentCount);
      this.drawSceneSW();
      this.updateSWRenderOutput();
      this.drawSceneCanvas();
    }
    else if (canvasCodeFn) {
      // clear both canvases (to transparent black)
      this.canvasCtx.clearRect(0, 0, this.canvasCanvas.width, this.canvasCanvas.height);
      this.crispSwCtx.clearRect(0, 0, this.swCanvas.width, this.swCanvas.height);
      

      // For the software-rendered side, use CrispSwCanvas
      SeededRandom.seedWithInteger(currentCount);
      canvasCodeFn(this.crispSwCtx);
      // Blit the result to the SW canvas
      this.crispSwCtx.blitToCanvas(this.swCanvas);
      
      // For the canvas side, use regular canvas
      SeededRandom.seedWithInteger(currentCount);
      canvasCodeFn(this.canvasCtx);
      
      if (this.swCtx.getHashString) this.updateHashes();
    }
    
    this.flipState = true;
    this.updateFlipOutput();
    
    this.showMetrics(this.metricsFunction);
  }

  runMultipleExamples(count, stopAtError = true) {
    let current = 0;
    const initialErrorCount = this.errorsContainer.children.length;

    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.fontFamily = 'monospace';
    // Make all characters have the same width otherwise the grey and black blocks have different widths
    progressBar.style.whiteSpace = 'pre';
    // Insert before the current label
    this.currentLabel.parentNode.insertBefore(progressBar, this.currentLabel);

    const updateProgress = () => {
        const percent = Math.floor((current / count) * 100);
        const filledBoxes = Math.floor((current / count) * 10);
        const progressText = '\u2593'.repeat(filledBoxes) + '\u2591'.repeat(10 - filledBoxes);
        progressBar.textContent = `${progressText} ${percent}%`.padEnd(15);  // Ensure consistent width
    };

    const runFrame = () => {
        try {
            this.render(this.buildShapesFn, this.canvasCodeFn);
            current++;
            updateProgress();

            // Continue if under count and either not stopping at errors or no new errors
            if (current < count && (!stopAtError || this.errorsContainer.children.length === initialErrorCount)) {
                requestAnimationFrame(runFrame);
            } else {
                // Remove progress bar when done
                progressBar.remove();
            }
        } catch (error) {
            this.showError(`Error during multiple examples: ${error.message}`);
            // Remove progress bar on error if we're stopping
            if (stopAtError) {
                progressBar.remove();
            } else if (current < count) {
                // Continue if not stopping at errors
                requestAnimationFrame(runFrame);
            }
        }
    };
    requestAnimationFrame(runFrame);
  }

  static createNavigation(theTitle) {
    const nav = document.createElement('div');
    nav.className = 'nav-container';
    
    const title = document.createElement('h1');
    title.textContent = theTitle;
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

    // Add background control
    const backgroundControl = document.createElement('div');
    backgroundControl.style.marginTop = '10px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'showTransparencyPatternBackground';
    checkbox.checked = true; // default to transparent pattern background
    document.body.classList.add('transparency-pattern');
    
    const label = document.createElement('label');
    label.htmlFor = 'showTransparencyPatternBackground';
    label.textContent = 'Show transparency pattern';
    label.style.marginLeft = '5px';
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('transparency-pattern');
      } else {
        document.body.classList.remove('transparency-pattern');
      }
    });
    
    backgroundControl.appendChild(checkbox);
    backgroundControl.appendChild(label);
    nav.appendChild(backgroundControl);
    
    document.body.insertBefore(nav, document.body.firstChild);
    
    // Add required CSS
    const style = document.createElement('style');
    style.textContent = `
      body {
        background: white;
      }
      .transparency-pattern {
        background-image:
          linear-gradient(45deg, #eee 25%, transparent 25%),
          linear-gradient(-45deg, #eee 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #eee 75%),
          linear-gradient(-45deg, transparent 75%, #eee 75%);
        background-size: 20px 20px;
        background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
      }
    `;
    document.head.appendChild(style);
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
            this.displayCtx.fillStyle = colorToString(r, g, b, a);
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

      // Compute the local mouse coordinates within this grid.
      let localMouseX = Math.floor(RenderComparison.GRID_COLUMNS/2);
      let localMouseY = Math.floor(RenderComparison.GRID_ROWS/2);
      // Clamp to valid indices
      localMouseX = Math.min(Math.floor(localMouseX), RenderComparison.GRID_COLUMNS - 1);
      localMouseY = Math.min(Math.floor(localMouseY), RenderComparison.GRID_ROWS - 1);
      const idx = (localMouseY * RenderComparison.GRID_COLUMNS + localMouseX) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1]; 
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      const rgbaText = colorToString(r, g, b, a);

      // Draw color text below grid
      this.displayCtx.font = '12px monospace';
      this.displayCtx.textAlign = 'center';
      this.displayCtx.textBaseline = 'middle';
      const textX = offsetX + (RenderComparison.GRID_COLUMNS * pixelSize) / 2;
      const textY = (RenderComparison.GRID_ROWS) * pixelSize + pixelSize/2;
      this.displayCtx.fillStyle = 'black';
      this.displayCtx.fillText(rgbaText, textX, textY);
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