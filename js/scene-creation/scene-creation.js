function checkCanvasHasEvenDimensions() {
  if (renderComparisonWidth % 2 !== 0 || renderComparisonHeight % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
}

function buildScene(shapes, log, currentExampleNumber) {
  addRandomLines(shapes, log, currentExampleNumber, 15); // also has its own comparison
  addAxisAlignedRectangles(shapes, log, currentExampleNumber, 5); // fine // also has its own comparison
  addRotatedRectangles(shapes, log, currentExampleNumber, 5); // fine // also has its own comparison
  addAxisAlignedRoundedRectangles(shapes, log, currentExampleNumber, 10); // fine // also has its own comparison
  addLargeTransparentRoundedRectangles(shapes, log, currentExampleNumber, 10); // fine // also has its own comparison
  addNoStrokeRoundedRectangles(shapes, log, currentExampleNumber, 10); // fine because there is no stroke, the fills positions are handled by getRectangularFillGeometry, which always forces the corner to be at a grid, and the width and height are integers so everything is OK. // also has its own comparison
  // addRotatedRoundedRectangles(shapes, log, 3); // TODO completely broken, "drawArcSWHelper" function is missing.
  addNinetyDegreeArcs(shapes, log, currentExampleNumber); // roughly fine.
  addRandomArcs(shapes, log, currentExampleNumber, 3); // roughly fine.
  addRandomCircles(shapes, log, currentExampleNumber, 5); // looks pretty horrible, but roughly fine.
  addThinOpaqueStrokeRoundedRectangles(shapes, log, currentExampleNumber, 10); // fine
}
