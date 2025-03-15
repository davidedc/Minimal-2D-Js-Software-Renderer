class RenderTestBuilder {
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
    this._shapeBuilder = (shapes, log, currentIterationNumber) => {
      this._buildLog = [];
      return shapeFunction(shapes, log, currentIterationNumber, ...args);
    };
    return this;
  }

  withColorCheckMiddleRow(options) {
    this._checks.push((test) => {
      const swColors = test.renderChecks.checkCountOfUniqueColorsInMiddleRow(
        test.canvasCtxOfSwRender, 
        options.expectedUniqueColors
      );
      
      // In Node environment, we don't have canvas renderer
      let canvasColors = null;
      if (!test.isNode && test.canvasCtxOfCanvasRender) {
        canvasColors = test.renderChecks.checkCountOfUniqueColorsInMiddleRow(
          test.canvasCtxOfCanvasRender, 
          options.expectedUniqueColors
        );
      }
      
      const isCorrect = swColors === options.expectedUniqueColors && 
                       (test.isNode || canvasColors === options.expectedUniqueColors);
      
      const baseMsg = `Middle row unique colors: SW: ${swColors}`;
      return this.formatCheckResult(isCorrect, test.isNode, { 
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
    this._checks.push((test) => {
      // Only check the software renderer as specified
      const swColors = test.renderChecks.checkCountOfUniqueColorsInImage(
        test.canvasCtxOfSwRender, 
        expectedColors
      );
      const isCorrect = swColors === expectedColors;
      
      const message = `Total unique colors in SW renderer: ${swColors}`;
      return this.formatCheckResult(isCorrect, test.isNode, { node: message, browser: message });
    });
    return this;
  }

  withSpecklesCheckOnSwCanvas() {
    this._checks.push((test) => {
      // Check only SW renderer for speckles
      const speckleCountSW = test.renderChecks.checkForSpeckles(test.canvasCtxOfSwRender);
      const isCorrect = speckleCountSW === 0;
      
      const message = `Speckle count: SW: ${speckleCountSW}`;
      return this.formatCheckResult(isCorrect, test.isNode, { node: message, browser: message });
    });
    return this;
  }

  withColorCheckMiddleColumn(options) {
    this._checks.push((test) => {
      const swColors = test.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
        test.canvasCtxOfSwRender, 
        options.expectedUniqueColors
      );
      
      // In Node environment, we don't have canvas renderer
      let canvasColors = null;
      if (!test.isNode && test.canvasCtxOfCanvasRender) {
        canvasColors = test.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
          test.canvasCtxOfCanvasRender, 
          options.expectedUniqueColors
        );
      }
      
      const isCorrect = swColors === options.expectedUniqueColors && 
                       (test.isNode || canvasColors === options.expectedUniqueColors);
      
      const baseMsg = `Middle column unique colors: SW: ${swColors}`;
      return this.formatCheckResult(isCorrect, test.isNode, { 
        node: baseMsg,
        browser: baseMsg + `, Canvas: ${canvasColors}`
      });
    });
    return this;
  }

  withExtremesCheck(alphaTolerance = 0) {
    this._checks.push((test) => {
      const extremes = test.builderReturnValue;
      if (!extremes) return "No extremes data available";
      
      // Use the updated checkExtremes that works in both environments
      // For Node, we pass null as the canvas renderer
      const result = test.renderChecks.checkExtremes(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        extremes,
        alphaTolerance
      );
      
      // Determine if the check passed
      const isNodeCorrect = !result.includes("FAIL") && !result.includes("Error") && 
                           (typeof result.errors === 'undefined' || result.errors === 0);
      const isBrowserCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      // Use the common formatter with the appropriate correctness value
      return this.formatCheckResult(
        test.isNode ? isNodeCorrect : isBrowserCorrect,
        test.isNode,
        { node: result, browser: result }
      );
    });
    return this;
  }
  
  withNoGapsInFillEdgesCheck() {
    this._checks.push((test) => {
      const result = test.renderChecks.checkEdgesForGaps(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        false // isStroke = false, check fill
      );
      const isCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      return this.formatCheckResult(isCorrect, test.isNode, { node: result, browser: result });
    });
    return this;
  }
  
  withNoGapsInStrokeEdgesCheck() {
    this._checks.push((test) => {
      const result = test.renderChecks.checkEdgesForGaps(
        test.canvasCtxOfSwRender,
        test.isNode ? null : test.canvasCtxOfCanvasRender,
        true // isStroke = true, check stroke
      );
      const isCorrect = !result.includes("FAIL") && !result.includes("Error");
      
      return this.formatCheckResult(isCorrect, test.isNode, { node: result, browser: result });
    });
    return this;
  }
  
  // Compare pixels with threshold values for RGB and alpha components
  compareWithThreshold(RGBThreshold, alphaThreshold) {
    this._checks.push((test) => {
      // In Node environment, we can't compare with Canvas as it doesn't exist
      if (test.isNode) {
        return this.formatCheckResult(true, true, { 
          node: "Threshold check skipped in Node environment",
          browser: "" // Not used in Node
        });
      } else {
        const result = test.renderChecks.compareWithThreshold(
          test.canvasCtxOfSwRender,
          test.canvasCtxOfCanvasRender,
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
      throw new Error('RenderTestBuilder requires id, title, and shape builder function or canvas code function');
    }

    // if both shapeBuilder and canvasCodeFn are defined, throw an error as well
    if (this._shapeBuilder && this._canvasCodeFn) {
      throw new Error('RenderTestBuilder cannot have both shape builder function and canvas code function');
    }

    // Create metrics function that works in both environments
    const metricsFunction = this._checks.length > 0 ? 
      (test) => {
        const results = this._checks.map(check => check(test));
        return this.formatResultsForEnvironment(results, test.isNode);
      } : null;

    return new RenderTest(
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