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
        comparison.swCtx, 
        options.expectedUniqueColors
      );
      const canvasColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(
        comparison.canvasCtx, 
        options.expectedUniqueColors
      );
      return `Middle row unique colors: SW: ${swColors}, Canvas: ${canvasColors}`;
    });
    return this;
  }

  withSpecklesCheckOnSwCanvas() {
    this._checks.push((comparison) => {
      // check both SW and Canvas
      const speckleCountSW = comparison.renderChecks.checkForSpeckles(comparison.swCtx);
      return `Speckle count: SW: ${speckleCountSW}`;
    });
    return this;
  }

  withColorCheckMiddleColumn(options) {
    this._checks.push((comparison) => {
      const swColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
        comparison.swCtx, 
        options.expectedUniqueColors
      );
      const canvasColors = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(
        comparison.canvasCtx, 
        options.expectedUniqueColors
      );
      return `Middle column unique colors: SW: ${swColors}, Canvas: ${canvasColors}`;
    });
    return this;
  }

  withExtremesCheck(alphaTolerance = 0) {
    this._checks.push((comparison) => {
      const extremes = comparison.builderReturnValue;
      if (!extremes) return "No extremes data available";
      
      return comparison.renderChecks.checkExtremes(
        comparison.swCtx,
        comparison.canvasCtx,
        extremes,
        alphaTolerance
      );
    });
    return this;
  }
  
  compareWithThreshold(RGBThreshold, alphaThreshold) {
    this._checks.push((comparison) => {
      const result = comparison.renderChecks.compareWithThreshold(
        comparison.swCtx,
        comparison.canvasCtx,
        RGBThreshold,
        alphaThreshold
      );
      return result;
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

  // NOT USED, we rather check the leftmost and rightmost and topmost and bottommost pixels
  // that are not transparent, because there are some defects like protruding pixels in rounded rects
  // that get missed if one just checks the middle lines.
  // withPlacementCheck() {
  //   this._checks.push((comparison) => {
  //     const edges = comparison.builderReturnValue;
  //     if (!edges) return "No edges data available";
      
  //     return comparison.renderChecks.checkPlacementOf4SidesAlongMiddleLines(
  //       comparison.swCtx,
  //       comparison.canvasCtx,
  //       edges
  //     );
  //   });
  //   return this;
  // }

  build() {
    if (!this._id || !this._title || (!this._shapeBuilder && !this._canvasCodeFn)) {
      throw new Error('RenderComparisonBuilder requires id, title, and shape builder function or canvas code function');
    }

    // if both shapeBuilder and canvasCodeFn are defined, throw an error as well
    if (this._shapeBuilder && this._canvasCodeFn) {
      throw new Error('RenderComparisonBuilder cannot have both shape builder function and canvas code function');
    }

    // Create metrics function that runs all configured checks
    const metricsFunction = this._checks.length > 0 ? 
      (comparison) => {
        const results = this._checks.map(check => check(comparison));
        return results.join('<br>');
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