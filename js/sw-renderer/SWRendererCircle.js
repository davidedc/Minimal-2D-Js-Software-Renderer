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
    
    // The path is the true mathematical circle (centered between innerRadius and outerRadius)
    const pathRadius = (innerRadius + outerRadius) / 2;
    // The fill should extend exactly to the path
    const fillRadius = pathRadius;
    const fillRadiusSquared = fillRadius * fillRadius;
    
    // Track drawn pixels for proper stroke and fill management
    const drawnPixels = new Map();
    
    // Calculate cardinal points for special handling
    const rightCardinal = Math.round(cX + outerRadius);
    const bottomCardinal = Math.round(cY + outerRadius);
    const rightFillCardinal = Math.round(cX + fillRadius);
    const bottomFillCardinal = Math.round(cY + fillRadius);
    
    // Draw fill first (will be covered by stroke where they overlap)
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
          const rightFillX = Math.floor(cX + fillXDist + rightAdjust * 0.5); // Reduce right adjustment
          
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
            
            // Check if pixel is within fill radius
            if (distFromCenterSquared <= fillRadiusSquared) {
              const key = `${x},${y}`;
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
              drawnPixels.set(key, { r: fillR, g: fillG, b: fillB, a: fillA });
            }
          }
        }
      }
    }
    
    // Then draw stroke on top of fill
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      const cardinalPoints = new Set();
      
      // First scan horizontal lines
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
            
            // Apply horizontal adjustments based on position
            let xAdjust = 0;
            if (x < cX) xAdjust = leftAdjust;
            else if (x > cX) xAdjust = rightAdjust;
            
            const dx = x - (cX + xAdjust);
            const distFromCenterSquared = dx * dx + dy * dy;
            
            // Check if pixel is within the stroke area
            if (distFromCenterSquared <= outerRadiusSquared) {
              if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
                const key = `${x},${y}`;
                
                // If the pixel has fill and stroke is semi-transparent, we need to blend
                if (drawnPixels.has(key) && strokeA < 255) {
                  const fillColor = drawnPixels.get(key);
                  const blendedColor = this.blendColors(
                    fillColor.r, fillColor.g, fillColor.b, fillColor.a,
                    strokeR, strokeG, strokeB, strokeA
                  );
                  this.pixelRenderer.setPixel(x, y, blendedColor.r, blendedColor.g, blendedColor.b, blendedColor.a);
                } else {
                  // Either no fill or fully opaque stroke - just draw the stroke
                  this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                }
                drawnPixels.set(key, { r: strokeR, g: strokeG, b: strokeB, a: strokeA });
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
        const distSquared = outerRadiusSquared - dx * dx;
        
        if (distSquared >= 0) {
          const outerYDist = Math.sqrt(distSquared);
          
          const topEdge = Math.floor(cY - outerYDist + topAdjust);
          const bottomEdge = Math.ceil(cY + outerYDist + bottomAdjust);
          
          for (let y = topEdge; y <= bottomEdge; y++) {
            // Skip cardinal points we've already marked
            if (cardinalPoints.has(`${x},${y}`)) continue;
            
            const key = `${x},${y}`;
            // Skip pixels we've already handled in the horizontal scan
            if (drawnPixels.has(key) && drawnPixels.get(key).r === strokeR && 
                drawnPixels.get(key).g === strokeG && drawnPixels.get(key).b === strokeB) {
              continue;
            }
            
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
                
                // If the pixel has fill and stroke is semi-transparent, we need to blend
                if (drawnPixels.has(key) && strokeA < 255) {
                  const fillColor = drawnPixels.get(key);
                  const blendedColor = this.blendColors(
                    fillColor.r, fillColor.g, fillColor.b, fillColor.a,
                    strokeR, strokeG, strokeB, strokeA
                  );
                  this.pixelRenderer.setPixel(x, y, blendedColor.r, blendedColor.g, blendedColor.b, blendedColor.a);
                } else {
                  // Either no fill or fully opaque stroke - just draw the stroke
                  this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                }
                drawnPixels.set(key, { r: strokeR, g: strokeG, b: strokeB, a: strokeA });
              }
            }
          }
        }
      }
    }
  }
  
  // Helper function to blend colors when applying a semi-transparent stroke over a fill
  blendColors(r1, g1, b1, a1, r2, g2, b2, a2) {
    // Convert alpha from 0-255 to 0-1
    const alpha1 = a1 / 255;
    const alpha2 = a2 / 255;
    
    // Calculate the resulting alpha
    const outAlpha = alpha1 + alpha2 * (1 - alpha1);
    
    // If resulting alpha is 0, return transparent color
    if (outAlpha === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    
    // Calculate the blended color components
    const outR = Math.round((r1 * alpha1 * (1 - alpha2) + r2 * alpha2) / outAlpha);
    const outG = Math.round((g1 * alpha1 * (1 - alpha2) + g2 * alpha2) / outAlpha);
    const outB = Math.round((b1 * alpha1 * (1 - alpha2) + b2 * alpha2) / outAlpha);
    const outA = Math.round(outAlpha * 255);
    
    return { r: outR, g: outG, b: outB, a: outA };
  }
}