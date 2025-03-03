class SWRendererCircle {
  constructor(pixelRenderer) {
    this.pixelRenderer = pixelRenderer;
  }

  drawCircle(shape) {
    const {
      center, radius,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    const innerRadius = strokeWidth > 0 ? radius - strokeWidth / 2 : radius;
    const outerRadius = radius + strokeWidth / 2;

    // Draw row by row
    this.drawPreciseCircle(
      center.x, center.y, 
      innerRadius, outerRadius,
      fillR, fillG, fillB, fillA,
      strokeR, strokeG, strokeB, strokeA
    );
  }

  drawPreciseCircle(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {
    // No initial offset adjustment - we'll handle positioning during pixel placement
    const cX = centerX - 0.5;
    const cY = centerY - 0.5;
    
    // Adjustment values for each edge to match canvas rendering
    // These are manually tuned to align with canvas rendering
    const leftAdjust = 0.0;
    const rightAdjust = 0.5;
    const topAdjust = 0.0;
    const bottomAdjust = 0.5;
    
    // Calculate the bounds for processing
    const minY = Math.floor(cY - outerRadius - 1);
    const maxY = Math.ceil(cY + outerRadius + 1);
    const minX = Math.floor(cX - outerRadius - 1);
    const maxX = Math.ceil(cX + outerRadius + 1);
    
    // Track visited pixels to avoid drawing any pixel multiple times
    const visitedPixels = new Set();
    
    // First pass: Draw fills
    if (fillA > 0 && innerRadius > 0) {
      const innerRadiusSquared = innerRadius * innerRadius;
      
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const distSquared = innerRadiusSquared - dy * dy;
        
        if (distSquared >= 0) {
          const innerXDist = Math.sqrt(distSquared);
          const leftFillX = Math.ceil(cX - innerXDist + leftAdjust);
          const rightFillX = Math.floor(cX + innerXDist + rightAdjust);
          
          for (let x = leftFillX; x <= rightFillX; x++) {
            const pixelKey = `${x},${y}`;
            if (!visitedPixels.has(pixelKey)) {
              const dx = x - cX;
              const distFromCenterSquared = dx * dx + dy * dy;
              
              if (distFromCenterSquared <= innerRadiusSquared) {
                this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
                visitedPixels.add(pixelKey);
              }
            }
          }
        }
      }
    }
    
    // Second pass: Draw strokes
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // First process horizontal scan lines (constant y)
      for (let y = minY; y <= maxY; y++) {
        // Apply vertical adjustments based on position
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        const dy = y - (cY + yAdjust);
        const distSquared = outerRadiusSquared - dy * dy;
        
        if (distSquared >= 0) {
          const outerXDist = Math.sqrt(distSquared);
          
          const leftEdge = Math.floor(cX - outerXDist + leftAdjust);
          const rightEdge = Math.ceil(cX + outerXDist + rightAdjust);
          
          for (let x = leftEdge; x <= rightEdge; x++) {
            const pixelKey = `${x},${y}`;
            if (visitedPixels.has(pixelKey)) continue;
            
            // Apply horizontal adjustments based on position
            let xAdjust = 0;
            if (x < cX) xAdjust = leftAdjust;
            else if (x > cX) xAdjust = rightAdjust;
            
            const dx = x - (cX + xAdjust);
            const distFromCenterSquared = dx * dx + dy * dy;
            
            // Check if pixel is within the stroke area
            if (distFromCenterSquared <= outerRadiusSquared) {
              if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
                this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                visitedPixels.add(pixelKey);
              }
            }
          }
        }
      }
      
      // Then process vertical scan lines (constant x) to catch any missed pixels
      for (let x = minX; x <= maxX; x++) {
        // Apply horizontal adjustments based on position
        let xAdjust = 0;
        if (x < cX) xAdjust = leftAdjust;
        else if (x > cX) xAdjust = rightAdjust;
        
        const dx = x - (cX + xAdjust);
        const distSquared = outerRadiusSquared - dx * dx;
        
        if (distSquared >= 0) {
          const outerYDist = Math.sqrt(distSquared);
          
          const topEdge = Math.floor(cY - outerYDist + topAdjust);
          const bottomEdge = Math.ceil(cY + outerYDist + bottomAdjust);
          
          for (let y = topEdge; y <= bottomEdge; y++) {
            const pixelKey = `${x},${y}`;
            if (visitedPixels.has(pixelKey)) continue;
            
            // Apply vertical adjustments based on position
            let yAdjust = 0;
            if (y < cY) yAdjust = topAdjust;
            else if (y > cY) yAdjust = bottomAdjust;
            
            const dy = y - (cY + yAdjust);
            const distFromCenterSquared = dx * dx + dy * dy;
            
            // Check if pixel is within the stroke area
            if (distFromCenterSquared <= outerRadiusSquared) {
              if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
                this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                visitedPixels.add(pixelKey);
              }
            }
          }
        }
      }
    }
  }
}