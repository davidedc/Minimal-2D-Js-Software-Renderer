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
  add1PxStrokedRoundedRectCenteredAtGridComparison();
  add1PxStrokedRoundedRectCenteredAtPixelComparison();
  addCenteredRoundedRectComparison();
  addThinRoundedRectsComparison();
  addEverythingTogetherComparison();
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
          const edges = add1PxStrokedRoundedRectCenteredAtGrid(shapes);
          return edges;  // This will now be stored in this.builderReturnValue
      },
      (comparison) => {
          const edges = comparison.builderReturnValue;
          if (!edges) return "No edges data available";
          
          const result = comparison.renderChecks.checkPlacementOf4Sides(
              comparison.swCtx,
              comparison.canvasCtx,
              edges
          );
          
          return result;
      }
  );
}

function add1PxStrokedRoundedRectCenteredAtGrid(shapes) {
  // Define rectangle dimensions as random integers between 20 and 150
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  // if width and height are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
  
  // We place the rectangle in the very middle of the grid.
  // In theory only even rectangle widths and heights work neatly, but actually the
  // drawing routines use getCornerBasedRepresentation and getCrispStrokeGeometry to fix the
  // other cases (with snapping to the top left where needed).
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  // Calculate edges
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth - 1;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight - 1;
  
  // Add the rounded rectangle to shapes
  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    // radius between 0 and 20% of the smallest dimension
    radius: Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }  // Transparent fill
  });
  
  // Return the edge positions
  return { leftX, rightX, topY, bottomY };
}

function add1PxStrokedRoundedRectCenteredAtPixelComparison() {
  addRenderComparison(
      "Single 1px Stroked Rounded Rectangle centered at pixel",
      'centered-1px-rounded-rect',
      (shapes) => {
          const edges = add1PxStrokedRoundedRectCenteredAtPixel(shapes);
          return edges;  // This will now be stored in this.builderReturnValue
      },
      (comparison) => {
          const edges = comparison.builderReturnValue;
          if (!edges) return "No edges data available";
          
          const result = comparison.renderChecks.checkPlacementOf4Sides(
              comparison.swCtx,
              comparison.canvasCtx,
              edges
          );
          
          return result;
      }
  );
}

function add1PxStrokedRoundedRectCenteredAtPixel(shapes) {
  // Define rectangle dimensions as random integers between 20 and 150
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  // if width and height are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
  
  // We center the rectangle in the middle of a pixel near the center of the canvas.
  // The canvas is even in both dimensions, so there isn't a perfect center pixel, we
  // choose the one to the left and top of the center, and we place the rectangle
  // in the middle of it
  // In theory only odd rectangle widths and heights work neatly, but actually the
  // drawing routines use getCornerBasedRepresentation and getCrispStrokeGeometry to fix the
  // other cases (with snapping to the top left where needed).
  const centerX = Math.floor(width / 2) + 0.5;
  const centerY = Math.floor(height / 2) + 0.5;
  
  // Calculate edges
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth - 1;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight - 1;
  
  // Add the rounded rectangle to shapes
  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    // radius between 0 and 20% of the smallest dimension
    radius: Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }  // Transparent fill
  });
  
  // Return the edge positions
  return { leftX, rightX, topY, bottomY };
}