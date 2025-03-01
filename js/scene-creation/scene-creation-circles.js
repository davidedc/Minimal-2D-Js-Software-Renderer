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
  
  const circle = getRandomCircle();
  
  // Ensure the circle is visible in the center area of the canvas
  circle.center = {
    x: Math.floor(renderComparisonWidth / 2 - 100 + SeededRandom.getRandom() * 200),
    y: Math.floor(renderComparisonHeight / 2 - 100 + SeededRandom.getRandom() * 200)
  };
  
  // Use a larger radius for better visibility
  circle.radius = Math.floor(30 + SeededRandom.getRandom() * 80);
  
  // Add the circle to shapes
  shapes.push(circle);
  
  // Log the circle details
  log.innerHTML += `&#x20DD; Single random circle at (${circle.center.x}, ${circle.center.y}) radius: ${circle.radius} strokeWidth: ${circle.strokeWidth} strokeColor: ${colorToString(circle.strokeColor)} fillColor: ${colorToString(circle.fillColor)}<br>`;
  
  // Calculate and return extremes for the circle
  // The extremes are the bounding box of the circle
  const strokeHalfWidth = circle.strokeWidth / 2;
  const totalRadius = circle.radius + strokeHalfWidth;
  
  return {
    leftX: Math.floor(circle.center.x - totalRadius),
    rightX: Math.ceil(circle.center.x + totalRadius),
    topY: Math.floor(circle.center.y - totalRadius),
    bottomY: Math.ceil(circle.center.y + totalRadius)
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
