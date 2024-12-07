function addBlackLinesComparison(lineWidth) {
  addRenderComparison(
    `${lineWidth}px Black Lines`,
    'thin-black-lines',
    (shapes) => {
      addBlackLines(20, shapes, lineWidth);
    },
    (comparison) => `Number of lines: ${comparison.shapes.length}`
  );
}

function addEverythingTogetherComparison() {
  addRenderComparison(
    "All Shape Types Combined",
    'all-shapes',
    (shapes) => {
      buildScene(shapes);
    }
  );
}

function addThinRoundedRectsComparison() {
  addRenderComparison(
    "Multiple Thin-Stroke Rounded Rectangles",
    'thin-rounded-rects',
    (shapes) => {
      addThinStrokeRoundedRectangles(10, shapes);
    }
  );
}

function addCenteredRoundedRectComparison() {
  addRenderComparison(
    "Single Centered Rounded Rectangle",
    'centered-rounded-rect',
    (shapes) => {
      addCenteredRoundedRect(shapes);
    },
    (comparison) => {
      const swColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.swCtx, 2);
      const canvasColorsMiddleRow = comparison.renderChecks.checkCountOfUniqueColorsInMiddleRow(comparison.canvasCtx, 2);
      const swColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.swCtx, 2);
      const canvasColorsMiddleColumn = comparison.renderChecks.checkCountOfUniqueColorsInMiddleColumn(comparison.canvasCtx, 2);
      
      const row = `Unique colors in middle row: SW: ${swColorsMiddleRow}, Canvas: ${canvasColorsMiddleRow}`;
      const column = `Unique colors in middle column: SW: ${swColorsMiddleColumn}, Canvas: ${canvasColorsMiddleColumn}`;
      return row + '<br>' + column;
    }
  );
}

function add1PxStrokedRoundedRectCenteredAtGridComparison() {
  addRenderComparison(
      "Single 1px Stroked Rounded Rectangle centered at grid",
      'centered-1px-rounded-rect',
      (shapes) => {
          const edges = add1PxStrokeCenteredRoundedRectAtGrid(shapes);
          return edges; // This will now be stored in this.builderReturnValue
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
  addRenderComparison(
      "Single 1px Stroked Rounded Rectangle centered at pixel",
      'centered-1px-rounded-rect',
      (shapes) => {
          const edges = add1PxStrokeCenteredRoundedRectAtPixel(shapes);
          return edges; // This will now be stored in this.builderReturnValue
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