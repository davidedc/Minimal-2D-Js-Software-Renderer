const renderTestWidth = 600;
const renderTestHeight = 600;

class RenderTest {
  static sections = [];
  static GRID_COLUMNS = 11;
  static GRID_ROWS = 21;
  static registry = {}; // Central registry for all tests

  constructor(id, title, buildShapesFn, canvasCodeFn = null, functionToRunAllChecks = null, testDescription = '') {
    // Environment detection
    this.isNode = typeof window === 'undefined';
    
    // Common initialization - works in both environments
    this.width = renderTestWidth;
    this.height = renderTestHeight;

    // Create the frameeBuffer and two views for it
    this.frameBufferUint8ClampedView = new Uint8ClampedArray(this.width * this.height * 4);
    // this view show optimise for when we deal with pixel values all together rather than r,g,b,a separately
    this.frameBufferUint32View = new Uint32Array(this.frameBufferUint8ClampedView.buffer);

    this.errorCount = 0; // Initialize error count
    this.errors = []; // Track error messages
    this.verbose = false; // Verbose logging flag for Node.js
    
    this.id = id;
    this.title = title;
    this.shapes = [];
    this.functionToRunAllChecks = functionToRunAllChecks;
    this.canvasCodeFn = canvasCodeFn;
    this.buildShapesFn = buildShapesFn;
    
    // Auto-register this test
    RenderTest.registry[id] = this;

    if (this.isNode) {
      // Node.js initialization path
      this.setupForNode();
    } else {
      // Browser initialization path
      this.setupForBrowser(id, title, buildShapesFn, canvasCodeFn, testDescription);
      // Only add to sections in browser environment
      RenderTest.sections.push({ id, title });
    }

    // Initialize RenderChecks in both environments
    this.renderChecks = new RenderChecks(this);

    // If we're not in a Node environment, render the initial scene
    if (!this.isNode) {
      this.render(buildShapesFn, canvasCodeFn);
    }
  }

  setupForNode() {
    // Create a mock canvas object for the SW renderer
    this.canvasOfSwRender = {
      width: this.width,
      height: this.height,
      title: `${this.id}-sw`,
    };
    
    // Set up CrispSwContext for Node
    if (this.canvasCodeFn) {
      this.crispSwCanvas = new CrispSwCanvas(this.width, this.height);
      this.crispSwCtx = this.crispSwCanvas.getContext('2d');
      this.canvasCtxOfSwRender = this.crispSwCtx;
    } else {
      // Create a properly extended mock context for Node.js that supports all checks
      this.canvasCtxOfSwRender = {
        canvas: this.canvasOfSwRender, // Important for checks that use canvas.width/height
        getImageData: (x, y, width, height) => {
          return new ImageData(this.frameBufferUint8ClampedView, this.width, this.height);
        }
      };
    }
    
    // Set up flipState as a no-op for Node
    this.flipState = true;
  };

