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

/**
 * Utility function to calculate circle parameters with proper positioning and dimensions
 * @param {Object} options - Configuration options for circle creation
 * @param {number} options.minRadius - Minimum radius for the circle
 * @param {number} options.maxRadius - Maximum radius for the circle
 * @param {boolean} options.hasStroke - Whether the circle has a stroke
 * @param {number} options.minStrokeWidth - Minimum stroke width (if hasStroke is true)
 * @param {number} options.maxStrokeWidth - Maximum stroke width (if hasStroke is true)
 * @param {boolean} options.randomPosition - Whether to use random positioning
 * @param {number} options.marginX - Horizontal margin from canvas edges
 * @param {number} options.marginY - Vertical margin from canvas edges
 * @returns {Object} Calculated circle parameters
 */
function calculateCircleParameters(options) {
  const {
    minRadius = 8,
    maxRadius = 225,
    hasStroke = true,
    minStrokeWidth = 1,
    maxStrokeWidth = 30,
    randomPosition = false,
    marginX = 10,
    marginY = 10
  } = options;

  // Randomly choose between grid-centered and pixel-centered
  const atPixel = SeededRandom.getRandom() < 0.5;
  
  // Get initial center point
  let {centerX, centerY} = atPixel
    ? placeCloseToCenterAtPixel(renderComparisonWidth, renderComparisonHeight)
    : placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);
  
  // Calculate base diameter
  const diameter = Math.floor(minRadius * 2 + SeededRandom.getRandom() * (maxRadius * 2 - minRadius * 2));
  const baseRadius = diameter / 2;
  
  // Calculate stroke width
  const maxAllowedStrokeWidth = Math.floor(baseRadius / 1);
  const strokeWidth = hasStroke 
    ? (minStrokeWidth + Math.floor(SeededRandom.getRandom() * Math.min(maxStrokeWidth - minStrokeWidth + 1, maxAllowedStrokeWidth)))
    : 0;
  
  // Handle random positioning if requested
  if (randomPosition) {
    const totalRadius = baseRadius + (strokeWidth / 2);
    
    // Calculate safe bounds
    const minX = Math.ceil(totalRadius + marginX);
    const maxX = Math.floor(renderComparisonWidth - totalRadius - marginX);
    const minY = Math.ceil(totalRadius + marginY);
    const maxY = Math.floor(renderComparisonHeight - totalRadius - marginY);
    
    // Adjust diameter if circle is too large
    let adjustedDiameter = diameter;
    if (maxX <= minX || maxY <= minY) {
      // Circle is too large, reduce diameter to 1/4 of canvas size
      adjustedDiameter = Math.min(
        Math.floor(renderComparisonWidth / 4),
        Math.floor(renderComparisonHeight / 4)
      );
      
      // Recalculate bounds with reduced diameter
      const newTotalRadius = (adjustedDiameter / 2) + (strokeWidth / 2);
      const newMinX = Math.ceil(newTotalRadius + marginX);
      const newMaxX = Math.floor(renderComparisonWidth - newTotalRadius - marginX);
      const newMinY = Math.ceil(newTotalRadius + marginY);
      const newMaxY = Math.floor(renderComparisonHeight - newTotalRadius - marginY);
      
      // Generate random position within new safe bounds
      centerX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
      centerY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
    } else {
      // Generate random position within original safe bounds
      centerX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
      centerY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
    }
  }
  
  // Adjust dimensions for crisp rendering
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(
    diameter, diameter, strokeWidth, { x: centerX, y: centerY }
  );
  const adjustedDiameter = adjustedDimensions.width;
  const radius = adjustedDiameter / 2;
  
  return {
    centerX,
    centerY,
    radius,
    strokeWidth,
    adjustedDiameter,
    atPixel
  };
}

function createTestCircle(currentExampleNumber, hasStroke = true, randomPosition = false) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  checkCanvasHasEvenDimensions();
  
  const params = calculateCircleParameters({
    minRadius: 10,
    maxRadius: 225,
    hasStroke,
    minStrokeWidth: 1,
    maxStrokeWidth: 30,
    randomPosition,
    marginX: 10,
    marginY: 10
  });
  
  const { centerX, centerY, radius, strokeWidth, adjustedDiameter, atPixel } = params;
  
  const circle = {
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth,
    strokeColor: hasStroke ? getRandomColor(150, 230) : { r: 0, g: 0, b: 0, a: 0 },
    fillColor: getRandomColor(100, 200),
    startAngle: 0,
    endAngle: 360
  };
  
  // Calculate extremes for the circle
  const effectiveRadius = hasStroke ? (radius + strokeWidth / 2) : radius;
  
  const extremes = {
    leftX: Math.floor(circle.center.x - effectiveRadius),
    rightX: Math.floor(circle.center.x - effectiveRadius) + effectiveRadius * 2 - 1,
    topY: Math.floor(circle.center.y - effectiveRadius),
    bottomY: Math.floor(circle.center.y - effectiveRadius) + effectiveRadius * 2 - 1
  };
  
  return {
    circle,
    extremes,
    centerX,
    centerY,
    radius,
    strokeWidth,
    adjustedDiameter,
    atPixel
  };
}

function addSingleRandomCircle(shapes, log, currentExampleNumber) {
  const result = createTestCircle(currentExampleNumber, true, false);
  const { circle, extremes, centerX, centerY, radius, strokeWidth, adjustedDiameter, atPixel } = result;
  
  // Add the circle to shapes
  shapes.push(circle);
  
  // Log the circle details
  log.innerHTML += `&#x20DD; Single random circle at (${centerX}, ${centerY}) radius: ${radius} ` + 
                  `diameter: ${adjustedDiameter} strokeWidth: ${strokeWidth} ` +
                  `centered at: ${atPixel ? 'pixel' : 'grid'} ` + 
                  `strokeColor: ${colorToString(circle.strokeColor)} ` + 
                  `fillColor: ${colorToString(circle.fillColor)}<br>`;
  
  return extremes;
}

