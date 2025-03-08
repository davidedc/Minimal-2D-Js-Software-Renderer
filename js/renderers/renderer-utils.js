// Tolerance for considering an angle to be equivalent to a multiple of 90 degrees
const ANGLE_TOLERANCE = 0.001; // Radians (~0.057 degrees)

/**
 * Checks if an angle is very close to a multiple of 90 degrees
 * @param {number} angle - The angle in radians
 * @returns {boolean} True if the angle is close to 0, 90, 180, or 270 degrees
 */
function isNearMultipleOf90Degrees(angle) {
  // Normalize angle to [0, 2π)
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // Check if angle is close to 0, π/2, π, or 3π/2
  return (
    Math.abs(normalizedAngle) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - Math.PI/2) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - Math.PI) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - 3*Math.PI/2) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - 2*Math.PI) < ANGLE_TOLERANCE
  );
}

/**
 * Gets the appropriate width and height for a rotated rectangle
 * For angles near 90° or 270°, width and height are swapped
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} angle - Rotation angle in radians
 * @returns {Object} Object containing the adjusted width and height
 */
function getRotatedDimensionsIfTheCase(width, height, angle) {
  // Normalize angle to [0, 2π)
  const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  
  // For angles near 90° or 270°, swap width and height
  if (
    Math.abs(normalizedAngle - Math.PI/2) < ANGLE_TOLERANCE ||
    Math.abs(normalizedAngle - 3*Math.PI/2) < ANGLE_TOLERANCE
  ) {
    return { adjustedWidth: height, adjustedHeight: width };
  }
  
  // For angles near 0° or 180°, keep original dimensions
  return { adjustedWidth: width, adjustedHeight: height };
}