  setupForBrowser(id, title, buildShapesFn, canvasCodeFn, testDescription) {
    this.flipState = true;
    
    // Helper function to create centered labels
    const createLabel = (text) => {
      const label = document.createElement('div');
      label.textContent = text;
      label.className = 'canvas-label';
      return label;
    };

    // Create container with anchor
    this.container = document.createElement('div');
    this.container.className = 'test-container';
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
    titleElement.className = 'test-title';
    this.container.appendChild(titleElement);
    
    // Add description if provided
    if (testDescription) {
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = testDescription;
      descriptionElement.className = 'test-description';
      this.container.appendChild(descriptionElement);
    }
    
    // Create canvases
    this.canvasOfSwRender = this.createCanvas('sw');
    this.canvasOfCanvasRender = this.createCanvas('canvas');
    this.canvasOfComparison = this.createCanvas('display');
    
    // Add mouse event listeners for inspection
    this.canvasOfSwRender.addEventListener('mousemove', (e) => this.handleMouseMove(e, this.canvasOfSwRender));
    this.canvasOfCanvasRender.addEventListener('mousemove', (e) => this.handleMouseMove(e, this.canvasOfCanvasRender));
    this.canvasOfSwRender.addEventListener('mouseout', () => this.handleMouseOut());
    this.canvasOfCanvasRender.addEventListener('mouseout', () => this.handleMouseOut());
    
    // Set cursor style
    this.canvasOfSwRender.style.cursor = 'crosshair';
    this.canvasOfCanvasRender.style.cursor = 'crosshair';
    
    // Create wrapper divs and hash containers
    this.swWrapper = document.createElement('div');
    this.swWrapper.className = 'canvas-wrapper';
    this.canvasWrapper = document.createElement('div');
    this.canvasWrapper.className = 'canvas-wrapper';
    this.displayWrapper = document.createElement('div');
    this.displayWrapper.className = 'canvas-wrapper';
    
    // Create labels
    this.swLabel = createLabel('Software Renderer');
    this.canvasLabel = createLabel('HTML5 Canvas');

    // Create label containers for the display canvas
    this.displayLabelContainer = document.createElement('div');
    this.displayLabelContainer.className = 'display-label-container';

    // Label for alternating view
    this.displayAltLabel = createLabel('Alternating View (SW)'); // Initial state
    this.displayLabelContainer.appendChild(this.displayAltLabel);

    // Container and labels for magnifier view
    this.displayMagContainer = document.createElement('div');
    this.displayMagContainer.className = 'magnifier-label-container';
    this.displayMagContainer.style.display = 'none'; // Initially hidden

    this.displayMagSwLabel = createLabel('Magnified SW');
    this.displayMagCanvasLabel = createLabel('Magnified Canvas');
    this.displayMagContainer.appendChild(this.displayMagSwLabel);
    this.displayMagContainer.appendChild(this.displayMagCanvasLabel);

    this.displayLabelContainer.appendChild(this.displayMagContainer);

    // Create hash containers
    this.swHashContainer = document.createElement('div');
    this.swHashContainer.className = 'hash-container';
    
    this.canvasHashContainer = document.createElement('div');
    this.canvasHashContainer.className = 'hash-container';
    
    // Add canvases and hashes to their wrappers
    this.swWrapper.appendChild(this.swLabel); // Add SW label
    this.swWrapper.appendChild(this.canvasOfSwRender);
    this.swWrapper.appendChild(this.swHashContainer);
    
    this.canvasWrapper.appendChild(this.canvasLabel); // Add Canvas label
    this.canvasWrapper.appendChild(this.canvasOfCanvasRender);
    this.canvasWrapper.appendChild(this.canvasHashContainer);
    
    this.displayWrapper.appendChild(this.displayLabelContainer); // Add display label container
    this.displayWrapper.appendChild(this.canvasOfComparison);
    
    // Add wrappers to container
    this.container.appendChild(this.swWrapper);
    this.container.appendChild(this.canvasWrapper);
    this.container.appendChild(this.displayWrapper);
    
    // Get contexts
    this.canvasCtxOfSwRender = this.canvasOfSwRender.getContext('2d');
    this.canvasCtxOfCanvasRender = this.canvasOfCanvasRender.getContext('2d');
    this.canvasCtxOfComparison = this.canvasOfComparison.getContext('2d');
    
    // Create outer container for counter and buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.gap = '20px';
    
    // Create counter container
    const counterContainer = document.createElement('div');
    
    // Add current iteration label
    const currentLabel = document.createElement('label');
    currentLabel.textContent = 'Current Iteration #1 | ';
    currentLabel.style.marginRight = '10px';
    this.currentLabel = currentLabel;  // Store reference to update it later
    counterContainer.appendChild(currentLabel);
    
    const counterLabel = document.createElement('label');
    counterLabel.textContent = 'Next iteration #: ';
    counterContainer.appendChild(counterLabel);
    
    this.iterationCounter = document.createElement('input');
    this.iterationCounter.type = 'text';
    this.iterationCounter.value = '1';
    this.iterationCounter.style.width = '70px';
    this.iterationCounter.style.marginLeft = '5px';
    counterContainer.appendChild(this.iterationCounter);
    
    controlsContainer.appendChild(counterContainer);
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '10px';
    
    // Add buttons to button container
    const runButton = document.createElement('button');
    runButton.textContent = '1 iteration';
    runButton.onclick = () => this.render(buildShapesFn, canvasCodeFn);
    runButton.className = 'action-button';
    
    // Add run 10 iterations button
    const run10Button = document.createElement('button');
    run10Button.textContent = '10 iterations';
    run10Button.onclick = () => this.runMultipleIterations(10);
    run10Button.className = 'action-button';

    // Add run 100 iterations button
    const run100Button = document.createElement('button');
    run100Button.textContent = '100 iterations';
    run100Button.onclick = () => this.runMultipleIterations(100);
    run100Button.className = 'action-button';

    // Add a button to collect defects on 1000 iterations
    const run1000Button = document.createElement('button');
    run1000Button.textContent = 'Collect defects / 1k iterations';
    run1000Button.onclick = () => this.runMultipleIterations(1000, false);
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

    // Add checks container
    this.checksContainer = document.createElement('div');
    this.checksContainer.className = 'checks-container';
    this.container.appendChild(this.checksContainer);
    
    // Add errors container
    this.errorsContainer = document.createElement('div');
    this.errorsContainer.className = 'errors-container';
    this.errorsContainer.style.color = 'red';
    this.container.appendChild(this.errorsContainer);
    
    document.body.appendChild(this.container);

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
        text-align: center; /* Center content */
        margin-right: 10px; /* Add some space between wrappers */
      }
      .canvas-label {
        font-size: 12px;
        color: #555;
        margin-bottom: 3px;
        font-weight: bold;
      }
      .display-label-container {
        height: 18px; /* Allocate space for the label */
        margin-bottom: 3px;
      }
       .magnifier-label-container {
        display: flex; /* Use flexbox for side-by-side labels */
        justify-content: space-around; /* Distribute space */
        width: 100%;
      }
      .magnifier-label-container .canvas-label {
         flex-basis: 50%; /* Each label takes half the width */
         text-align: center;
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
  }

