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
    // Apply base offset adjustment
    const cX = centerX - 0.5;
    const cY = centerY - 0.5;
    
    // Adjustment values for each edge to match canvas rendering
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
    // Track fill pixels to ensure we don't draw outside the stroke
    const fillPixels = new Set();
    // Track cardinal points to fix spurious pixels
    const cardinalPoints = new Set();
    
    // Calculate radius for path and fill
    const pathRadius = (innerRadius + outerRadius) / 2; // The actual circle path
    const fillRadius = pathRadius - 0.1; // Make fill slightly smaller to avoid protruding
    const fillRadiusSquared = fillRadius * fillRadius;
    
    // Calculate cardinal points for special handling
    const rightCardinal = Math.round(cX + outerRadius);
    const bottomCardinal = Math.round(cY + outerRadius);
    const rightFillCardinal = Math.round(cX + fillRadius);
    const bottomFillCardinal = Math.round(cY + fillRadius);
    
    // First collect fill pixels but don't draw them yet
    if (fillA > 0) {
      for (let y = minY; y <= maxY; y++) {
        // Apply vertical adjustments
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        const dy = y - (cY + yAdjust);
        const distSquared = fillRadiusSquared - dy * dy;
        
        if (distSquared >= 0) {
          const fillXDist = Math.sqrt(distSquared);
          
          // Apply adjusted scan bounds
          const leftFillX = Math.ceil(cX - fillXDist + leftAdjust);
          const rightFillX = Math.floor(cX + fillXDist + rightAdjust * 0.5); // Reduce right adjustment to avoid protrusion
          
          for (let x = leftFillX; x <= rightFillX; x++) {
            // Skip extreme cardinal points which cause protrusions
            if ((x === rightFillCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomFillCardinal && Math.abs(x - cX) < 2)) {
              continue;
            }
            
            // Apply specialized fixes for the extreme right and bottom pixels
            if (x === rightFillCardinal + 1 || y === bottomFillCardinal + 1) {
              continue;
            }
            
            const dx = x - cX;
            const distFromCenterSquared = dx * dx + dy * dy;
            
            // Check if pixel is truly within fill radius
            if (distFromCenterSquared <= fillRadiusSquared) {
              fillPixels.add(`${x},${y}`);
            }
          }
        }
      }
    }
    
    // Now draw strokes
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process horizontal scan lines (constant y)
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
            // Skip cardinal points - we'll handle these specially
            if ((x === rightCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomCardinal && Math.abs(x - cX) < 2)) {
              cardinalPoints.add(`${x},${y}`);
              continue;
            }
            
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
      
      // Process vertical scan lines (constant x) to catch any missed pixels
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
            // Skip cardinal points we've already marked
            if (cardinalPoints.has(`${x},${y}`)) continue;
            
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
                // Special case for rightmost and bottommost points
                if ((x === rightCardinal || x === rightCardinal + 1) && 
                    Math.abs(y - cY) < 1.5) {
                  // Skip the rightmost spurious pixel
                  if (x === rightCardinal + 1) continue;
                }
                
                if ((y === bottomCardinal || y === bottomCardinal + 1) && 
                    Math.abs(x - cX) < 1.5) {
                  // Skip the bottommost spurious pixel
                  if (y === bottomCardinal + 1) continue;
                }
                
                this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                visitedPixels.add(pixelKey);
              }
            }
          }
        }
      }
    }
    
    // Finally, draw fill pixels that aren't covered by stroke
    if (fillA > 0) {
      for (const pixelKey of fillPixels) {
        if (!visitedPixels.has(pixelKey)) {
          const [x, y] = pixelKey.split(',').map(Number);
          this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
          visitedPixels.add(pixelKey);
        }
      }
    }
  }
}