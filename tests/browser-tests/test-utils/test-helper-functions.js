/**
 * @fileoverview Common helper functions used across multiple high-level test cases.
 * These functions were previously defined individually in test files, causing scope
 * issues when tests are concatenated with IIFE wrapping for Node.js builds.
 */


/**
 * Adjusts width and height to ensure crisp rendering based on stroke width and center position.
 * Adapted from src/scene-creation/scene-creation-utils.js
 * @param {number} width - Original width.
 * @param {number} height - Original height.
 * @param {number} strokeWidth - Width of the stroke.
 * @param {{x: number, y: number}} center - Center coordinates {x, y}.
 * @returns {{width: number, height: number}} Adjusted width and height.
 */
function _adjustDimensionsForCrispStrokeRendering(width, height, strokeWidth, center) {
    let adjustedWidth = Math.floor(width);
    let adjustedHeight = Math.floor(height);

    // FIXING THE WIDTH
    if (Number.isInteger(center.x)) { // Center x is on grid
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedWidth % 2 === 0) adjustedWidth++; // Width must be odd
        } else { // Even stroke
            if (adjustedWidth % 2 !== 0) adjustedWidth++; // Width must be even
        }
    } else if (center.x % 1 === 0.5) { // Center x is on pixel center
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedWidth % 2 !== 0) adjustedWidth++; // Width must be even
        } else { // Even stroke
            if (adjustedWidth % 2 === 0) adjustedWidth++; // Width must be odd
        }
    }

    // FIXING THE HEIGHT
    if (Number.isInteger(center.y)) { // Center y is on grid
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedHeight % 2 === 0) adjustedHeight++; // Height must be odd
        } else { // Even stroke
            if (adjustedHeight % 2 !== 0) adjustedHeight++; // Height must be even
        }
    } else if (center.y % 1 === 0.5) { // Center y is on pixel center
        if (strokeWidth % 2 !== 0) { // Odd stroke
            if (adjustedHeight % 2 !== 0) adjustedHeight++; // Height must be even
        } else { // Even stroke
            if (adjustedHeight % 2 === 0) adjustedHeight++; // Height must be odd
        }
    }
    return { width: adjustedWidth, height: adjustedHeight };
}

/**
 * Adjusts center coordinates for crisp stroke rendering based on stroke width.
 * @param {number} centerX - Original center X coordinate.
 * @param {number} centerY - Original center Y coordinate. 
 * @param {number} strokeWidth - Width of the stroke.
 * @returns {{x: number, y: number}} Adjusted center coordinates.
 */
function _adjustCenterForCrispStrokeRendering(centerX, centerY, strokeWidth) {
    let adjustedCenterX = centerX;
    let adjustedCenterY = centerY;
    
    if (strokeWidth % 2 !== 0) { // Odd stroke width
        // For odd stroke width, center should be on grid intersections (integers)
        adjustedCenterX = Math.round(centerX);
        adjustedCenterY = Math.round(centerY);
    } else { // Even stroke width
        // For even stroke width, center should be on pixel centers (half-integers)
        adjustedCenterX = Math.floor(centerX) + 0.5;
        adjustedCenterY = Math.floor(centerY) + 0.5;
    }
    
    return { x: adjustedCenterX, y: adjustedCenterY };
} 