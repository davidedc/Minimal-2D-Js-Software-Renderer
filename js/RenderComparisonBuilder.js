class RenderComparisonBuilder {
  constructor() {
    this._id = '';
    this._title = '';
    this._description = '';
    this._shapeBuilder = null;
    this._checks = [];
    this._buildLog = [];
    this._canvasCodeFn = null;
  }

  withId(id) {
    this._id = id;
    return this;
  }

  withTitle(title) {
    this._title = title;
    return this;
  }

  withDescription(description) {
    this._description = description;
    return this;
  }

  addShapes(shapeFunction, ...args) {
    this._shapeBuilder = (shapes, log, currentExampleNumber) => {
      this._buildLog = [];
      return shapeFunction(shapes, log, currentExampleNumber, ...args);
    };
    return this;
  }

  withColorCheckMiddleRow(options) {
    this._checks.push((comparison) => {
      const swColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(
        comparison.canvasCtxOfSwRender, 
        options.expectedUniqueColors
      );
      
      // In Node environment, we don't have canvas renderer
      let canvasColors = null;
      if (!comparison.isNode && comparison.canvasCtxOfCanvasRender) {
        canvasColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(
          comparison.canvasCtxOfCanvasRender, 
          options.expectedUniqueColors
        );
      }
      
      const isCorrect = swColors === options.expectedUniqueColors && 
                       (comparison.isNode || canvasColors === options.expectedUniqueColors);
      
      // Format appropriately for environment
      if (comparison.isNode) {
        return `${isCorrect ? '✓' : '✗'} Middle row unique colors: SW: ${swColors}`;
      } else {
        return `${isCorrect ? '&#x2705; ' : ''}Middle row unique colors: SW: ${swColors}, Canvas: ${canvasColors}`;
      }
    });
    return this;
  }
  
  withUniqueColorsCheck(expectedColors) {
    this._checks.push((comparison) => {
      // Only check the software renderer as specified
      const swColors = comparison.renderChecks.checkCountOfUniqueColorsInImage(
        comparison.canvasCtxOfSwRender, 
        expectedColors
      );
      const isCorrect = swColors === expectedColors;
      
      // Format appropriately for the environment
      if (comparison.isNode) {
        return `${isCorrect ? '✓' : '✗'} Total unique colors in SW renderer: ${swColors}`;
      } else {
        return `${isCorrect ? '&#x2705; ' : ''}Total unique colors in SW renderer: ${swColors}`;
      }
    });
    return this;
  }

  withSpecklesCheckOnSwCanvas() {
    this._checks.push((comparison) => {
      // Check only SW renderer for speckles
      const speckleCountSW = comparison.renderChecks.checkForSpeckles(comparison.canvasCtxOfSwRender);
      
      // Format appropriately for the environment
      if (comparison.isNode) {
        return `${speckleCountSW === 0 ? '✓' : '✗'} Speckle count: SW: ${speckleCountSW}`;
      } else {
        return `${speckleCountSW === 0 ? '&#x2705; ' : ''}Speckle count: SW: ${speckleCountSW}`;
      }
    });
    return this;
  }

  withColorCheckMiddleColumn(options) {
    this._checks.push((comparison) => {
      const swColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
        comparison.canvasCtxOfSwRender, 
        options.expectedUniqueColors
      );
      
      // In Node environment, we don't have canvas renderer
      let canvasColors = null;
      if (!comparison.isNode && comparison.canvasCtxOfCanvasRender) {
        canvasColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
          comparison.canvasCtxOfCanvasRender, 
          options.expectedUniqueColors
        );
      }
      
      const isCorrect = swColors === options.expectedUniqueColors && 
                       (comparison.isNode || canvasColors === options.expectedUniqueColors);
                       
      // Format appropriately for environment
      if (comparison.isNode) {
        return `${isCorrect ? '✓' : '✗'} Middle column unique colors: SW: ${swColors}`;
      } else {
        return `${isCorrect ? '&#x2705; ' : ''}Middle column unique colors: SW: ${swColors}, Canvas: ${canvasColors}`;
      }
    });
    return this;
  }

  withExtremesCheck(alphaTolerance = 0) {
    this._checks.push((comparison) => {
      const extremes = comparison.builderReturnValue;
      if (!extremes) return "No extremes data available";
      
      // Use the updated checkExtremes that works in both environments
      // For Node, we pass null as the canvas renderer
      const result = comparison.renderChecks.checkExtremes(
        comparison.canvasCtxOfSwRender,
        comparison.isNode ? null : comparison.canvasCtxOfCanvasRender,
        extremes,
        alphaTolerance
      );
      
      // Format appropriately for the environment
      if (comparison.isNode) {
        // In Node, check if there were any errors
        const isCorrect = !result.includes("FAIL") && !result.includes("Error") && 
                         (typeof result.errors === 'undefined' || result.errors === 0);
        return `${isCorrect ? '✓' : '✗'} ${result}`;
      } else {
        // In browser, use HTML checkmarks
        const isCorrect = !result.includes("FAIL") && !result.includes("Error");
        return `${isCorrect ? '&#x2705; ' : ''}${result}`;
      }
    });
    return this;
  }
  
  withNoGapsInFillEdgesCheck() {
    this._checks.push((comparison) => {
      const result = comparison.renderChecks.checkEdgesForGaps(
        comparison.canvasCtxOfSwRender,
        comparison.isNode ? null : comparison.canvasCtxOfCanvasRender,
        false // isStroke = false, check fill
      );
      const isCorrect = !result.includes("FAIL") && !result.includes("Error");
      if (comparison.isNode) {
        return `${isCorrect ? '✓' : '✗'} ${result}`;
      } else {
        return `${isCorrect ? '&#x2705; ' : ''}${result}`;
      }
    });
    return this;
  }
  
  withNoGapsInStrokeEdgesCheck() {
    this._checks.push((comparison) => {
      const result = comparison.renderChecks.checkEdgesForGaps(
        comparison.canvasCtxOfSwRender,
        comparison.isNode ? null : comparison.canvasCtxOfCanvasRender,
        true // isStroke = true, check stroke
      );
      const isCorrect = !result.includes("FAIL") && !result.includes("Error");
      if (comparison.isNode) {
        return `${isCorrect ? '✓' : '✗'} ${result}`;
      } else {
        return `${isCorrect ? '&#x2705; ' : ''}${result}`;
      }
    });
    return this;
  }
  
  // Compare pixels with threshold values for RGB and alpha components
  compareWithThreshold(RGBThreshold, alphaThreshold) {
    this._checks.push((comparison) => {
      // In Node environment, we can't compare with Canvas as it doesn't exist
      if (comparison.isNode) {
        return `✓ Threshold check skipped in Node environment`;
      } else {
        const result = comparison.renderChecks.compareWithThreshold(
          comparison.canvasCtxOfSwRender,
          comparison.canvasCtxOfCanvasRender,
          RGBThreshold,
          alphaThreshold
        );
        const isCorrect = !result.includes("FAIL") && !result.includes("Error");
        return `${isCorrect ? '&#x2705; ' : ''}${result}`;
      }
    });
    return this;
  }

  // you can pass a function that runs canvas code
  // so instead of passing shapes, you pass a function that runs canvas code
  // and then you can use the canvas code to create the shapes
  runCanvasCode(canvasCodeFn) {
    this._canvasCodeFn = canvasCodeFn;
    return this;
  }

  build() {
    if (!this._id || !this._title || (!this._shapeBuilder && !this._canvasCodeFn)) {
      throw new Error('RenderComparisonBuilder requires id, title, and shape builder function or canvas code function');
    }

    // if both shapeBuilder and canvasCodeFn are defined, throw an error as well
    if (this._shapeBuilder && this._canvasCodeFn) {
      throw new Error('RenderComparisonBuilder cannot have both shape builder function and canvas code function');
    }

    // Create metrics function that works in both environments
    const metricsFunction = this._checks.length > 0 ? 
      (comparison) => {
        const results = this._checks.map(check => check(comparison));
        
        // Return environment-appropriate formatted result
        const isNode = typeof window === 'undefined';
        return isNode ?
          results.join('\n') : // Plain text for Node
          results.join('<br>'); // HTML for browser
      } : null;

    return new RenderComparison(
      this._id,
      this._title,
      this._shapeBuilder,
      this._canvasCodeFn,
      metricsFunction,
      this._description
    );
  }
}