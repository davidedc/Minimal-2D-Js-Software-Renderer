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
    
    // Calculate the bounds for processing with boundary checking
    const minY = Math.max(0, Math.floor(cY - outerRadius - 1));
    const maxY = Math.min(this.pixelRenderer.height - 1, Math.ceil(cY + outerRadius + 1));
    const minX = Math.max(0, Math.floor(cX - outerRadius - 1));
    const maxX = Math.min(this.pixelRenderer.width - 1, Math.ceil(cX + outerRadius + 1));
    
    // The path is the true mathematical circle (centered between innerRadius and outerRadius)
    const pathRadius = (innerRadius + outerRadius) / 2;
    // The fill should extend exactly to the path
    const fillRadius = pathRadius;
    const fillRadiusSquared = fillRadius * fillRadius;
    
    // Calculate cardinal points for special handling
    const rightCardinal = Math.round(cX + outerRadius);
    const bottomCardinal = Math.round(cY + outerRadius);
    const rightFillCardinal = Math.round(cX + fillRadius);
    const bottomFillCardinal = Math.round(cY + fillRadius);
    
    // Draw fill first
    if (fillA > 0) {
      for (let y = minY; y <= maxY; y++) {
        // Apply vertical adjustments
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        // Precompute and reuse distance calculation
        const dy = y - (cY + yAdjust);
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          
          // Apply adjusted scan bounds with boundary checking
          const leftFillX = Math.max(0, Math.ceil(cX - fillXDist + leftAdjust));
          const rightFillX = Math.min(this.pixelRenderer.width - 1, Math.floor(cX + fillXDist + rightAdjust * 0.5));
          
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
            const distFromCenterSquared = dx * dx + dySquared; // Reuse dySquared
            
            // Check if pixel is within fill radius
            if (distFromCenterSquared <= fillRadiusSquared) {
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
            }
          }
        }
      }
    }
    
    // Then draw stroke on top of fill - use a Set to track drawn pixels to prevent overdraw
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      const cardinalPoints = new Set();
      const drawnStrokePixels = new Set(); // Track drawn stroke pixels to prevent double-drawing
      
      // First scan horizontal lines
      for (let y = minY; y <= maxY; y++) {
        // Apply vertical adjustments based on position
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        // Reuse dy calculation
        const dy = y - (cY + yAdjust);
        const dySquared = dy * dy;
        const distSquared = outerRadiusSquared - dySquared;
        
        if (distSquared >= 0) {
          const outerXDist = Math.sqrt(distSquared);
          
          // Apply boundary checking
          const leftEdge = Math.max(0, Math.floor(cX - outerXDist + leftAdjust));
          const rightEdge = Math.min(this.pixelRenderer.width - 1, Math.ceil(cX + outerXDist + rightAdjust));
          
          for (let x = leftEdge; x <= rightEdge; x++) {
            // Skip cardinal points - we'll handle these specially
            if ((x === rightCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomCardinal && Math.abs(x - cX) < 2)) {
              cardinalPoints.add(`${x},${y}`);
              continue;
            }
            
            // Apply horizontal adjustments based on position
            let xAdjust = 0;
            if (x < cX) xAdjust = leftAdjust;
            else if (x > cX) xAdjust = rightAdjust;
            
            const dx = x - (cX + xAdjust);
            const distFromCenterSquared = dx * dx + dySquared; // Reuse dySquared
            
            // Check if pixel is within the stroke area
            if (distFromCenterSquared <= outerRadiusSquared) {
              if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
                const pixelKey = `${x},${y}`;
                
                // Only draw if not already drawn
                if (!drawnStrokePixels.has(pixelKey)) {
                  this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                  drawnStrokePixels.add(pixelKey);
                }
              }
            }
          }
        }
      }
      
      // Then scan vertical lines to catch any missed pixels
      for (let x = minX; x <= maxX; x++) {
        // Apply horizontal adjustments based on position
        let xAdjust = 0;
        if (x < cX) xAdjust = leftAdjust;
        else if (x > cX) xAdjust = rightAdjust;
        
        const dx = x - (cX + xAdjust);
        const dxSquared = dx * dx;
        const distSquared = outerRadiusSquared - dxSquared;
        
        if (distSquared >= 0) {
          const outerYDist = Math.sqrt(distSquared);
          
          // Apply boundary checking
          const topEdge = Math.max(0, Math.floor(cY - outerYDist + topAdjust));
          const bottomEdge = Math.min(this.pixelRenderer.height - 1, Math.ceil(cY + outerYDist + bottomAdjust));
          
          for (let y = topEdge; y <= bottomEdge; y++) {
            // Skip cardinal points we've already marked
            if (cardinalPoints.has(`${x},${y}`)) continue;
            
            const pixelKey = `${x},${y}`;
            // Skip pixels we've already drawn
            if (drawnStrokePixels.has(pixelKey)) continue;
            
            // Apply vertical adjustments based on position
            let yAdjust = 0;
            if (y < cY) yAdjust = topAdjust;
            else if (y > cY) yAdjust = bottomAdjust;
            
            const dy = y - (cY + yAdjust);
            const distFromCenterSquared = dxSquared + dy * dy; // Reuse dxSquared
            
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
                
                // Draw the stroke
                this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                drawnStrokePixels.add(pixelKey);
              }
            }
          }
        }
      }
    }
  }
}