  createCanvas(name) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.className = 'test-canvas';
    canvas.title = `${this.id}-${name}`;
    return canvas;
  }

  clearFrameBuffer() {
    this.frameBufferUint8ClampedView.fill(0);
  }

  updateSWRenderOutput() {
    const imageData = new ImageData(this.frameBufferUint8ClampedView, this.width, this.height);
    this.canvasCtxOfSwRender.putImageData(imageData, 0, 0);
    if (this.canvasCtxOfSwRender.getHashString) this.updateHashes();
  }

  drawSceneCanvas() {
    this.canvasCtxOfCanvasRender.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtxOfCanvasRender.clearRect(0, 0, this.canvasOfCanvasRender.width, this.canvasOfCanvasRender.height);
    drawShapesImpl(this.shapes, true, this.canvasCtxOfCanvasRender);
    if (this.canvasCtxOfSwRender.getHashString) this.updateHashes();
  }

  drawSceneSW() {
    this.clearFrameBuffer();
    drawShapesImpl(this.shapes, false, null, this.frameBufferUint8ClampedView, this.frameBufferUint32View);
  }

  flip() {
    this.flipState = !this.flipState;
    this.updateFlipOutput();
  }

  updateFlipOutput() {
    this.canvasCtxOfComparison.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtxOfComparison.clearRect(0, 0, this.canvasOfComparison.width, this.canvasOfComparison.height);
    
    if (this.flipState) {
      this.canvasCtxOfComparison.drawImage(this.canvasOfSwRender, 0, 0);
      this.displayAltLabel.textContent = 'Alternating View (SW)'; // Update label text
    } else {
      this.canvasCtxOfComparison.drawImage(this.canvasOfCanvasRender, 0, 0);
      this.displayAltLabel.textContent = 'Alternating View (Canvas)'; // Update label text
    }

    // Ensure correct label visibility for alternating view
    this.displayAltLabel.style.display = 'block';
    this.displayMagContainer.style.display = 'none';
  }

  showError(message) {
    // Common error tracking used in both environments
    if (this.errorCount === undefined) {
      this.errorCount = 0;
    }
    this.errorCount++;
    
    if (!this.errors) {
      this.errors = [];
    }
    this.errors.push(message);
    
    // In Node environment, only log the error if verbose
    if (this.isNode) {
      if (this.verbose) {
        console.error(`ERROR: ${message}`);
      }
      return;
    }
    
    // Browser-specific UI handling
    this.showErrorInBrowser(message);
  }
  
  // Separated browser-specific UI handling into its own method
  showErrorInBrowser(message) {
    // Create and add clear errors button and error count display if not already present
    if (!this.clearErrorsButton) {
      // Create error count element
      this.errorCountDisplay = document.createElement('div');
      this.errorCountDisplay.className = 'error-count';
      this.errorCountDisplay.style.fontWeight = 'bold';
      this.errorCountDisplay.style.marginTop = '10px';
      this.errorCountDisplay.style.marginBottom = '5px';
      this.updateErrorCountDisplay();
      
      // Create clear button
      this.clearErrorsButton = document.createElement('button');
      this.clearErrorsButton.textContent = 'Clear Errors';
      this.clearErrorsButton.className = 'action-button';
      this.clearErrorsButton.onclick = () => this.clearErrors();
      
      // Add elements to container
      this.errorsContainer.appendChild(document.createElement('br'));
      this.errorsContainer.appendChild(this.errorCountDisplay);
      this.errorsContainer.appendChild(this.clearErrorsButton);
    } else {
      // Update the error count display
      this.updateErrorCountDisplay();
    }

    // Get the current iteration number from the label
    const currentIterationNum = this.currentLabel ? 
      this.currentLabel.textContent.match(/Current Iteration #(\d+)/) ?
      parseInt(this.currentLabel.textContent.match(/Current Iteration #(\d+)/)[1]) : 1 : 1;
    
    // Prefix the message with the iteration number
    const prefixedMessage = `Iteration #${currentIterationNum}: ${message}`;
    
    const errorMessage = document.createElement('div');
    errorMessage.innerHTML = prefixedMessage; // Using innerHTML to preserve HTML formatting
    errorMessage.className = 'error-message';
    errorMessage.dataset.iterationNum = currentIterationNum;
    
    // Insert at the appropriate position - either after the last error from this iteration
    // or at the top of the errors container
    this.errorsContainer.insertBefore(errorMessage, this.errorCountDisplay);
    
    // Save this as the first error for this iteration if it's the first
    if (!this.firstErrorOfCurrentIteration) {
      this.firstErrorOfCurrentIteration = errorMessage;
    }
  }

  updateErrorCountDisplay() {
    if (this.errorCountDisplay) {
      this.errorCountDisplay.textContent = `Error count: ${this.errorCount}`;
    }
  }
  
  logSceneContents() {
    console.log("Attempting to log scene contents");
    
    // Mark that we've logged scene contents for this iteration
    this.sceneLoggedForCurrentIteration = true;
    
    try {
      if (this.shapes && this.shapes.length > 0) {
        // Log to console for debugging
        console.log("Scene contents when errors occurred:", JSON.stringify(this.shapes, null, 2));
        
        // Get the current iteration number
        const currentIterationNum = this.currentLabel ? 
          this.currentLabel.textContent.match(/Current Iteration #(\d+)/) ?
          parseInt(this.currentLabel.textContent.match(/Current Iteration #(\d+)/)[1]) : 1 : 1;
        
        // Create an easy-to-read scene content message
        let sceneMessage = `Scene Contents for Iteration #${currentIterationNum}:`;
        
        // Format the shape data in a more readable way
        this.shapes.forEach((shape, index) => {
          sceneMessage += `\n\n--- Shape ${index} ---\n`;
          
          // Handle different shape types with specific formatting
          if (shape.type === 'circle') {
            sceneMessage += `Type: Circle\n`;
            sceneMessage += `Center: (${shape.center.x}, ${shape.center.y})\n`;
            sceneMessage += `Radius: ${shape.radius}\n`;
            
            if (shape.strokeWidth) {
              sceneMessage += `Stroke Width: ${shape.strokeWidth}\n`;
              sceneMessage += `Stroke Color: rgba(${shape.strokeColor.r}, ${shape.strokeColor.g}, ${shape.strokeColor.b}, ${shape.strokeColor.a})\n`;
            }
            
            sceneMessage += `Fill Color: rgba(${shape.fillColor.r}, ${shape.fillColor.g}, ${shape.fillColor.b}, ${shape.fillColor.a})`;
          } else {
            // For other shape types, use more compact JSON formatting
            const formattedShape = JSON.stringify(shape, null, 2)
              .replace(/"([^"]+)":/g, '$1:') // Remove quotes around property names
              .replace(/[{},]/g, ''); // Remove braces and commas
            
            sceneMessage += formattedShape;
          }
        });
        
        // Create a visually distinct scene contents container
        const sceneContentDiv = document.createElement('div');
        sceneContentDiv.style.color = '#0066cc';
        sceneContentDiv.style.whiteSpace = 'pre-wrap';
        sceneContentDiv.style.fontFamily = 'monospace';
        sceneContentDiv.style.border = '1px solid #0066cc';
        sceneContentDiv.style.borderRadius = '4px';
        sceneContentDiv.style.backgroundColor = '#f0f8ff';
        sceneContentDiv.style.padding = '10px';
        sceneContentDiv.style.margin = '15px 0';
        sceneContentDiv.textContent = sceneMessage;
        
        // Add a scene contents label
        const contentLabel = document.createElement('div');
        contentLabel.style.fontWeight = 'bold';
        contentLabel.style.marginBottom = '5px';
        contentLabel.style.borderBottom = '1px solid #0066cc';
        contentLabel.style.paddingBottom = '3px';
        contentLabel.textContent = "SCENE CONTENTS:";
        sceneContentDiv.insertBefore(contentLabel, sceneContentDiv.firstChild);
        
        console.log("Created scene content div, about to insert into DOM");
        
        // If we have an error for this iteration, insert after it
        if (this.firstErrorOfCurrentIteration) {
          console.log("Found first error of iteration, inserting scene after it");
          
          // Find all error messages for this iteration
          const iterationNum = this.firstErrorOfCurrentIteration.dataset.iterationNum;
          let lastErrorForIteration = this.firstErrorOfCurrentIteration;
          
          // Find the last error with the same iteration number
          const errors = this.errorsContainer.querySelectorAll('.error-message');
          for (let i = 0; i < errors.length; i++) {
            if (errors[i].dataset.iterationNum === iterationNum) {
              lastErrorForIteration = errors[i];
            }
          }
          
          // Insert the scene contents after the last error for this iteration
          if (lastErrorForIteration.nextSibling) {
            this.errorsContainer.insertBefore(sceneContentDiv, lastErrorForIteration.nextSibling);
          } else {
            this.errorsContainer.appendChild(sceneContentDiv);
          }
        } else {
          // Fallback: Insert at the top of the errors container
          this.errorsContainer.insertBefore(sceneContentDiv, this.errorsContainer.firstChild);
        }
        
        console.log("Scene content added to DOM");
      } else {
        console.warn("Cannot log scene contents: no shapes found", this.shapes);
      }
    } catch (err) {
      console.error("Error while logging scene contents:", err);
    }
  }

  clearErrors() {
    // Reset error count
    this.errorCount = 0;
    
    // Clear the error container
    this.errorsContainer.innerHTML = '';
    
    // Clear references to the UI elements
    this.errorCountDisplay = null;
    this.clearErrorsButton = null;
    
    // Clear the errors array too
    this.errors = [];
  }

  showChecks(functionToRunAllChecks) {
    // Common path - if no checks, clear container in browser mode
    if (!functionToRunAllChecks) {
      if (!this.isNode && this.checksContainer) {
        this.checksContainer.innerHTML = '';
      }
      return;
    }
    
    // Common calculation of checks result
    const result = functionToRunAllChecks(this);
    
    this.showChecksInBrowser(result);
    return result;
  }
  
  // Browser-specific checks display
  showChecksInBrowser(checksResult) {
    if (this.checksContainer) {
      this.checksContainer.innerHTML = checksResult;
    }
  }

  updateHashes() {
    this.swHashContainer.textContent = `Hash: ${this.canvasCtxOfSwRender.getHashString()}`;
    this.canvasHashContainer.textContent = `Hash: ${this.canvasCtxOfCanvasRender.getHashString()}`;
  }

  render(buildShapesFn, canvasCodeFn = null, iterationNumber = null) {
    // Initialize shapes array
    this.shapes = [];
    
    // Call the appropriate environment-specific render method
    if (this.isNode) {
      // For Node environment, reset error tracking (since it's a single run)
      this.errorCount = 0;
      this.errors = [];
      
      // Node.js specific rendering path
      return this.renderInNode(buildShapesFn, canvasCodeFn, iterationNumber);
    } else {
      // Browser specific rendering path
      return this.renderInBrowser(buildShapesFn, canvasCodeFn);
    }
  }

  // Node.js specific rendering implementation
  renderInNode(buildShapesFn, canvasCodeFn = null, iterationNumber = null) {
    // Use the provided iteration number or default to 1
    const currentCount = iterationNumber || 1;
    
    if (buildShapesFn) {
      // Mock log container for Node
      const nodeLogContainer = {
        innerHTML: '',
        appendChild: (text) => {
          if (this.verbose) console.log(text);
        }
      };
      
      // Execute the shape builder
      this.builderReturnValue = buildShapesFn(this.shapes, nodeLogContainer, currentCount);
      this.drawSceneSW();
    }
    else if (canvasCodeFn) {
      // Clear the canvas (to transparent black)
      this.crispSwCtx.clearRect(0, 0, this.canvasOfSwRender.width, this.canvasOfSwRender.height);
      
      // Use CrispSwCanvas for the software-rendered output
      SeededRandom.seedWithInteger(currentCount);
      canvasCodeFn(this.crispSwCtx);
    }
    
    // Run checks if available
    if (this.functionToRunAllChecks) {
      const results = this.functionToRunAllChecks(this);
      if (this.verbose) {
        console.log('Checks Results:');
        console.log(results);
      }
    }
    
    // Return success/failure status based on error count
    return this.errorCount === 0;
  }
  
  // Export BMP image for Node.js
  exportBMP(outputDir, iterationNum) {
    if (!this.isNode) return;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Get image data
      if (this.canvasCtxOfSwRender && this.canvasCtxOfSwRender.getImageData) {
        const imageData = this.canvasCtxOfSwRender.getImageData(0, 0, this.width, this.height);
        
        // Use the toBMP method to generate the BMP data
        const bmpData = imageData.toBMP();
        
        // Create directory if needed
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save the file
        const filename = `${this.id}-iteration${iterationNum}.bmp`;
        const filepath = path.join(outputDir, filename);
        fs.writeFileSync(filepath, bmpData);
        
        if (this.verbose) {
          console.log(`Saved BMP image to ${filepath}`);
        }
        
        return filepath;
      }
    } catch (err) {
      console.error('Error exporting BMP:', err);
    }
    
    return null;
  }

  // Browser specific rendering implementation
  renderInBrowser(buildShapesFn, canvasCodeFn = null) {
    // Update current iteration label to match the next iteration number
    const currentCount = parseInt(this.iterationCounter.value) || 1;
    this.currentLabel.textContent = `Current Iteration #${currentCount}`;
    
    // Increment counter for next iteration
    this.iterationCounter.value = (currentCount + 1).toString();
    
    this.buildShapesFn = buildShapesFn; // Store the function for later use
    this.logContainer.innerHTML = '';
    
    // Track initial error count before rendering
    const initialErrorCount = this.errorCount || 0;
    
    // Reset UI error tracking for this iteration
    this.firstErrorOfCurrentIteration = null;
    this.lastErrorOfCurrentIteration = null;
    
    // Create a flag to track if we need to log scene contents
    this.sceneLoggedForCurrentIteration = false;
    
    if (buildShapesFn) {
      // this returned value is used in the checks/tests
      this.builderReturnValue = buildShapesFn(this.shapes, this.logContainer, currentCount);
      this.drawSceneSW();
      this.updateSWRenderOutput();
      this.drawSceneCanvas();
    }
    else if (canvasCodeFn) {
      // clear both canvases (to transparent black)
      this.canvasCtxOfCanvasRender.clearRect(0, 0, this.canvasOfCanvasRender.width, this.canvasOfCanvasRender.height);
      this.crispSwCtx.clearRect(0, 0, this.canvasOfSwRender.width, this.canvasOfSwRender.height);
      
      // === Software Rendering Pass (use CrispSwCanvas) ===
      SeededRandom.seedWithInteger(currentCount);
      const swDrawResult = canvasCodeFn(this.crispSwCtx, currentCount);
      // Blit the result to the SW canvas
      this.crispSwCtx.blitToCanvas(this.canvasOfSwRender);
      
      // Store the check data part of the result (if any)
      // Checks will access this.builderReturnValue
      this.builderReturnValue = swDrawResult?.checkData === undefined ? swDrawResult : swDrawResult.checkData;
      
      // Handle logs, if returned
      if (swDrawResult?.logs && Array.isArray(swDrawResult.logs)) {
          this.logContainer.innerHTML = swDrawResult.logs.join('<br>\n');
      }      
      
      // === Canvas Rendering Pass (use regular HTML5Canvas)===
      SeededRandom.seedWithInteger(currentCount);
      
      // result/logs ignored for this pass
      canvasCodeFn(this.canvasCtxOfCanvasRender, currentCount);
      
      if (this.canvasCtxOfSwRender.getHashString) this.updateHashes();
    }
    
    this.flipState = true;
    this.updateFlipOutput();
    
    this.showChecks(this.functionToRunAllChecks);
    
    // Important: Check for errors AFTER all checks and tests are complete
    // This ensures all errors have been logged by the time we check
    setTimeout(() => {
      // Check if any new errors occurred and log scene contents if needed
      const finalErrorCount = this.errorCount || 0;

    }, 0); // Using setTimeout with 0 delay ensures this runs after all other operations
    
    // Return success/failure status based on error count
    return this.errorCount === initialErrorCount;
  }

  runMultipleIterations(count, stopAtError = true, onComplete = null) {
    let current = 0;
    this.sceneLoggedForCurrentIteration = false; // Initialize flag
    const initialErrorCount = this.errorCount || 0;

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
            // Track error count before rendering
            const beforeErrorCount = this.errorCount || 0;
            
            // Reset scene logged flag
            this.sceneLoggedForCurrentIteration = false;
            
            this.render(this.buildShapesFn, this.canvasCodeFn);
            current++;
            updateProgress();
            
            // Use a small delay to check for errors after all rendering and checks are complete
            setTimeout(() => {
                // Continue if under count and either not stopping at errors or no new errors
                if (current < count && (!stopAtError || this.errorCount === beforeErrorCount)) {
                    requestAnimationFrame(runFrame);
                } else {
                    // Remove progress bar when done
                    progressBar.remove();
                    if (onComplete) onComplete(); // *** CALL CALLBACK ON NORMAL COMPLETION ***
                }
            }, 0);
            
        } catch (error) {
            this.showError(`Error during multiple iterations: ${error.message}`);
            
            // Log scene contents if there's an error and it hasn't been logged yet
            if (!this.sceneLoggedForCurrentIteration && this.shapes && this.shapes.length > 0) {
                this.logSceneContents();
            }
            
            // Remove progress bar on error if we're stopping
            if (stopAtError) {
                progressBar.remove();
                if (onComplete) onComplete(error); // *** CALL CALLBACK ON ERROR STOP ***
            } else if (current < count) {
                // Continue if not stopping at errors
                requestAnimationFrame(runFrame);
            } else { 
                // Reached end even with errors when not stopping
                progressBar.remove();
                if (onComplete) onComplete(); // *** CALL CALLBACK ON NON-STOP ERROR COMPLETION ***
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
    
    RenderTest.sections.forEach((section, index) => {
      if (index > 0) {
        nav.appendChild(document.createTextNode(' - '));
      }
      
      const link = document.createElement('a');
      link.href = `#${section.id}`;
      link.textContent = section.title;
      link.className = 'nav-link';
      nav.appendChild(link);
    });

    // Create container for 'Run All' buttons
    const runAllContainer = document.createElement('div');
    runAllContainer.style.marginTop = '15px';
    runAllContainer.style.marginBottom = '10px';
    runAllContainer.style.display = 'flex';
    runAllContainer.style.gap = '10px';
    runAllContainer.style.flexWrap = 'wrap'; // Allow buttons to wrap on smaller screens

    const runAllButtons = []; // To disable/enable them during execution

    // Helper function for sequential execution
    const runAllSequentially = async (actionFn) => {
      const tests = Object.values(RenderTest.registry);
      runAllButtons.forEach(btn => btn.disabled = true); // Disable buttons
      console.log(`Starting batch action for ${tests.length} tests...`);
      for (const test of tests) {
        console.log(`Running action for test: ${test.id}`);
        // Scroll the test into view slightly before running
        test.container.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
        // Small delay to allow scrolling before action
        await new Promise(resolve => setTimeout(resolve, 100)); 
        try {
          await actionFn(test);
        } catch (error) {
          console.error(`Error running action for test ${test.id}:`, error);
          // Decide if you want to stop on error or continue
          // break; // Uncomment to stop on first error
        }
         // Optional small delay between tests
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      console.log("Batch action complete.");
      runAllButtons.forEach(btn => btn.disabled = false); // Re-enable buttons
    };

    // Button 1: Run All 1 Iteration
    const runAll1Button = document.createElement('button');
    runAll1Button.textContent = 'Run All: 1 iter';
    runAll1Button.className = 'action-button';
    runAll1Button.onclick = () => runAllSequentially((test) => {
      // Reset iteration counter to 1 for each test before running
      test.iterationCounter.value = '1'; 
      return new Promise(resolve => {
        // render is synchronous but let's wrap in promise for consistency and potential future async render
        test.render(test.buildShapesFn, test.canvasCodeFn); 
        resolve();
      });
    });
    runAllContainer.appendChild(runAll1Button);
    runAllButtons.push(runAll1Button);

    // Button 2: Run All 10 Iterations
    const runAll10Button = document.createElement('button');
    runAll10Button.textContent = 'Run All: 10 iter';
    runAll10Button.className = 'action-button';
    runAll10Button.onclick = () => runAllSequentially((test) => {
      return new Promise((resolve, reject) => {
        try {
          // Pass resolve as the onComplete callback
          test.runMultipleIterations(10, true, resolve);
        } catch (err) {
          // Catch synchronous errors during setup, though unlikely
          reject(err); 
        }
      });
    });
    runAllContainer.appendChild(runAll10Button);
    runAllButtons.push(runAll10Button);

    // Button 3: Run All 100 Iterations
    const runAll100Button = document.createElement('button');
    runAll100Button.textContent = 'Run All: 100 iter';
    runAll100Button.className = 'action-button';
    runAll100Button.onclick = () => runAllSequentially((test) => {
      return new Promise((resolve, reject) => {
        try {
          // Pass resolve as the onComplete callback
          test.runMultipleIterations(100, true, resolve); 
        } catch (err) {
          reject(err);
        }
      });
    });
    runAllContainer.appendChild(runAll100Button);
    runAllButtons.push(runAll100Button);


    // Button 4: Collect All Defects (1k iter)
    const collectAllButton = document.createElement('button');
    collectAllButton.textContent = 'Collect All Defects (1k iter)';
    collectAllButton.className = 'action-button';
    collectAllButton.onclick = () => runAllSequentially((test) => {
      return new Promise((resolve, reject) => {
         try {
          // Pass resolve as the onComplete callback
          test.runMultipleIterations(1000, false, resolve); 
        } catch (err) {
          reject(err);
        }
      });
    });
    runAllContainer.appendChild(collectAllButton);
    runAllButtons.push(collectAllButton);

    // Add the 'Run All' container before the background control
    nav.appendChild(runAllContainer); 

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
    
    // Switch to magnifier labels
    this.displayAltLabel.style.display = 'none';
    this.displayMagContainer.style.display = 'flex'; // Use flex for the container

    // Clear display canvas
    this.canvasCtxOfComparison.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasCtxOfComparison.clearRect(0, 0, this.canvasOfComparison.width, this.canvasOfComparison.height);    

    // Get image data from both canvases at the same position
    const swImageData = this.canvasCtxOfSwRender.getImageData(
      Math.max(0, x - Math.floor(RenderTest.GRID_COLUMNS/2)),
      Math.max(0, y - Math.floor(RenderTest.GRID_ROWS/2)),
      RenderTest.GRID_COLUMNS,
      RenderTest.GRID_ROWS
    );

    const canvasImageData = this.canvasCtxOfCanvasRender.getImageData(
      Math.max(0, x - Math.floor(RenderTest.GRID_COLUMNS/2)),
      Math.max(0, y - Math.floor(RenderTest.GRID_ROWS/2)),
      RenderTest.GRID_COLUMNS,
      RenderTest.GRID_ROWS
    );

    // Calculate pixel size for the magnified view
    const pixelSize = Math.min(
      (this.canvasOfComparison.width / 2) / RenderTest.GRID_COLUMNS,
      this.canvasOfComparison.height / RenderTest.GRID_ROWS
    );

    // Function to draw magnified grid
    const drawMagnifiedGrid = (imageData, offsetX) => {
      // Calculate the actual coordinates of the top-left pixel in the source image
      const sourceX = x - Math.floor(RenderTest.GRID_COLUMNS/2);
      const sourceY = y - Math.floor(RenderTest.GRID_ROWS/2);
      
      // Calculate where to start reading from the imageData
      const readOffsetX = Math.max(0, -sourceX);
      const readOffsetY = Math.max(0, -sourceY);
      
      for (let py = 0; py < RenderTest.GRID_ROWS; py++) {
        for (let px = 0; px < RenderTest.GRID_COLUMNS; px++) {
          // Calculate actual source coordinates for this pixel
          const actualX = sourceX + px;
          const actualY = sourceY + py;
          
          // Check if the pixel is within canvas bounds
          const isOutOfBounds = actualX < 0 || actualY < 0 || 
                               actualX >= canvas.width || actualY >= canvas.height;

          if (isOutOfBounds) {
            // Draw grey pixel for out of bounds
            this.canvasCtxOfComparison.fillStyle = 'rgb(128,128,128)';
          } else {
            // Calculate correct index in the imageData
            const dataX = px - readOffsetX;
            const dataY = py - readOffsetY;
            const i = (dataY * RenderTest.GRID_COLUMNS + dataX) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            this.canvasCtxOfComparison.fillStyle = colorToString(r, g, b, a);
          }

          this.canvasCtxOfComparison.fillRect(
            offsetX + px * pixelSize,
            py * pixelSize,
            pixelSize,
            pixelSize
          );

          // Draw grid lines
          this.canvasCtxOfComparison.strokeStyle = 'rgba(128,128,128,0.5)';
          this.canvasCtxOfComparison.strokeRect(
            offsetX + px * pixelSize,
            py * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }

      // Draw crosshair
      this.canvasCtxOfComparison.strokeStyle = 'red';
      this.canvasCtxOfComparison.lineWidth = 2;
      
      // Vertical line
      this.canvasCtxOfComparison.beginPath();
      this.canvasCtxOfComparison.moveTo(offsetX + (RenderTest.GRID_COLUMNS/2) * pixelSize, 0);
      this.canvasCtxOfComparison.lineTo(offsetX + (RenderTest.GRID_COLUMNS/2) * pixelSize, RenderTest.GRID_ROWS * pixelSize);
      this.canvasCtxOfComparison.stroke();
      
      // Horizontal line
      this.canvasCtxOfComparison.beginPath();
      this.canvasCtxOfComparison.moveTo(offsetX, (RenderTest.GRID_ROWS/2) * pixelSize);
      this.canvasCtxOfComparison.lineTo(offsetX + RenderTest.GRID_COLUMNS * pixelSize, (RenderTest.GRID_ROWS/2) * pixelSize);
      this.canvasCtxOfComparison.stroke();

      // Compute the local mouse coordinates within this grid.
      let localMouseX = Math.floor(RenderTest.GRID_COLUMNS/2);
      let localMouseY = Math.floor(RenderTest.GRID_ROWS/2);
      // Clamp to valid indices
      localMouseX = Math.min(Math.floor(localMouseX), RenderTest.GRID_COLUMNS - 1);
      localMouseY = Math.min(Math.floor(localMouseY), RenderTest.GRID_ROWS - 1);
      const idx = (localMouseY * RenderTest.GRID_COLUMNS + localMouseX) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1]; 
      const b = imageData.data[idx + 2];
      const a = imageData.data[idx + 3];
      const rgbaText = colorToString(r, g, b, a);

      // Draw color text below grid
      this.canvasCtxOfComparison.font = '12px monospace';
      this.canvasCtxOfComparison.textAlign = 'center';
      this.canvasCtxOfComparison.textBaseline = 'middle';
      const textX = offsetX + (RenderTest.GRID_COLUMNS * pixelSize) / 2;
      const textY = (RenderTest.GRID_ROWS) * pixelSize + pixelSize/2;
      this.canvasCtxOfComparison.fillStyle = 'black';
      this.canvasCtxOfComparison.fillText(rgbaText, textX, textY);
    };

    // Draw left side (SW renderer)
    drawMagnifiedGrid(swImageData, 0);

    // Draw right side (Canvas renderer)
    drawMagnifiedGrid(canvasImageData, this.canvasOfComparison.width / 2);

    // Draw separator line
    this.canvasCtxOfComparison.strokeStyle = 'rgba(128,128,128,0.8)';
    this.canvasCtxOfComparison.lineWidth = 6;
    this.canvasCtxOfComparison.beginPath();
    this.canvasCtxOfComparison.moveTo(this.canvasOfComparison.width / 2, 0);
    this.canvasCtxOfComparison.lineTo(this.canvasOfComparison.width / 2, this.canvasOfComparison.height);
    this.canvasCtxOfComparison.stroke();

    // Add white highlights on the sides of the separator
    this.canvasCtxOfComparison.strokeStyle = 'rgba(255,255,255,0.5)';
    this.canvasCtxOfComparison.lineWidth = 2;
    
    // Left highlight
    this.canvasCtxOfComparison.beginPath();
    this.canvasCtxOfComparison.moveTo(this.canvasOfComparison.width / 2 - 3, 0);
    this.canvasCtxOfComparison.lineTo(this.canvasOfComparison.width / 2 - 3, this.canvasOfComparison.height);
    this.canvasCtxOfComparison.stroke();
    
    // Right highlight
    this.canvasCtxOfComparison.beginPath();
    this.canvasCtxOfComparison.moveTo(this.canvasOfComparison.width / 2 + 3, 0);
    this.canvasCtxOfComparison.lineTo(this.canvasOfComparison.width / 2 + 3, this.canvasOfComparison.height);
    this.canvasCtxOfComparison.stroke();

    // Draw coordinates at top center
    this.canvasCtxOfComparison.font = '14px monospace';
    this.canvasCtxOfComparison.textAlign = 'center';
    this.canvasCtxOfComparison.textBaseline = 'top';
    const coordsText = `(${x}, ${y})`;
    this.canvasCtxOfComparison.fillStyle = 'black';
    this.canvasCtxOfComparison.fillText(coordsText, this.canvasOfComparison.width / 2, 25);
  }

  handleMouseOut() {
    // Restore normal display canvas view (and labels via updateFlipOutput)
    this.updateFlipOutput();
  }
}