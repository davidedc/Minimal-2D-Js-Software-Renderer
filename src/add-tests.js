function addBlackLinesTest(lineWidth) {
  return new RenderTestBuilder()
    .withId('thin-black-lines-' + lineWidth)
    .withTitle(`${lineWidth}px Black Lines`)
    .withDescription(`Tests rendering of multiple black lines of line width ${lineWidth}`)
    .addShapes(addBlackLines, lineWidth, 20)
    .build();
}

function addEverythingTogetherTest() {
  return new RenderTestBuilder()
    .withId('all-shapes')
    .withTitle('All Shape Types Combined')
    .withDescription('Combines all shape types into a single scene to test overall rendering consistency')
    .addShapes(buildScene)
    .build();
}

function addThinRoundedRectsTest() {
  return new RenderTestBuilder()
    .withId('thin-rounded-rects')
    .withTitle('10 thin-opaque-stroke rounded rectangles (line width 1px)')
    .withDescription('Tests rendering of 10 rounded rectangles with thin stroke widths (line width 1px)')
    .addShapes(addThinOpaqueStrokeRoundedRectangles, 10)
    .build();
}

function addCenteredRoundedRectMixedOpaqueStrokeWidthsTest() {
  return new RenderTestBuilder()
    .withId('centered-rounded-rect')
    .withTitle('Single Centered Rounded Rectangle of different stroke widths - opaque stroke - centered at grid')
    .withDescription('A single rounded rectangle with different stroke widths and colors, centered at a grid crossing')
    .addShapes(addCenteredRoundedRectOpaqueStrokesRandomStrokeWidth)
    .withColorCheckMiddleRow({ expectedUniqueColors: 2 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 2 })
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function addCenteredRoundedRectMixedTransparentStrokeWidthsTest() {
  return new RenderTestBuilder()
    .withId('centered-rounded-rect-transparent')
    .withTitle('Single Centered Rounded Rectangle - semi-transparent stroke and fill')
    .withDescription('A single rounded rectangle with different stroke widths and semi-transparent colors, centered at a grid crossing')
    .addShapes(addCenteredRoundedRectTransparentStrokesRandomStrokeWidth)
    .withColorCheckMiddleRow({ expectedUniqueColors: 3 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 3 })
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function add1PxStrokedRoundedRectCenteredAtGridTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-rounded-rect')
    .withTitle('Single 1px Stroked Rounded Rectangle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked rounded rectangle where the center is at a crossing in the grid')
    .addShapes(add1PxStrokeCenteredRoundedRectAtGrid)
    .withExtremesCheck()
    .build();
}

function add1PxStrokedRoundedRectCenteredAtPixelTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-rounded-rect')
    .withTitle('Single 1px Stroked Rounded Rectangle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked rounded rectangle where the center is in the middle of a pixel')
    .addShapes(add1PxStrokeCenteredRoundedRectAtPixel)
    .withExtremesCheck()
    .build();
}

function add2PxVerticalLineCenteredAtGridTest() {
  return new RenderTestBuilder()
    .withId('centered-2px-vertical-line')
    .withTitle('Single 2px Vertical Line centered at grid')
    .withDescription('Tests crisp rendering of a 2px vertical line')
    .addShapes(add2PxVerticalLineCenteredAtGrid)
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add1PxVerticalLineCenteredAtPixelTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-vertical-line')
    .withTitle('Single 1px Vertical Line centered at pixel')
    .withDescription('Tests crisp rendering of a 1px vertical line centered at pixel')
    .addShapes(add1PxVerticalLineCenteredAtPixel)
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add1PxHorizontalLineCenteredAtPixelTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-horizontal-line')
    .withTitle('Single 1px Horizontal Line centered at pixel')
    .withDescription('Tests crisp rendering of a 1px horizontal line centered at pixel')
    .addShapes(add1PxHorizontalLineCenteredAtPixel)
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add2PxHorizontalLineCenteredAtGridTest() {
  return new RenderTestBuilder()
    .withId('centered-2px-horizontal-line')
    .withTitle('Single 2px Horizontal Line centered at grid')
    .withDescription('Tests crisp rendering of a 2px horizontal line centered at grid')
    .addShapes(add2PxHorizontalLineCenteredAtGrid)
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 })
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 })
    .withExtremesCheck()
    .build();
}

function add1PxStrokedRectCenteredAtGridTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-rect')
    .withTitle('Single 1px Stroked Rectangle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked rectangle where the center is at a crossing in the grid')
    .addShapes(add1PxStrokeCenteredRectAtGrid)
    .withExtremesCheck()
    .build();
}

function add1PxStrokedRectCenteredAtPixelTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-rect')
    .withTitle('Single 1px Stroked Rectangle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked rectangle where the center is in the middle of a pixel')
    .addShapes(add1PxStrokeCenteredRectAtPixel)
    .withExtremesCheck()
    .build();
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at grid
function add1PxStrokedCircleCenteredAtGridTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-circle')
    .withTitle('Single 1px Stroked Circle centered at grid')
    .withDescription('Tests crisp rendering of a 1px stroked circle where the center is at a crossing in the grid')
    .addShapes(add1PxStrokeCenteredCircleAtGrid)
    // Adding a tolerance because for some strange reason, at least in Safari, the canvas render overflows
    // the drawing of the stroke ever so slightly (completely invisible to the human eye, but it is there).
    .withExtremesCheck(0.03)
    .withNoGapsInStrokeEdgesCheck() // Check that the stroke has no gaps
    .withUniqueColorsCheck(1) // Check that there's exactly one unique color
    .build();
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at pixel
function add1PxStrokedCircleCenteredAtPixelTest() {
  return new RenderTestBuilder()
    .withId('centered-1px-circle-pixel')
    .withTitle('Single 1px Stroked Circle centered at pixel')
    .withDescription('Tests crisp rendering of a 1px stroked circle where the center is in the middle of a pixel')
    .addShapes(add1PxStrokeCenteredCircleAtPixel)
    // Adding a tolerance because for some strange reason, at least in Safari, the canvas render overflows
    // the drawing of the stroke ever so slightly (completely invisible to the human eye, but it is there).
    .withExtremesCheck(0.03)
    .withNoGapsInStrokeEdgesCheck() // Check that the stroke has no gaps
    .withUniqueColorsCheck(1) // Check that there's exactly one unique color
    .build();
}

function addSingleAxisAlignedRectangleTest() {
  return new RenderTestBuilder()
    .withId('single-axis-aligned-rectangle')
    .withTitle('Single Axis-Aligned Rectangle')
    .withDescription('Tests rendering of a single axis-aligned rectangle with random stroke width and semi-transparent colors')
    .addShapes(addAxisAlignedRectangles, 1)  // Using just 1 rectangle
    .withExtremesCheck()
    .compareWithThreshold(3, 1)  // Compare with RGB and alpha thresholds of 1
    .build();
}

function addAxisAlignedRectanglesTest() {
  return new RenderTestBuilder()
    .withId('axis-aligned-rectangles')
    .withTitle('Axis-Aligned Rectangles')
    .withDescription('Tests rendering of multiple axis-aligned rectangles with random positions, sizes, and colors')
    .addShapes(addAxisAlignedRectangles, 10)  // Using 10 rectangles instead of the default 5
    .withExtremesCheck()
    .build();
}

function addRotatedRectanglesTest() {
  return new RenderTestBuilder()
    .withId('rotated-rectangles')
    .withTitle('Rotated Rectangles')
    .withDescription('Tests rendering of multiple rotated rectangles with random positions, sizes, angles, and colors')
    .addShapes(addRotatedRectangles, 5)  // Using default count of 5 rectangles
    .build();
}

function addRandomLinesTest() {
  return new RenderTestBuilder()
    .withId('random-lines')
    .withTitle('Random Lines')
    .withDescription('Tests rendering of multiple lines with random positions, thickness, and colors')
    .addShapes(addRandomLines, 15)  // Using 15 lines
    .build();
}

function addAxisAlignedRoundedRectanglesTest() {
  return new RenderTestBuilder()
    .withId('axis-aligned-rounded-rectangles')
    .withTitle('Axis-Aligned Rounded Rectangles')
    .withDescription('Tests rendering of multiple axis-aligned rounded rectangles with random positions, sizes, and corner radii')
    .addShapes(addAxisAlignedRoundedRectangles, 8)  // Using 8 rounded rectangles
    .build();
}

function addLargeTransparentRoundedRectanglesTest() {
  return new RenderTestBuilder()
    .withId('large-transparent-rounded-rectangles')
    .withTitle('Large Transparent Rounded Rectangles')
    .withDescription('Tests rendering of large rounded rectangles with transparent strokes and random colors')
    .addShapes(addLargeTransparentRoundedRectangles, 6)  // Using 6 large transparent rounded rectangles
    .build();
}

function addNoStrokeRoundedRectanglesTest() {
  return new RenderTestBuilder()
    .withId('no-stroke-rounded-rectangles')
    .withTitle('Rounded Rectangles Without Stroke')
    .withDescription('Tests rendering of rounded rectangles with no stroke, only fill')
    .addShapes(addNoStrokeRoundedRectangles, 8)  // Using 8 rectangles with no stroke
    .build();
}

function addNinetyDegreeArcsTest() {
  return new RenderTestBuilder()
    .withId('ninety-degree-arcs')
    .withTitle('90\u00B0 Arcs')
    .withDescription('Tests rendering of 90\u00B0 arcs with various radii and stroke widths')
    .addShapes(addNinetyDegreeArcs)
    .build();
}

