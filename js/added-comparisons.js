function addBlackLinesComparison(lineWidth) {
  return new RenderComparison(
    'thin-black-lines',
    `${lineWidth}px Black Lines`,
    (shapes) => {
      addBlackLines(20, shapes, lineWidth);
    },
    (comparison) => `Number of lines: ${comparison.shapes.length}`,
    `Tests rendering of multiple black lines of line width ${lineWidth}`
  );
}

function addEverythingTogetherComparison() {
  return new RenderComparison(
    'all-shapes',
    "All Shape Types Combined",
    (shapes) => {
      buildScene(shapes);
    },
    null,
    'Combines all shape types into a single scene to test overall rendering consistency'
  );
}

function addThinRoundedRectsComparison() {
  return new RenderComparison(
    'thin-rounded-rects',
    "Multiple Thin-Stroke Rounded Rectangles",
    (shapes) => {
      addThinStrokeRoundedRectangles(10, shapes);
    },
    null,
    'Tests rendering of multiple rounded rectangles with thin stroke widths'
  );
}

function addCenteredRoundedRectComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-rounded-rect',
    "Single Centered Rounded Rectangle",
    (shapes) => {
      addCenteredRoundedRect(shapes);
    },
    (comparison) => {
      const swColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.swCtx, 2);
      const canvasColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.canvasCtx, 2);
      const swColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.swCtx, 2);
      const canvasColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.canvasCtx, 2);
      
      comparisonLog = [];
      comparisonLog.push(`Unique colors in middle row: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`);
      comparisonLog.push(`Unique colors in middle column: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`);
      return comparisonLog.join('<br>');
    },
    'A single rounded rectangle with different stroke widths and colors'
  );
}

function add1PxStrokedRoundedRectCenteredAtGridComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-1px-rounded-rect',
    "Single 1px Stroked Rounded Rectangle centered at grid",
    (shapes) => {
      const edges = add1PxStrokeCenteredRoundedRectAtGrid(shapes);
      return edges;
    },
    (comparison) => {
      const edges = comparison.builderReturnValue;
      if (!edges) return "No edges data available";
      
      return comparison.renderChecks.checkPlacementOf4Sides(
        comparison.swCtx,
        comparison.canvasCtx,
        edges
      );
    },
    'Tests crisp rendering of a 1px stroked rounded rectangle where the center is at a crossing in the grid'
  );
}

function add1PxStrokedRoundedRectCenteredAtPixelComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-1px-rounded-rect',
    "Single 1px Stroked Rounded Rectangle centered at pixel",
    (shapes) => {
      const edges = add1PxStrokeCenteredRoundedRectAtPixel(shapes);
      return edges;
    },
    (comparison) => {
      const edges = comparison.builderReturnValue;
      if (!edges) return "No edges data available";
      
      return comparison.renderChecks.checkPlacementOf4Sides(
        comparison.swCtx,
        comparison.canvasCtx,
        edges
      );
    },
    'Tests crisp rendering of a 1px stroked rounded rectangle where the center is in the middle of a pixel'
  );
}

function add2PxVerticalLineCenteredAtGridComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-2px-vertical-line',
    "Single 2px Vertical Line centered at grid",
    (shapes) => {
      const extremes = add2PxVerticalLineCenteredAtGrid(shapes, comparisonLog);
      return extremes;
    },
    (comparison) => {
      const extremes = comparison.builderReturnValue;
      if (!extremes) return "No extremes data available";      
      
      comparisonLog = [];

      // Count unique colors in the middle row
      const swColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.swCtx, 1);
      const canvasColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle row unique colors: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`);
      
      // Count unique colors in the middle column
      const swColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.swCtx, 1);
      const canvasColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle column unique colors: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`);
      
      // Check extremes
      const extremesResults = comparison.renderChecks.checkExtremes(
        comparison.swCtx,
        comparison.canvasCtx,
        extremes  // The expected extremes returned from add2PxVerticalLineCenteredAtGrid
      );
      
      comparisonLog.push('Extremes check:');
      comparisonLog.push(extremesResults);
      
      return comparisonLog.join('<br>');
    },
    'Tests crisp rendering of a 2px vertical line'
  );
}

function add1PxVerticalLineCenteredAtPixelComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-1px-vertical-line',
    "Single 1px Vertical Line centered at pixel",
    (shapes) => {
      const extremes = add1PxVerticalLineCenteredAtPixel(shapes, comparisonLog);
      return extremes;
    },
    (comparison) => {
      const extremes = comparison.builderReturnValue;
      if (!extremes) return "No extremes data available";      
      
      comparisonLog = [];

      // Count unique colors in the middle row
      const swColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.swCtx, 1);
      const canvasColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle row unique colors: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`);
      
      // Count unique colors in the middle column
      const swColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.swCtx, 1);
      const canvasColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle column unique colors: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`);
      
      // Check extremes
      const extremesResults = comparison.renderChecks.checkExtremes(
        comparison.swCtx,
        comparison.canvasCtx,
        extremes
      );
      
      comparisonLog.push('Extremes check:');
      comparisonLog.push(extremesResults);
      
      return comparisonLog.join('<br>');
    },
    'Tests crisp rendering of a 1px vertical line centered at pixel'
  );
}

function add1PxHorizontalLineCenteredAtPixelComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-1px-horizontal-line',
    "Single 1px Horizontal Line centered at pixel",
    (shapes) => {
      const extremes = add1PxHorizontalLineCenteredAtPixel(shapes, comparisonLog);
      return extremes;
    },
    (comparison) => {
      const extremes = comparison.builderReturnValue;
      if (!extremes) return "No extremes data available";      
      
      comparisonLog = [];

      // Count unique colors in the middle row
      const swColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.swCtx, 1);
      const canvasColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle row unique colors: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`);
      
      // Count unique colors in the middle column
      const swColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.swCtx, 1);
      const canvasColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle column unique colors: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`);
      
      // Check extremes
      const extremesResults = comparison.renderChecks.checkExtremes(
        comparison.swCtx,
        comparison.canvasCtx,
        extremes
      );
      
      comparisonLog.push('Extremes check:');
      comparisonLog.push(extremesResults);
      
      return comparisonLog.join('<br>');
    },
    'Tests crisp rendering of a 1px horizontal line centered at pixel'
  );
}