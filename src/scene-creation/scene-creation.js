function checkCanvasHasEvenDimensions() {
  if (renderTestWidth % 2 !== 0 || renderTestHeight % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
}

// adds many shapes.
function buildScene(shapes, log, currentIterationNumber) {
  addRandomLines(shapes, log, currentIterationNumber, 15);
  addAxisAlignedRectangles(shapes, log, currentIterationNumber, 5);
  addRotatedRectangles(shapes, log, currentIterationNumber, 5);
  addAxisAlignedRoundedRectangles(shapes, log, currentIterationNumber, 10);
  addLargeTransparentRoundedRectangles(shapes, log, currentIterationNumber, 10);
  addNoStrokeRoundedRectangles(shapes, log, currentIterationNumber, 10); // fine because there is no stroke, the fills positions are handled by getRectangularFillGeometry, which always forces the corner to be at a grid, and the width and height are integers so everything is OK.
  // addRotatedRoundedRectangles(shapes, log, 3); // TODO completely broken, "drawArcSWHelper" function is missing.
  addNinetyDegreeArcs(shapes, log, currentIterationNumber); // roughly fine.
  addRandomArcs(shapes, log, currentIterationNumber, 3); // roughly fine.
  addRandomCircles(shapes, log, currentIterationNumber, 5); // looks pretty horrible, but roughly fine.
  addThinOpaqueStrokeRoundedRectangles(shapes, log, currentIterationNumber, 10);
}