function addRandomArcsTest() {
  return new RenderTestBuilder()
    .withId('random-arcs')
    .withTitle('Random Arcs')
    .withDescription('Tests rendering of arcs with random positions, angles, and colors')
    .addShapes(addRandomArcs, 5)  // Using 5 random arcs
    .build();
}

function addRandomCirclesTest() {
  return new RenderTestBuilder()
    .withId('random-circles')
    .withTitle('Random Circles')
    .withDescription('Tests rendering of circles with random positions, sizes, and colors')
    .addShapes(addRandomCircles, 8)  // Using 8 random circles
    .build();
}

function addOneRandomCircleTest() {
  return new RenderTestBuilder()
    .withId('one-random-circle')
    .withTitle('One Random Circle')
    .withDescription('Tests rendering of a single circle with random position, size, and colors')
    .addShapes(addOneRandomCircle)  // Using the new function for a single random circle
    // we don't check the extremes because they are almost always going to differ
    // since the circle is at random coordinates and with random radius and stroke width,
    // this means that it will be drawn in some random position with aliasing in the canvas,
    // and crisply in some approximated "snapped" position by the sw renderer, so
    // of course they are not going to match, nor their extremes.
    //.withExtremesCheck(0.03)
    .withNoGapsInStrokeEdgesCheck()  // Check that the stroke has no gaps
    .withUniqueColorsCheck(3)  // Check for fill, stroke, and blended edge colors
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function addSingleRandomCircleTest() {
  return new RenderTestBuilder()
    .withId('single-random-circle')
    .withTitle('Single Random Circle')
    .withDescription('Tests rendering of a single random circle with proper pixel alignment for crisp stroke rendering')
    .addShapes(addSingleRandomCircle)  // Using the updated function that returns extremes
    .withExtremesCheck(0.03)  // Same tolerance as the 1px circle tests
    .withNoGapsInStrokeEdgesCheck() // Check that the stroke has no gaps
    .withUniqueColorsCheck(3)  // Check that there are exactly three unique colors (fill, stroke, and blended edge)
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function addSingleNoStrokeCircleTest() {
  return new RenderTestBuilder()
    .withId('single-no-stroke-circle')
    .withTitle('Single Circle Without Stroke')
    .withDescription('Tests rendering of a single circle with no stroke, only fill, to validate fill accuracy')
    .addShapes(addSingleNoStrokeCircle)  // Using the no-stroke version
    .withExtremesCheck(0.03)  // Same tolerance as the circle tests
    .withNoGapsInFillEdgesCheck()  // Check that the fill has no gaps
    .withUniqueColorsCheck(1)  // Check that there's exactly one unique color
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function addRandomPositionCircleTest() {
  return new RenderTestBuilder()
    .withId('random-position-circle')
    .withTitle('Randomly Positioned Circle With Stroke')
    .withDescription('Tests rendering of a single circle at a random position with proper pixel alignment and crisp stroke rendering')
    .addShapes(addRandomPositionCircle)  // Using the random position version
    .withExtremesCheck(0.03)  // Same tolerance as the circle tests
    .withNoGapsInStrokeEdgesCheck()  // Check that the stroke has no gaps
    .withUniqueColorsCheck(3)  // Check that there are exactly three unique colors (fill, stroke, and blended edge)
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function addRandomPositionNoStrokeCircleTest() {
  return new RenderTestBuilder()
    .withId('random-position-no-stroke-circle')
    .withTitle('Randomly Positioned Circle Without Stroke')
    .withDescription('Tests rendering of a single circle at a random position with no stroke, only fill, to validate fill accuracy at any location')
    .addShapes(addRandomPositionNoStrokeCircle)  // Using the random position no-stroke version
    .withExtremesCheck(0.03)  // Same tolerance as the circle tests
    .withNoGapsInFillEdgesCheck()  // Check that the fill has no gaps
    .withUniqueColorsCheck(1)  // Check that there's exactly one unique color
    .withSpecklesCheckOnSwCanvas()
    .build();
}

function addMultiplePreciseRandomCirclesTest() {
  return new RenderTestBuilder()
    .withId('multiple-precise-random-circles')
    .withTitle('Multiple Precise Random Circles')
    .withDescription('Tests rendering of multiple circles with precise pixel alignment, varied strokes and fills')
    .addShapes(addMultiplePreciseRandomCircles, 12)  // Create 12 circles
    .build();
}

function addMultiplePreciseNoStrokeCirclesTest() {
  return new RenderTestBuilder()
    .withId('multiple-precise-no-stroke-circles')
    .withTitle('Multiple Precise Fill-Only Circles')
    .withDescription('Tests rendering of multiple circles with no strokes, only fills, to validate the fill algorithm')
    .addShapes(addMultiplePreciseNoStrokeCircles, 12)  // Create 12 circles
    .build();
}