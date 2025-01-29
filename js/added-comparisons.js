function addBlackLinesComparison(lineWidth) {
  return new RenderComparisonBuilder()
    .withId('thin-black-lines')
    .withTitle(`${lineWidth}px Black Lines`)
    .withDescription(`Tests rendering of multiple black lines of line width ${lineWidth}`)
    .addShapes(addBlackLines, lineWidth, 20)
    .build();
}

function addEverythingTogetherComparison() {
  return new RenderComparisonBuilder()
    .withId('all-shapes')
    .withTitle('All Shape Types Combined')
    .withDescription('Combines all shape types into a single scene to test overall rendering consistency')
    .addShapes(buildScene)
    .build();
}

function addThinRoundedRectsComparison() {
  return new RenderComparisonBuilder()
    .withId('thin-rounded-rects')
    .withTitle('10 thin-opaque-stroke rounded rectangles (line width 1px)')
    .withDescription('Tests rendering of 10 rounded rectangles with thin stroke widths (line width 1px)')
    .addShapes(addThinOpaqueStrokeRoundedRectangles, 10)
    .build();
}

function addCenteredRoundedRectMixedOpaqueStrokeWidthsComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-rounded-rect')
    .withTitle('Single Centered Rounded Rectangle of different stroke widths - opaque stroke - centered at grid')
    .withDescription('A single rounded rectangle with different stroke widths and colors, centered at a grid crossing')
    .addShapes(addCenteredRoundedRectOpaqueStrokesRandomStrokeWidth)
    .withColorCheckMiddleRow({ expectedUniqueColors: 2 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 2 })
    .withSpecklesCheck()
    .build();
}

function addCenteredRoundedRectMixedTransparentStrokeWidthsComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-rounded-rect-transparent')
    .withTitle('Single Centered Rounded Rectangle - semi-transparent stroke and fill')
    .withDescription('A single rounded rectangle with different stroke widths and semi-transparent colors, centered at a grid crossing')
    .addShapes(addCenteredRoundedRectTransparentStrokesRandomStrokeWidth)
    .withColorCheckMiddleRow({ expectedUniqueColors: 3 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 3 })
    .withSpecklesCheck()
    .build();
}

function add1PxStrokedRoundedRectCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-rounded-rect')
    .withTitle('Single 1px Stroked Rounded Rectangle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked rounded rectangle where the center is at a crossing in the grid')
    .addShapes(add1PxStrokeCenteredRoundedRectAtGrid)
    .withExtremesCheck()
    .build();
}

function add1PxStrokedRoundedRectCenteredAtPixelComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-rounded-rect')
    .withTitle('Single 1px Stroked Rounded Rectangle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked rounded rectangle where the center is in the middle of a pixel')
    .addShapes(add1PxStrokeCenteredRoundedRectAtPixel)
    .withExtremesCheck()
    .build();
}

function add2PxVerticalLineCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-2px-vertical-line')
    .withTitle('Single 2px Vertical Line centered at grid')
    .withDescription('Tests crisp rendering of a 2px vertical line')
    .addShapes(add2PxVerticalLineCenteredAtGrid)
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
    .addShapes(add1PxVerticalLineCenteredAtPixel)
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
    .addShapes(add1PxHorizontalLineCenteredAtPixel)
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
    .addShapes(add2PxHorizontalLineCenteredAtGrid)
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add1PxStrokedRectCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-rect')
    .withTitle('Single 1px Stroked Rectangle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked rectangle where the center is at a crossing in the grid')
    .addShapes(add1PxStrokeCenteredRectAtGrid)
    .withExtremesCheck()
    .build();
}

function add1PxStrokedRectCenteredAtPixelComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-rect')
    .withTitle('Single 1px Stroked Rectangle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked rectangle where the center is in the middle of a pixel')
    .addShapes(add1PxStrokeCenteredRectAtPixel)
    .withExtremesCheck()
    .build();
}