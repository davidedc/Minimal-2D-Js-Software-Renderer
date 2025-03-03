function getRandomCircle() {
  return {
      ...getRandomArc(),
      type: 'circle',
      startAngle: 0,
      endAngle: 360
  };
}

function addRandomCircles(shapes, log, currentExampleNumber, count = 5) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  for (let i = 0; i < count; i++) {
    const circle = getRandomCircle();
    shapes.push(circle);
    log.innerHTML += `&#x20DD; Random circle at (${circle.center.x}, ${circle.center.y}) radius: ${circle.radius} strokeWidth: ${circle.strokeWidth} strokeColor: ${colorToString(circle.strokeColor)} fillColor: ${colorToString(circle.fillColor)}<br>`;
  }
}


function addSingleRandomCircle(shapes, log, currentExampleNumber) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  
  // Ensure canvas dimensions are even for proper alignment
  checkCanvasHasEvenDimensions();
  
  // Randomly choose between grid-centered and pixel-centered
  const atPixel = SeededRandom.getRandom() < 0.5;
  
  // Get a center point (either at grid or at pixel)
  const {centerX, centerY} = atPixel
    ? placeCloseToCenterAtPixel(renderComparisonWidth, renderComparisonHeight)
    : placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);
  
  // Generate a random stroke width (integer value)
  const strokeWidth = 1 + Math.floor(SeededRandom.getRandom() * 4);
  
  // Generate a random diameter (similar range as the 1px test cases)
  let diameter = Math.floor(20 + SeededRandom.getRandom() * 130);
  
  // Adjust the diameter for crisp stroke rendering
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, strokeWidth, { x: centerX, y: centerY });
  const adjustedDiameter = adjustedDimensions.width; // width equals height for circle
  const radius = adjustedDiameter / 2;
  
  // Create the circle with the calculated parameters
  const circle = {
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth,
    strokeColor: getRandomColor(100, 200), // Red stroke for visibility
    fillColor: getRandomColor(100, 200), // Random semi-transparent fill
    startAngle: 0,
    endAngle: 360
  };
  
  // Add the circle to shapes
  shapes.push(circle);
  
  // Log the circle details
  log.innerHTML += `&#x20DD; Single random circle at (${centerX}, ${centerY}) radius: ${radius} ` + 
                  `diameter: ${adjustedDiameter} strokeWidth: ${strokeWidth} ` +
                  `centered at: ${atPixel ? 'pixel' : 'grid'} ` + 
                  `strokeColor: ${colorToString(circle.strokeColor)} ` + 
                  `fillColor: ${colorToString(circle.fillColor)}<br>`;
  
  // Calculate and return extremes for the circle
  // For properly aligned circles, the extremes should be integer values
  // Subtracting 0.5 from the extremes calculation to match the pixel bounds
  // as done in the add1PxStrokeCircle functions
  const totalRadius = radius + strokeWidth / 2;
  
  return {
    leftX: Math.floor(circle.center.x - totalRadius),
    rightX: Math.floor(circle.center.x - totalRadius) + totalRadius * 2 - 1,
    topY: Math.floor(circle.center.y - totalRadius),
    bottomY: Math.floor(circle.center.y - totalRadius) + totalRadius * 2 - 1
  };
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at grid
function add1PxStrokeCenteredCircleAtGrid(shapes, log, currentExampleNumber) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  // Ensure canvas dimensions are even for proper grid alignment
  checkCanvasHasEvenDimensions();

  const { centerX, centerY } = placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);

  // Generate a random diameter (similar range as the rectangle dimensions)
  let diameter = Math.floor(20 + SeededRandom.getRandom() * 130);
  // Adjust the diameter for crisp stroke rendering (both width and height are the same)
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, 1, { x: centerX, y: centerY });
  const adjustedDiameter = adjustedDimensions.width; // (equals height)
  const radius = adjustedDiameter / 2;

  // Create the circle shape with a 1px stroke (red stroke, transparent fill)
  shapes.push({
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 },
    startAngle: 0,
    endAngle: 360
  });

  log.innerHTML += `&#x20DD; 1px stroke centered circle at: (${centerX}, ${centerY}) diameter: ${adjustedDiameter} radius: ${radius}`;
  
  const leftX = centerX - radius - 0.5;
  const rightX = centerX + radius - 0.5;
  const topY = centerY - radius - 0.5;
  const bottomY = centerY + radius - 0.5;

  return { leftX, rightX, topY, bottomY };
}

// ----------------------------------------------------------------------
// Single 1px Stroked Circle centered at pixel
function add1PxStrokeCenteredCircleAtPixel(shapes, log, currentExampleNumber) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  // Ensure canvas dimensions are even for proper pixel alignment
  checkCanvasHasEvenDimensions();

  // Replace direct calculation with new function
  const { centerX, centerY } = placeCloseToCenterAtPixel(renderComparisonWidth, renderComparisonHeight);

  // Generate a random diameter (similar range as the rectangle dimensions)
  let diameter = Math.floor(20 + SeededRandom.getRandom() * 130);
  // Adjust the diameter for crisp stroke rendering (both width and height are the same)
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(diameter, diameter, 1, { x: centerX, y: centerY });
  const adjustedDiameter = adjustedDimensions.width; // (width equals height)
  const radius = adjustedDiameter / 2;

  // Create the circle shape with a 1px stroke (red stroke, transparent fill)
  shapes.push({
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 },
    startAngle: 0,
    endAngle: 360
  });

  log.innerHTML += `&#x20DD; 1px stroke centered circle at: (${centerX}, ${centerY}) diameter: ${adjustedDiameter} radius: ${radius}`;

  const leftX = centerX - radius - 0.5;
  const rightX = centerX + radius - 0.5;
  const topY = centerY - radius - 0.5;
  const bottomY = centerY + radius - 0.5;

  return { leftX, rightX, topY, bottomY };
}
