// Initialize when DOM is ready

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    addRenderComparisons();

    // Create navigation after all sections are added
    RenderComparison.createNavigation("Low level sw renderer tests");
  });
}

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
  addRandomLinesComparison();  // Random lines with various colors and thicknesses

  add1PxStrokedRectCenteredAtGridComparison();
  add1PxStrokedRectCenteredAtPixelComparison();

  // TODO to be renamed to show that the stroke can be thick
  // and that the stroke and fill are semi-transparent
  addSingleAxisAlignedRectangleComparison();
  addAxisAlignedRectanglesComparison();
  addRotatedRectanglesComparison();

  add1PxStrokedRoundedRectCenteredAtGridComparison();
  add1PxStrokedRoundedRectCenteredAtPixelComparison();
  addCenteredRoundedRectMixedOpaqueStrokeWidthsComparison();
  addCenteredRoundedRectMixedTransparentStrokeWidthsComparison();
  addThinRoundedRectsComparison();
  addAxisAlignedRoundedRectanglesComparison();
  addLargeTransparentRoundedRectanglesComparison();
  addNoStrokeRoundedRectanglesComparison();

  add1PxStrokedCircleCenteredAtGridComparison();
  add1PxStrokedCircleCenteredAtPixelComparison();
  addSingleRandomCircleComparison(); 
  addSingleNoStrokeCircleComparison(); // Test case for circles with no stroke
  addRandomPositionCircleComparison(); // Test case for randomly positioned circle with stroke
  addRandomPositionNoStrokeCircleComparison(); // Test case for randomly positioned circle without stroke
  addMultiplePreciseRandomCirclesComparison(); // Multiple precise pixel-aligned circles with strokes
  addMultiplePreciseNoStrokeCirclesComparison(); // Multiple precise pixel-aligned circles without strokes
  addOneRandomCircleComparison(); // Single circle using the simplified random circle generation
  addRandomCirclesComparison(); // Multiple circles using the simplified random circle generation
  
  addNinetyDegreeArcsComparison();
  addRandomArcsComparison();
  
  addEverythingTogetherComparison();
}
