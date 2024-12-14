function checkCanvasHasEvenDimensions() {
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }
}

function buildScene(shapes, log) {
  addRandomLines(shapes, log, 15);
  addAxisAlignedRectangles(shapes, log, 5);
  addRotatedRectangles(shapes, log, 5);
  addAxisAlignedRoundedRectangles(shapes, log, 10);
  addLargeTransparentRoundedRectangles(shapes, log, 10);
  addNoStrokeRoundedRectangles(shapes, log, 10);
  // addRotatedRoundedRectangles(shapes, log, 3);
  addNinetyDegreeArcs(shapes, log);
  addRandomArcs(shapes, log, 3);
  addRandomCircles(shapes, log, 5);
  addThinStrokeRoundedRectangles(shapes, log, 10);
}