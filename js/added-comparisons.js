function addBlackLinesComparison(lineWidth) {
  return new RenderComparison(
    'thin-black-lines',
    `${lineWidth}px Black Lines`,
    (shapes) => {
      addBlackLines(20, shapes, lineWidth);
    },
    (comparison) => `Number of lines: ${comparison.shapes.length}`
  );
}

function addEverythingTogetherComparison() {
  return new RenderComparison(
    'all-shapes',
    "All Shape Types Combined",
    (shapes) => {
      buildScene(shapes);
    }
  );
}

function addThinRoundedRectsComparison() {
  return new RenderComparison(
    'thin-rounded-rects',
    "Multiple Thin-Stroke Rounded Rectangles",
    (shapes) => {
      addThinStrokeRoundedRectangles(10, shapes);
    }
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
    }
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
    }
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
    }
  );
}

function add2PxVerticalLineCenteredAtGridComparison() {
  let comparisonLog = [];
  return new RenderComparison(
    'centered-2px-vertical-line',
    "Single 2px Vertical Line centered at grid",
    (shapes) => {
      const edges = add2PxVerticalLineCenteredAtGrid(shapes, comparisonLog);
      return edges;
    },
    (comparison) => {
      const edges = comparison.builderReturnValue;
      if (!edges) return "No edges data available";      
      
      comparisonLog = [];

      // Check if the line appears at the expected X coordinate
      const swColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.swCtx, 1);
      const canvasColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle row unique colors: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`);
      
      // Check vertical alignment
      const swColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.swCtx, 1);
      const canvasColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.canvasCtx, 1);
      
      comparisonLog.push(`Middle column unique colors: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`);
      
      // Check extremes
      const extremesResults = comparison.renderChecks.checkExtremes(
        comparison.swCtx,
        comparison.canvasCtx,
        edges  // The expected extremes returned from add2PxVerticalLineCenteredAtGrid
      );
      
      comparisonLog.push('Extremes check:');
      comparisonLog.push(extremesResults);
      
      return comparisonLog.join('<br>');
    }
  );
}