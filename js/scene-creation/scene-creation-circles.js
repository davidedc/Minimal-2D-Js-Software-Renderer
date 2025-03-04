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
 * Helper function to create a circle with calculated parameters
 * Can be used for both stroke and no-stroke circles, and allows for random position offsets
 */
function createTestCircle(currentExampleNumber, hasStroke = true, randomPosition = false) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  
  // Ensure canvas dimensions are even for proper alignment
  checkCanvasHasEvenDimensions();
  
  // Randomly choose between grid-centered and pixel-centered
  const atPixel = SeededRandom.getRandom() < 0.5;
  
  // Get a center point (either at grid or at pixel)
  let {centerX, centerY} = atPixel
    ? placeCloseToCenterAtPixel(renderComparisonWidth, renderComparisonHeight)
    : placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);
  
  // Initialize stroke width and diameter
  const strokeWidth = hasStroke ? (1 + Math.floor(SeededRandom.getRandom() * 30)) : 0;
  let diameter = Math.floor(20 + SeededRandom.getRandom() * 450);
  
  // Apply random position offset if requested
  if (randomPosition) {
    // Pre-calculate approximate radius (this is an estimation before adjustment)
    const estimatedRadius = diameter / 2;
    // Calculate the total radius including stroke
    const totalRadius = estimatedRadius + (strokeWidth / 2);
    
    // Calculate safe bounds to ensure circle stays completely inside canvas
    const minX = Math.ceil(totalRadius + 10); // +10 for extra safety margin
    const maxX = Math.floor(renderComparisonWidth - totalRadius - 10);
    const minY = Math.ceil(totalRadius + 10);
    const maxY = Math.floor(renderComparisonHeight - totalRadius - 10);
    
    // For very large circles, we might need to reduce the diameter to fit
    if (maxX <= minX || maxY <= minY) {
      // Circle is too large, reduce diameter to 1/4 of canvas size
      diameter = Math.min(
        Math.floor(renderComparisonWidth / 4), 
        Math.floor(renderComparisonHeight / 4)
      );
      
      // Recalculate bounds with reduced diameter
      const newEstimatedRadius = diameter / 2;
      const newTotalRadius = newEstimatedRadius + (strokeWidth / 2);
      
      const newMinX = Math.ceil(newTotalRadius + 10);
      const newMaxX = Math.floor(renderComparisonWidth - newTotalRadius - 10);
      const newMinY = Math.ceil(newTotalRadius + 10);
      const newMaxY = Math.floor(renderComparisonHeight - newTotalRadius - 10);
      
      // Generate random position within new safe bounds
      centerX = newMinX + Math.floor(SeededRandom.getRandom() * (newMaxX - newMinX + 1));
      centerY = newMinY + Math.floor(SeededRandom.getRandom() * (newMaxY - newMinY + 1));
    } else {
      // Generate random position within original safe bounds
      centerX = minX + Math.floor(SeededRandom.getRandom() * (maxX - minX + 1));
      centerY = minY + Math.floor(SeededRandom.getRandom() * (maxY - minY + 1));
    }
  }
  
  // Adjust the diameter for crisp rendering
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(
    diameter, diameter, strokeWidth, { x: centerX, y: centerY }
  );
  const adjustedDiameter = adjustedDimensions.width; // width equals height for circle
  const radius = adjustedDiameter / 2;
  
  // Create the circle with calculated parameters
  const circle = {
    type: 'circle',
    center: { x: centerX, y: centerY },
    radius,
    strokeWidth,
    strokeColor: hasStroke ? getRandomColor(150, 230) : { r: 0, g: 0, b: 0, a: 0 }, // More opaque stroke for visibility
    fillColor: getRandomColor(100, 200), // Semi-transparent fill
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
 * Helper function to generate multiple circles with smart placement
 * @param {Array} shapes - Array to add shapes to
 * @param {HTMLElement} log - Log element to add descriptions
 * @param {number} count - Number of circles to create
 * @param {boolean} includeStrokes - Whether to include strokes on circles
 * @param {string} description - Description to log
 * @returns {void}
 */
function generateMultiplePreciseCircles(shapes, log, currentExampleNumber, count, includeStrokes, description) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  
  // Ensure canvas dimensions are even for proper alignment
  checkCanvasHasEvenDimensions();
  
  // Safe margins to keep circles fully visible within canvas
  const margin = 60;
  const safeWidth = renderComparisonWidth - 2 * margin;
  const safeHeight = renderComparisonHeight - 2 * margin;
  
  log.innerHTML += `${description} (${count} circles)<br>`;
  
  // Pre-calculate several circle sizes to ensure a good mix
  // but prevent the largest circles from obscuring everything
  const sizes = [];
  for (let i = 0; i < count; i++) {
    // Mix of smaller and larger circles
    const radius = 8 + Math.floor(SeededRandom.getRandom() * 35);
    sizes.push(radius);
  }
  
  // Sort sizes in descending order so we place larger circles first
  sizes.sort((a, b) => b - a);
  
  // Track placed circles to avoid excessive overlap
  const placedCircles = [];
  
  for (let i = 0; i < count; i++) {
    // Get pre-calculated radius
    const radius = sizes[i];
    const diameter = radius * 2;
    
    // Generate a random stroke width (varied range for visual interest)
    // Use 0 if not including strokes
    const strokeWidth = includeStrokes ? (1 + Math.floor(SeededRandom.getRandom() * 4)) : 0;
    
    // Generate multiple position candidates and pick the one with least overlap
    let bestX, bestY;
    let bestOverlapScore = Infinity;
    
    // Try several positions to find a good spot
    const attempts = 8;
    for (let attempt = 0; attempt < attempts; attempt++) {
      // True random positioning within the safe area
      // Use integer positions for precise pixel alignment
      const candidateX = Math.floor(margin + SeededRandom.getRandom() * safeWidth);
      const candidateY = Math.floor(margin + SeededRandom.getRandom() * safeHeight);
      
      // Calculate overlap score with existing circles
      let overlapScore = 0;
      for (const placed of placedCircles) {
        // Calculate distance between circle centers
        const dx = candidateX - placed.x;
        const dy = candidateY - placed.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If circles would overlap significantly, increase score
        const minDistance = radius + placed.radius;
        if (distance < minDistance) {
          // More penalty for more overlap
          overlapScore += (minDistance - distance) * 2;
        }
      }
      
      // Check if this position is better than previous attempts
      if (overlapScore < bestOverlapScore) {
        bestOverlapScore = overlapScore;
        bestX = candidateX;
        bestY = candidateY;
        
        // If we found a position with no significant overlap, use it right away
        if (overlapScore < radius * 0.5) {
          break;
        }
      }
    }
    
    // Adjust dimensions for crisp rendering
    const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(
      diameter, diameter, strokeWidth, { x: bestX, y: bestY }
    );
    const adjustedDiameter = adjustedDimensions.width;
    const finalRadius = adjustedDiameter / 2;
    
    // Choose center type - either at grid point or pixel center
    const atPixel = SeededRandom.getRandom() < 0.5;
    let centerX = bestX;
    let centerY = bestY;
    
    // Adjust center if needed to be either at grid or pixel center
    if (atPixel && centerX % 1 !== 0.5) {
      centerX = Math.floor(centerX) + 0.5;
    } else if (!atPixel && centerX % 1 === 0.5) {
      centerX = Math.floor(centerX);
    }
    
    if (atPixel && centerY % 1 !== 0.5) {
      centerY = Math.floor(centerY) + 0.5;
    } else if (!atPixel && centerY % 1 === 0.5) {
      centerY = Math.floor(centerY);
    }
    
    // Create the circle with distinct colors (using partitioning to ensure variety)
    const circle = {
      type: 'circle',
      center: { x: centerX, y: centerY },
      radius: finalRadius,
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
    
    // Track placed circle for overlap prevention
    placedCircles.push({
      x: centerX,
      y: centerY,
      radius: finalRadius + strokeWidth
    });
    
    // Add the circle to shapes
    shapes.push(circle);
    
    // Log only the first few circles to avoid cluttering the log
    if (i < 3) {
      log.innerHTML += `&#x20DD; Circle ${i} at (${centerX}, ${centerY}) radius: ${finalRadius} ` + 
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
