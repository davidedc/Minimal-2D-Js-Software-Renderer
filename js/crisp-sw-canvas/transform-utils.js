// Helper function to get scaled line width
function getScaledLineWidth(matrix, baseWidth) {
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
    const scale = Math.max(Math.sqrt(scaleX * scaleY), 0.0001);
    return baseWidth * scale;
}
// Helper function to transform point
function transformPoint(x, y, matrix) {
    const tx = matrix[0] * x + matrix[3] * y + matrix[6];
    const ty = matrix[1] * x + matrix[4] * y + matrix[7];
    return { tx, ty };
}
// Add this helper function to extract rotation angle from transformation matrix
function getRotationAngle(matrix) {
    // For a 2D transformation matrix [a d 0, b e 0, c f 1],
    // the rotation angle can be extracted using atan2(-b, a)
    // matrix[3] is b, matrix[0] is a in column-major order
    return Math.atan2(-matrix[3], matrix[0]);
}
// Add this helper function to get scale factors from matrix
function getScaleFactors(matrix) {
    // For column-major [a d 0, b e 0, c f 1]
    // First column (x-axis): [a, d, 0]
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    // Second column (y-axis): [b, e, 0]
    const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
    return { scaleX, scaleY };
}
