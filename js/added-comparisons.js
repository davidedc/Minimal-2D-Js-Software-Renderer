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
    .withSpecklesCheckOnSwCanvas()
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
    .withSpecklesCheckOnSwCanvas()
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

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at grid
function add1PxStrokedCircleCenteredAtGridComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-circle')
    .withTitle('Single 1px Stroked Circle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked circle where the center is at a crossing in the grid')
    .addShapes(add1PxStrokeCenteredCircleAtGrid)
    // Adding a tolerance because for some strange reason, at least in Safari, the canvas render overflows
    // the drawing of the stroke ever so slightly (completely invisible to the human eye, but it is there).
    .withExtremesCheck(0.03)
    .build();
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at pixel
function add1PxStrokedCircleCenteredAtPixelComparison() {
  return new RenderComparisonBuilder()
    .withId('centered-1px-circle-pixel')
    .withTitle('Single 1px Stroked Circle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked circle where the center is in the middle of a pixel')
    .addShapes(add1PxStrokeCenteredCircleAtPixel)
    // Adding a tolerance because for some strange reason, at least in Safari, the canvas render overflows
    // the drawing of the stroke ever so slightly (completely invisible to the human eye, but it is there).
    .withExtremesCheck(0.03)
    .build();
}

function addSingleAxisAlignedRectangleComparison() {
  return new RenderComparisonBuilder()
    .withId('single-axis-aligned-rectangle')
    .withTitle('Single Axis-Aligned Rectangle')
    .withDescription('Tests rendering of a single axis-aligned rectangle with random stroke width and semi-transparent colors')
    .addShapes(addAxisAlignedRectangles, 1)  // Using just 1 rectangle
    .withExtremesCheck()
    .compareWithThreshold(3, 1)  // Compare with RGB and alpha thresholds of 1
    .build();
}

function addAxisAlignedRectanglesComparison() {
  return new RenderComparisonBuilder()
    .withId('axis-aligned-rectangles')
    .withTitle('Axis-Aligned Rectangles')
    .withDescription('Tests rendering of multiple axis-aligned rectangles with random positions, sizes, and colors')
    .addShapes(addAxisAlignedRectangles, 10)  // Using 10 rectangles instead of the default 5
    .withExtremesCheck()
    .build();
}

function addRotatedRectanglesComparison() {
  return new RenderComparisonBuilder()
    .withId('rotated-rectangles')
    .withTitle('Rotated Rectangles')
    .withDescription('Tests rendering of multiple rotated rectangles with random positions, sizes, angles, and colors')
    .addShapes(addRotatedRectangles, 5)  // Using default count of 5 rectangles
    .build();
}

function addRandomLinesComparison() {
  return new RenderComparisonBuilder()
    .withId('random-lines')
    .withTitle('Random Lines')
    .withDescription('Tests rendering of multiple lines with random positions, thickness, and colors')
    .addShapes(addRandomLines, 15)  // Using 15 lines
    .build();
}

function addAxisAlignedRoundedRectanglesComparison() {
  return new RenderComparisonBuilder()
    .withId('axis-aligned-rounded-rectangles')
    .withTitle('Axis-Aligned Rounded Rectangles')
    .withDescription('Tests rendering of multiple axis-aligned rounded rectangles with random positions, sizes, and corner radii')
    .addShapes(addAxisAlignedRoundedRectangles, 8)  // Using 8 rounded rectangles
    .withExtremesCheck()
    .build();
}

function addLargeTransparentRoundedRectanglesComparison() {
  return new RenderComparisonBuilder()
    .withId('large-transparent-rounded-rectangles')
    .withTitle('Large Transparent Rounded Rectangles')
    .withDescription('Tests rendering of large rounded rectangles with transparent strokes and random colors')
    .addShapes(addLargeTransparentRoundedRectangles, 6)  // Using 6 large transparent rounded rectangles
    .build();
}

function addNoStrokeRoundedRectanglesComparison() {
  return new RenderComparisonBuilder()
    .withId('no-stroke-rounded-rectangles')
    .withTitle('Rounded Rectangles Without Stroke')
    .withDescription('Tests rendering of rounded rectangles with no stroke, only fill')
    .addShapes(addNoStrokeRoundedRectangles, 8)  // Using 8 rectangles with no stroke
    .build();
}