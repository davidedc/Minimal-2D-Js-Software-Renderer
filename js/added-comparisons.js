function addBlackLinesComparison(lineWidth) {
  return new RenderComparisonBuilder()
    .withId('thin-black-lines')
    .withTitle(`${lineWidth}px Black Lines`)
    .withDescription(`Tests rendering of multiple black lines of line width ${lineWidth}`)
    .addShapes(shapes => {
      addBlackLines(20, shapes, lineWidth);
      return null;
    })
    .build();
}

function addEverythingTogetherComparison() {
  return new RenderComparisonBuilder()
    .withId('all-shapes')
    .withTitle('All Shape Types Combined')
    .withDescription('Combines all shape types into a single scene to test overall rendering consistency')
    .addShapes(shapes => {
      buildScene(shapes);
      return null;
    })
    .build();
}

function addThinRoundedRectsComparison() {
  return new RenderComparisonBuilder()
    .withId('thin-rounded-rects')
    .withTitle('Multiple Thin-Stroke Rounded Rectangles')
    .withDescription('Tests rendering of multiple rounded rectangles with thin stroke widths')
    .addShapes(shapes => {
      addThinStrokeRoundedRectangles(10, shapes);
      return null;
    })
    .build();
}

function addCenteredRoundedRectComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-rounded-rect')
    .withTitle('Single Centered Rounded Rectangle')
    .withDescription('A single rounded rectangle with different stroke widths and colors')
    .addShapes(shapes => {
      addCenteredRoundedRect(shapes);
      return null;
    })
    .withColorCheckMiddleRow({ expectedUniqueColors: 2 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 2 })
    .build();
}

function add1PxStrokedRoundedRectCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-rounded-rect')
    .withTitle('Single 1px Stroked Rounded Rectangle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked rounded rectangle where the center is at a crossing in the grid')
    .addShapes(shapes => add1PxStrokeCenteredRoundedRectAtGrid(shapes))
    .withPlacementCheck()
    .build();
}

function add1PxStrokedRoundedRectCenteredAtPixelComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-rounded-rect')
    .withTitle('Single 1px Stroked Rounded Rectangle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked rounded rectangle where the center is in the middle of a pixel')
    .addShapes(shapes => add1PxStrokeCenteredRoundedRectAtPixel(shapes))
    .withPlacementCheck()
    .build();
}

function add2PxVerticalLineCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-2px-vertical-line')
    .withTitle('Single 2px Vertical Line centered at grid')
    .withDescription('Tests crisp rendering of a 2px vertical line')
    .addShapes(shapes => add2PxVerticalLineCenteredAtGrid(shapes))
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add1PxVerticalLineCenteredAtPixelComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-vertical-line')
    .withTitle('Single 1px Vertical Line centered at pixel')
    .withDescription('Tests crisp rendering of a 1px vertical line centered at pixel')
    .addShapes(shapes => add1PxVerticalLineCenteredAtPixel(shapes))
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add1PxHorizontalLineCenteredAtPixelComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-horizontal-line')
    .withTitle('Single 1px Horizontal Line centered at pixel')
    .withDescription('Tests crisp rendering of a 1px horizontal line centered at pixel')
    .addShapes(shapes => add1PxHorizontalLineCenteredAtPixel(shapes))
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add2PxHorizontalLineCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-2px-horizontal-line')
    .withTitle('Single 2px Horizontal Line centered at grid')
    .withDescription('Tests crisp rendering of a 2px horizontal line centered at grid')
    .addShapes(shapes => add2PxHorizontalLineCenteredAtGrid(shapes))
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}