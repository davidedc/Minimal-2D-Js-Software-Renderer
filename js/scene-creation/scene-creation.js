function checkCanvasHasEvenDimensions() {
  if (renderComparisonWidth % 2 !== 0 || renderComparisonHeight % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
}

function buildScene(shapes, log) {
  addRandomLines(shapes, log, 15);
  addAxisAlignedRectangles(shapes, log, 5); // TODO needs to be fixed
  addRotatedRectangles(shapes, log, 5); // fine
  addAxisAlignedRoundedRectangles(shapes, log, 10); // TODO needs tweaking of centers to get strokes to be crisp
  addLargeTransparentRoundedRectangles(shapes, log, 10); // TODO needs tweaking of centers to get strokes to be crisp
  addNoStrokeRoundedRectangles(shapes, log, 10); // fine because there is no stroke, the fills positions are handled by getCornerBasedRepresentation, which always forces the corner to be at a grid, and the width and height are integers so everything is OK.
  // addRotatedRoundedRectangles(shapes, log, 3); // TODO completely broken, "drawArcSWHelper" function is missing.
  addNinetyDegreeArcs(shapes, log); // roughly fine.
  addRandomArcs(shapes, log, 3); // roughly fine.
  addRandomCircles(shapes, log, 5); // looks pretty horrible, but roughly fine.
  addThinStrokeRoundedRectangles(shapes, log, 10); // fine
}