function addSingleNoStrokeCircle(shapes, log, currentExampleNumber) {
  const result = createTestCircle(currentExampleNumber, false, false);
  const { circle, extremes, centerX, centerY, radius, adjustedDiameter, atPixel } = result;
  
  // Add the circle to shapes
  shapes.push(circle);
  
  // Log the circle details
  log.innerHTML += `&#x20DD; Single circle with no stroke at (${centerX}, ${centerY}) radius: ${radius} ` + 
                  `diameter: ${adjustedDiameter} ` +
                  `centered at: ${atPixel ? 'pixel' : 'grid'} ` + 
                  `fillColor: ${colorToString(circle.fillColor)}<br>`;
  
  return extremes;
}

function addRandomPositionCircle(shapes, log, currentExampleNumber) {
  const result = createTestCircle(currentExampleNumber, true, true);
  const { circle, extremes, centerX, centerY, radius, strokeWidth, adjustedDiameter, atPixel } = result;
  
  // Add the circle to shapes
  shapes.push(circle);
  
  // Log the circle details
  log.innerHTML += `&#x20DD; Random position circle at (${centerX}, ${centerY}) radius: ${radius} ` + 
                  `diameter: ${adjustedDiameter} strokeWidth: ${strokeWidth} ` +
                  `centered at: ${atPixel ? 'pixel' : 'grid'} ` + 
                  `strokeColor: ${colorToString(circle.strokeColor)} ` + 
                  `fillColor: ${colorToString(circle.fillColor)}<br>`;
  
  return extremes;
}

function addRandomPositionNoStrokeCircle(shapes, log, currentExampleNumber) {
  const result = createTestCircle(currentExampleNumber, false, true);
  const { circle, extremes, centerX, centerY, radius, adjustedDiameter, atPixel } = result;
  
  // Add the circle to shapes
  shapes.push(circle);
  
  // Log the circle details
  log.innerHTML += `&#x20DD; Random position circle with no stroke at (${centerX}, ${centerY}) radius: ${radius} ` + 
                  `diameter: ${adjustedDiameter} ` +
                  `centered at: ${atPixel ? 'pixel' : 'grid'} ` + 
                  `fillColor: ${colorToString(circle.fillColor)}<br>`;
  
  return extremes;
}

/**
 * Helper function to generate multiple circles with simple random placement
 * @param {Array} shapes - Array to add shapes to
 * @param {HTMLElement} log - Log element to add descriptions
 * @param {number} count - Number of circles to create
 * @param {boolean} includeStrokes - Whether to include strokes on circles
 * @param {string} description - Description to log
 * @returns {void}
 */
function generateMultiplePreciseCircles(shapes, log, currentExampleNumber, count, includeStrokes, description) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  checkCanvasHasEvenDimensions();
  
  log.innerHTML += `${description} (${count} circles)<br>`;
  
  for (let i = 0; i < count; i++) {
    const params = calculateCircleParameters({
      minRadius: 8,
      maxRadius: 42,
      hasStroke: includeStrokes,
      minStrokeWidth: 1,
      maxStrokeWidth: 4,
      randomPosition: true,
      marginX: 60,
      marginY: 60
    });
    
    const { centerX, centerY, radius, strokeWidth, atPixel } = params;
    
    // Create the circle with distinct colors (using partitioning to ensure variety)
    const circle = {
      type: 'circle',
      center: { x: centerX, y: centerY },
      radius,
      strokeWidth,
      // If not including strokes, use transparent stroke color
      strokeColor: includeStrokes ? 
                  getRandomColor(200, 255, i, count) : 
                  { r: 0, g: 0, b: 0, a: 0 },
      // Use more opaque fills if no stroke to make them more visible
      fillColor: getRandomColor(includeStrokes ? 150 : 200, 
                              includeStrokes ? 200 : 255, 
                              count - i - 1, count),
      startAngle: 0,
      endAngle: 360
    };
    
    // Add the circle to shapes
    shapes.push(circle);
    
    // Log only the first few circles to avoid cluttering the log
    if (i < 3) {
      log.innerHTML += `&#x20DD; Circle ${i} at (${centerX}, ${centerY}) radius: ${radius} ` + 
                      (includeStrokes ? `strokeWidth: ${strokeWidth} ` : `no stroke `) +
                      `center type: ${atPixel ? 'pixel' : 'grid'} ` +
                      (includeStrokes ? `strokeColor: ${colorToString(circle.strokeColor)} ` : ``) +
                      `fillColor: ${colorToString(circle.fillColor)}<br>`;
    }
  }
  
  // Log message if we truncated the output
  if (count > 3) {
    log.innerHTML += `... and ${count - 3} more circles<br>`;
  }
}

/**
 * Add multiple precise random circles with strokes
 */
function addMultiplePreciseRandomCircles(shapes, log, currentExampleNumber, count = 10) {
  generateMultiplePreciseCircles(
    shapes, 
    log, 
    currentExampleNumber, 
    count, 
    true, 
    "Adding multiple precise random circles with strokes"
  );
}

/**
 * Add multiple precise random circles without strokes (fill only)
 */
function addMultiplePreciseNoStrokeCircles(shapes, log, currentExampleNumber, count = 10) {
  generateMultiplePreciseCircles(
    shapes, 
    log, 
    currentExampleNumber, 
    count, 
    false, 
    "Adding multiple precise random circles without strokes (fill only)"
  );
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
