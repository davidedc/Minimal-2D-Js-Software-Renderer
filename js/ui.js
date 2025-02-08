// Modified drawShapesImpl to accept ctx as parameter
function drawShapesImpl(shapes, isCanvas, ctx = null, frameBuffer) {
  const pixelRenderer = new SWRendererPixel(frameBuffer, renderComparisonWidth, renderComparisonHeight);
  const swLineRenderer = new SWRendererLine(pixelRenderer);
  const swRectRenderer = new SWRendererRect(frameBuffer, renderComparisonWidth, renderComparisonHeight, swLineRenderer, pixelRenderer);
  const swRoundedRectRenderer = new SWRendererRoundedRect(frameBuffer, renderComparisonWidth, renderComparisonHeight, swLineRenderer, pixelRenderer, swRectRenderer);
  const swCircleRenderer = new SWRendererCircle(pixelRenderer);
  const swArcRenderer = new SWRendererArc(pixelRenderer);
  
  for (let shape of shapes) {
    if (shape.type === 'line') {
      const draw = isCanvas ? drawLineCanvas : swLineRenderer.drawLine.bind(swLineRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'rect') {
      const draw = isCanvas ? drawRectCanvas : swRectRenderer.drawRect.bind(swRectRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'circle') {
      const draw = isCanvas ? drawCircleCanvas : swCircleRenderer.drawCircle.bind(swCircleRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'arc') {
      const draw = isCanvas ? drawArcCanvas : swArcRenderer.drawArc.bind(swArcRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    } else if (shape.type === 'roundedRect') {
      const draw = isCanvas ? drawRoundedRectCanvas : swRoundedRectRenderer.drawRoundedRect.bind(swRoundedRectRenderer);
      isCanvas ? draw(ctx, shape) : draw(shape);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  addRenderComparisons();

  // Create navigation after all sections are added
  RenderComparison.createNavigation("Low level sw renderer tests");
});

function addRenderComparisons() {
  add1PxHorizontalLineCenteredAtPixelComparison();
  add1PxVerticalLineCenteredAtPixelComparison();
  add2PxHorizontalLineCenteredAtGridComparison();
  add2PxVerticalLineCenteredAtGridComparison();
  addBlackLinesComparison(1);  // 1px lines
  addBlackLinesComparison(2);  // 2px lines
  addBlackLinesComparison(3);  // 3px lines
  addBlackLinesComparison(5);  // 5px lines
  addBlackLinesComparison(10); // 10px lines
  add1PxStrokedRectCenteredAtGridComparison();
  add1PxStrokedRectCenteredAtPixelComparison();
  add1PxStrokedRoundedRectCenteredAtGridComparison();
  add1PxStrokedRoundedRectCenteredAtPixelComparison();
  add1PxStrokedCircleCenteredAtGridComparison();
  add1PxStrokedCircleCenteredAtPixelComparison();
  addCenteredRoundedRectMixedOpaqueStrokeWidthsComparison();
  addCenteredRoundedRectMixedTransparentStrokeWidthsComparison();
  addThinRoundedRectsComparison();
  addEverythingTogetherComparison();
}