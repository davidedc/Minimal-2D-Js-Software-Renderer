function loadLowLevelRenderTests() {
  add1PxHorizontalLineCenteredAtPixelTest();
  add1PxVerticalLineCenteredAtPixelTest();
  add2PxHorizontalLineCenteredAtGridTest();
  add2PxVerticalLineCenteredAtGridTest();

  addBlackLinesTest(1);  // 1px lines
  addBlackLinesTest(2);  // 2px lines
  addBlackLinesTest(3);  // 3px lines
  addBlackLinesTest(5);  // 5px lines
  addBlackLinesTest(10); // 10px lines
  addRandomLinesTest();  // Random lines with various colors and thicknesses

  add1PxStrokedRectCenteredAtGridTest();
  add1PxStrokedRectCenteredAtPixelTest();

  // TODO to be renamed to show that the stroke can be thick
  // and that the stroke and fill are semi-transparent
  addSingleAxisAlignedRectangleTest();
  addAxisAlignedRectanglesTest();
  addRotatedRectanglesTest();

  add1PxStrokedRoundedRectCenteredAtGridTest();
  add1PxStrokedRoundedRectCenteredAtPixelTest();
  addCenteredRoundedRectMixedOpaqueStrokeWidthsTest();
  addCenteredRoundedRectMixedTransparentStrokeWidthsTest();
  addThinRoundedRectsTest();
  addAxisAlignedRoundedRectanglesTest();
  addLargeTransparentRoundedRectanglesTest();
  addNoStrokeRoundedRectanglesTest();

  add1PxStrokedCircleCenteredAtGridTest();
  add1PxStrokedCircleCenteredAtPixelTest();
  addSingleRandomCircleTest(); 
  addSingleNoStrokeCircleTest(); // Test case for circles with no stroke
  addRandomPositionCircleTest(); // Test case for randomly positioned circle with stroke
  addRandomPositionNoStrokeCircleTest(); // Test case for randomly positioned circle without stroke
  addMultiplePreciseRandomCirclesTest(); // Multiple precise pixel-aligned circles with strokes
  addMultiplePreciseNoStrokeCirclesTest(); // Multiple precise pixel-aligned circles without strokes
  addOneRandomCircleTest(); // Single circle using the simplified random circle generation
  addRandomCirclesTest(); // Multiple circles using the simplified random circle generation
  
  addNinetyDegreeArcsTest();
  addRandomArcsTest();
  
  addEverythingTogetherTest();
}
