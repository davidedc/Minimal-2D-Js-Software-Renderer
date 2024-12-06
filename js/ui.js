// Modified drawShapesImpl to accept ctx as parameter
function drawShapesImpl(shapes, isCanvas, ctx = null) {
  for (let shape of shapes) {
    if (shape.type === 'line') {
      const draw = isCanvas ? drawLineCanvas : drawLineSW;
      const args = [
        shape.start.x, shape.start.y,
        shape.end.x, shape.end.y,
        shape.thickness,
        shape.color.r, shape.color.g, shape.color.b, shape.color.a
      ];
      isCanvas ? draw(ctx, ...args) : draw(...args);
    } else if (shape.type === 'rect') {
      const draw = isCanvas ? drawRectCanvas : drawRectSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'circle') {
      const draw = isCanvas ? drawCircleCanvas : drawCircleSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'arc') {
      const draw = isCanvas ? drawArcCanvas : drawArcSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'roundedRect') {
      const draw = isCanvas ? drawRoundedRectCanvas : drawRoundedRectSW;
      isCanvas ? draw(ctx, shape) : draw(shape);
    }
  }
}

function addRenderComparison(title, id, buildShapesFn, metricsFunction = null) {
  const comparison = new RenderComparison(id, title);
  comparison.metricsFunction = metricsFunction;
  comparison.render(buildShapesFn);
  return comparison;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  addRenderComparisons();

  // Create navigation after all sections are added
  RenderComparison.createNavigation();
});

function addRenderComparisons() {
  addThinBlackLinesComparison();  // Add this line first
  add1PxStrokedRoundedRectCenteredAtGridComparison();
  add1PxStrokedRoundedRectCenteredAtPixelComparison();
  addCenteredRoundedRectComparison();
  addThinRoundedRectsComparison();
  addEverythingTogetherComparison();
}

function addThinBlackLinesComparison() {
  addRenderComparison(
    "1px Black Lines",
    'thin-black-lines',
    (shapes) => {
      addThinBlackLines(20, shapes);
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