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
  