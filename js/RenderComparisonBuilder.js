class RenderComparisonBuilder {
  constructor() {
    this._id = '';
    this._title = '';
    this._description = '';
    this._shapeBuilder = null;
    this._checks = [];
    this._buildLog = [];
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
    this._shapeBuilder = (shapes, log) => {
      this._buildLog = [];
      return shapeFunction(shapes, log, ...args);
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

  withSpecklesCheck() {
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

  withExtremesCheck() {
    this._checks.push((comparison) => {
      const extremes = comparison.builderReturnValue;
      if (!extremes) return "No extremes data available";
      
      return comparison.renderChecks.checkExtremes(
        comparison.swCtx,
        comparison.canvasCtx,
        extremes
      );
    });
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
    if (!this._id || !this._title || !this._shapeBuilder) {
      throw new Error('RenderComparisonBuilder requires id, title, and shape builder function');
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
      metricsFunction,
      this._description
    );
  }
}