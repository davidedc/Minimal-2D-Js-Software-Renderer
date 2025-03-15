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
      
      const baseMsg = `Middle row unique colors: SW: ${swColors}`;
      return this.formatCheckResult(isCorrect, comparison.isNode, { 
        node: baseMsg,
        browser: baseMsg + `, Canvas: ${canvasColors}`
      });
    });
    return this;
  }
  
  // Helper method to format check results based on environment
  formatCheckResult(isCorrect, isNodeEnv, messages) {
    if (isNodeEnv) {
      return `${isCorrect ? '✓' : '✗'} ${messages.node}`;
    } else {
      return `${isCorrect ? '&#x2714;' : '&#x2717;'} ${messages.browser}`;
    }
  }
  
  withUniqueColorsCheck(expectedColors) {
    this._checks.push((comparison) => {
      // Only check the software renderer as specified
      const swColors = comparison.renderChecks.checkCountOfUniqueColorsInImage(
        comparison.canvasCtxOfSwRender, 
        expectedColors
      );
      const isCorrect = swColors === expectedColors;
      
      const message = `Total unique colors in SW renderer: ${swColors}`;
      return this.formatCheckResult(isCorrect, comparison.isNode, { node: message, browser: message });
    });
    return this;
  }

  withSpecklesCheckOnSwCanvas() {
    this._checks.push((comparison) => {
      // Check only SW renderer for speckles
      const speckleCountSW = comparison.renderChecks.checkForSpeckles(comparison.canvasCtxOfSwRender);
      const isCorrect = speckleCountSW === 0;
      
      const message = `Speckle count: SW: ${speckleCountSW}`;
      return this.formatCheckResult(isCorrect, comparison.isNode, { node: message, browser: message });
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
      
      const baseMsg = `Middle column unique colors: SW: ${swColors}`;
      return this.formatCheckResult(isCorrect, comparison.isNode, { 
        node: baseMsg,
        browser: baseMsg + `, Canvas: ${canvasColors}`
      });
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
      
      // Determine if the check passed
      const isNodeCorrect = !result.includes("FAIL") && !result.includes("Error") && 
                           (typeof result.errors === 'undefined' || result.errors === 0);
      const isBrowserCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      // Use the common formatter with the appropriate correctness value
      return this.formatCheckResult(
        comparison.isNode ? isNodeCorrect : isBrowserCorrect,
        comparison.isNode,
        { node: result, browser: result }
      );
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
      
      return this.formatCheckResult(isCorrect, comparison.isNode, { node: result, browser: result });
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
      
      return this.formatCheckResult(isCorrect, comparison.isNode, { node: result, browser: result });
    });
    return this;
  }
  
  // Compare pixels with threshold values for RGB and alpha components
  compareWithThreshold(RGBThreshold, alphaThreshold) {
    this._checks.push((comparison) => {
      // In Node environment, we can't compare with Canvas as it doesn't exist
      if (comparison.isNode) {
        return this.formatCheckResult(true, true, { 
          node: "Threshold check skipped in Node environment",
          browser: "" // Not used in Node
        });
      } else {
        const result = comparison.renderChecks.compareWithThreshold(
          comparison.canvasCtxOfSwRender,
          comparison.canvasCtxOfCanvasRender,
          RGBThreshold,
          alphaThreshold
        );
        const isCorrect = !result.includes("FAIL") && !result.includes("Error");
        
        return this.formatCheckResult(isCorrect, false, { 
          node: "", // Not used in browser
          browser: result 
        });
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
        return this.formatResultsForEnvironment(results, comparison.isNode);
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
  
  // Format the results array based on the environment
  formatResultsForEnvironment(results, isNodeEnv) {
    return isNodeEnv ? 
      results.join('\n') : // Plain text for Node
      results.join('<br>'); // HTML for browser
  }
}