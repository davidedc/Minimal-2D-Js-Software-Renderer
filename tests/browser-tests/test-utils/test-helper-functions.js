/**
 * @fileoverview Common helper functions used across multiple high-level test cases.
 * These functions were previously defined individually in test files, causing scope
 * issues when tests are concatenated with IIFE wrapping for Node.js builds.
 */


/**
 * Adjusts width and height to ensure crisp rendering based on stroke width and center position
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} strokeWidth - Width of the stroke
 * @param {Object} center - Center coordinates {x, y}
 * @returns {Object} Adjusted width and height
 */
function adjustDimensionsForCrispStrokeRendering(width, height, strokeWidth, center) {

    // Dimensions should be integers, because non-integer dimensions
    // always produce a non-crisp (i.e. non-grid-aligned) stroke/fill.
    let adjustedWidth = Math.floor(width);
    let adjustedHeight = Math.floor(height);
  
    // FIXING THE WIDTH /////////////////////////////////
  
    // For center's x coordinate at grid points (integer coordinates)
    if (Number.isInteger(center.x)) {
      // For odd strokeWidth, width should be odd
      if (strokeWidth % 2 !== 0) {
        if (adjustedWidth % 2 === 0) adjustedWidth++;
      }
      // For even strokeWidth, width should be even
      else {
        if (adjustedWidth % 2 !== 0) adjustedWidth++;
      }
    }
    // For center's x coordinate at pixels (i.e. *.5 coordinates)
    else if (center.x % 1 === 0.5) {
      // For odd strokeWidth, width should be even
      if (strokeWidth % 2 !== 0) {
        if (adjustedWidth % 2 !== 0) adjustedWidth++;
      }
      // For even strokeWidth, width should be odd
      else {
        if (adjustedWidth % 2 === 0) adjustedWidth++;
      }
    }
  
    // FIXING THE HEIGHT /////////////////////////////////
  
    // For center's y coordinate at grid points (integer coordinates)
    if (Number.isInteger(center.y)) {
      // For odd strokeWidth, height should be odd
      if (strokeWidth % 2 !== 0) {
        if (adjustedHeight % 2 === 0) adjustedHeight++;
      }
      // For even strokeWidth, height should be even
      else {
        if (adjustedHeight % 2 !== 0) adjustedHeight++;
      }
    }
    // For center's y coordinate at pixels (i.e. *.5 coordinates)
    else if (center.y % 1 === 0.5) {
      // For odd strokeWidth, height should be even
      if (strokeWidth % 2 !== 0) {
        if (adjustedHeight % 2 !== 0) adjustedHeight++;
      }
      // For even strokeWidth, height should be odd
      else {
        if (adjustedHeight % 2 === 0) adjustedHeight++;
      }
    }
  
    return {
      width: adjustedWidth,
      height: adjustedHeight
    };
  }
  
  /**
   * Adjusts center coordinates to ensure crisp rendering based on stroke width and dimensions
   * @param {number} centerX - Original center X coordinate
   * @param {number} centerY - Original center Y coordinate
   * @param {number} width - Shape width
   * @param {number} height - Shape height
   * @param {number} strokeWidth - Width of the stroke
   * @returns {Object} Adjusted center coordinates
   */
  function adjustCenterForCrispStrokeRendering(centerX, centerY, width, height, strokeWidth) {
    
    let adjustedX = centerX;
    let adjustedY = centerY;
  
    // For odd strokeWidth
    //   if width/height are even, then the center x/y should be in the middle of the pixel i.e. *.5
    //   if width/height are odd, then the center x/y should be at the grid point i.e. integer
  
    // For even strokeWidth
    //   if width/height are even, then the center x/y should be at the grid point i.e. integer
    //   if width/height are odd, then the center x/y should be in the middle of the pixel i.e. *.5
  
    if (strokeWidth % 2 !== 0) {
      if (width % 2 === 0) {
        adjustedX = Math.floor(centerX) + 0.5;
      } else {
        adjustedX = Math.round(centerX);
      }
  
      if (height % 2 === 0) {
        adjustedY = Math.floor(centerY) + 0.5;
      } else {
        adjustedY = Math.round(centerY);
      }
    }
    else {
      if (width % 2 === 0) {
        adjustedX = Math.round(centerX);
      } else {
        adjustedX = Math.floor(centerX) + 0.5;
      }
  
      if (height % 2 === 0) {
        adjustedY = Math.round(centerY);
      } else {
        adjustedY = Math.floor(centerY) + 0.5;
      }
    }
  
  
  
    return {
      x: adjustedX,
      y: adjustedY
    };
  }
  
  // ============================================================================
  // CIRCLES SECTION
  // ============================================================================
  
  /**
   * Places a center point at pixel boundary (*.5 coordinates) relative to canvas center
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Center coordinates
   */
  function placeCloseToCenterAtPixel(width, height) {
    return {
      centerX: Math.floor(width / 2) + 0.5,
      centerY: Math.floor(height / 2) + 0.5
    };
  }
  
  /**
   * Places a center point at grid intersection (integer coordinates) relative to canvas center
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Center coordinates
   */
  function placeCloseToCenterAtGrid(width, height) {
    return {
      centerX: Math.floor(width / 2),
      centerY: Math.floor(height / 2)
    };
  }
  
  /**
   * Calculates circle parameters with proper positioning and dimensions.
   * This is a refactored version that uses the elegant logic from calculateCircleParameters
   * but adapted for the test context.
   * 
   * @param {Object} options - Configuration options for circle creation
   * @param {number} options.canvasWidth - Canvas width (replaces global renderTestWidth)
   * @param {number} options.canvasHeight - Canvas height (replaces global renderTestHeight)
   * @param {number} options.minRadius - Minimum radius for the circle
   * @param {number} options.maxRadius - Maximum radius for the circle
   * @param {boolean} options.hasStroke - Whether the circle has a stroke
   * @param {number} options.minStrokeWidth - Minimum stroke width (if hasStroke is true)
   * @param {number} options.maxStrokeWidth - Maximum stroke width (if hasStroke is true)
   * @param {boolean} options.randomPosition - Whether to use random positioning
   * @param {number} options.marginX - Horizontal margin from canvas edges
   * @param {number} options.marginY - Vertical margin from canvas edges
   * @returns {Object} Calculated circle parameters: {centerX, centerY, radius, strokeWidth, finalDiameter, atPixel}
   */
  function calculateCircleTestParameters(options) {
    const {
      canvasWidth,
      canvasHeight,
      minRadius = 8,
      maxRadius = 42,
      hasStroke = false,
      minStrokeWidth = 1,
      maxStrokeWidth = 4,
      randomPosition = true,
      marginX = 60,
      marginY = 60
    } = options;
  
    // Randomly choose between grid-centered and pixel-centered
    const atPixel = SeededRandom.getRandom() < 0.5;
    
    // Get initial center point
    let {centerX, centerY} = atPixel
      ? placeCloseToCenterAtPixel(canvasWidth, canvasHeight)
      : placeCloseToCenterAtGrid(canvasWidth, canvasHeight);
    
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
      const maxX = Math.floor(canvasWidth - totalRadius - marginX);
      const minY = Math.ceil(totalRadius + marginY);
      const maxY = Math.floor(canvasHeight - totalRadius - marginY);
      
      // Adjust diameter if circle is too large
      let adjustedDiameter = diameter;
      if (maxX <= minX || maxY <= minY) {
        // Circle is too large, reduce diameter to 1/4 of canvas size
        adjustedDiameter = Math.min(
          Math.floor(canvasWidth / 4),
          Math.floor(canvasHeight / 4)
        );
        
        // Recalculate bounds with reduced diameter
        const newTotalRadius = (adjustedDiameter / 2) + (strokeWidth / 2);
        const newMinX = Math.ceil(newTotalRadius + marginX);
        const newMaxX = Math.floor(canvasWidth - newTotalRadius - marginX);
        const newMinY = Math.ceil(newTotalRadius + marginY);
        const newMaxY = Math.floor(canvasHeight - newTotalRadius - marginY);
        
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
    const finalDiameter = adjustedDimensions.width;
    const radius = finalDiameter / 2;
    
    return {
      centerX,
      centerY,
      radius,
      strokeWidth,
      finalDiameter,
      atPixel
    };
  }
  
  /**
   * Calculates parameters for multiple precise, fill-only (no stroke) random circles.
   * This replaces _calculateMultiplePreciseNoStrokeCirclesParams with the more elegant 
   * calculateCircleParameters logic.
   * 
   * @param {number} canvasWidth - The width of the canvas
   * @param {number} canvasHeight - The height of the canvas
   * @returns {Object} An object containing centerX, centerY, radius, finalDiameter, and atPixel
   */
  function calculateMultiplePreciseNoStrokeCirclesParams(canvasWidth, canvasHeight) {
    return calculateCircleTestParameters({
      canvasWidth,
      canvasHeight,
      minRadius: 8,
      maxRadius: 42,
      hasStroke: false,        // No stroke
      randomPosition: true,    // Enable random positioning
      marginX: 60,
      marginY: 60
    });
  }
  
  /**
   * Calculates parameters for multiple precise random circles WITH stroke.
   * calculateCircleParameters logic.
   * 
   * @param {number} canvasWidth - The width of the canvas
   * @param {number} canvasHeight - The height of the canvas
   * @returns {Object} An object containing centerX, centerY, radius, strokeWidth, finalDiameter, and atPixel
   */
  function calculateMultiplePreciseRandomCirclesParams(canvasWidth, canvasHeight) {
    return calculateCircleTestParameters({
      canvasWidth,
      canvasHeight,
      minRadius: 8,
      maxRadius: 42,
      hasStroke: true,         // Has stroke
      minStrokeWidth: 1,
      maxStrokeWidth: 4,
      randomPosition: true,    // Enable random positioning
      marginX: 60,
      marginY: 60
    });
  }
  