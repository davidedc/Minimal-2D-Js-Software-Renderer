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

    // TODO: In "drawCircle", calling "drawPreciseCircle": unclear what this "precise" adjective is for really.
    // Also - since this is the one and only implementation backing "drawCircle", should we just
    // put the drawPreciseCircle directly in here? What's the point of the indirection?
    this.drawPreciseCircle(
      center.x, center.y, 
      innerRadius, outerRadius,
      fillR, fillG, fillB, fillA,
      strokeR, strokeG, strokeB, strokeA
    );
  }

  drawPreciseCircle(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

    // This routine currently accepts and in fact "represents in the rendering" fractional coordinates.
    // Although it might seem surprising that an aliased renderer can meaningfully represent fractional coordinates,
    // it is indeed the case. Intuitively, imagine a circle that shifts slowly right by a very small fractional amount.
    // The effect is that, even if only "whole pixels" are drawn, if the circle barely touches the last column,
    // 1 pixel will be drawn on the last column, but if the circle moves just a bit further, 2 pixels will be drawn on the last column, etc.
    // Also note that this way the circle will not be perfectly simmetrical.


    // If instead you round to nearest half-integer, you'll snap the circle to discrete positions for a slightly different look
    // (which will be inevitably less similar to the canvas rendering).
    // The advantage of this snapping is that the circle will be perfectly simmetrical both vertically and horizontally.
    // In fact, it would be possible to draw thw whole circle by drawing 1/8th of the circle, and doing simple reflections
    // (however, this is not implemented yet).
    //
    //centerX = Math.round(centerX * 2) / 2;
    //centerY = Math.round(centerY * 2) / 2;    
    //innerRadius = Math.round(innerRadius * 2) / 2;
    //outerRadius = Math.round(outerRadius * 2) / 2;

    // Use exact integer centers to avoid extra pixels at edges
    const cX = centerX - 0.5;
    const cY = centerY - 0.5;
    
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
    
    
    // Regions for optimized drawing:
    // 1. Center region: uniform fill with distance checks
    const centerRegionSize = Math.floor(innerRadius * 0.5); // Keep center region smaller to avoid overdraw
    const centerLeft = Math.floor(cX - centerRegionSize);
    const centerRight = Math.ceil(cX + centerRegionSize);
    const centerTop = Math.floor(cY - centerRegionSize);
    const centerBottom = Math.ceil(cY + centerRegionSize);
    
    // 2. Define the horizontal and vertical sections for optimized scanning
    // Use different scan directions depending on the section
    // For areas outside these sections, we'll use a single scan direction based on radius
    const sectionSize = Math.ceil(fillRadius * 1.0); // Use full radius to ensure complete coverage
    
    // Draw fill first
    if (fillA > 0) {
      const filledPixels = new Set();
      
      // 1. STEP: Fill center with uniform fill (no distance checks needed)
      if (centerRegionSize > 0) {
        for (let y = Math.max(minY, centerTop); y <= Math.min(maxY, centerBottom); y++) {
          for (let x = Math.max(minX, centerLeft); x <= Math.min(maxX, centerRight); x++) {
            const dx = x - cX;
            const dy = y - cY;
            const distSquared = dx * dx + dy * dy;
            
            // Use strict comparison here too, for consistency
            if (distSquared < fillRadiusSquared) {
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
              filledPixels.add(`${x},${y}`);
            }
          }
        }
      }
      
      // Define horizontal and vertical bands for the fill like we do for stroke
      const fillSectionSize = Math.ceil(fillRadius * 1.0);
      const fillHorizBandTop = Math.max(minY, Math.floor(cY - fillSectionSize));
      const fillHorizBandBottom = Math.min(maxY, Math.ceil(cY + fillSectionSize));
      
      // 2. STEP: Fill horizontal band with vertical scanning (column by column)
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cX;
        const dxSquared = dx * dx;
        const fillDistSquared = fillRadiusSquared - dxSquared;
        
        if (fillDistSquared >= 0) {
          const fillYDist = Math.sqrt(fillDistSquared);
          
          // Apply boundary checking for column - use stricter bounds for top and bottom
          const topFillY = Math.max(minY, Math.ceil(cY - fillYDist));
          const bottomFillY = Math.min(maxY, Math.floor(cY + fillYDist));
          
          // Only scan within horizontal band
          const startY = Math.max(topFillY, fillHorizBandTop);
          const endY = Math.min(bottomFillY, fillHorizBandBottom);
          
          for (let y = startY; y <= endY; y++) {

            
            // Check if already filled
            const pixelKey = `${x},${y}`;
            if (filledPixels.has(pixelKey)) {
              continue;
            }
            
            const dy = y - cY;
            const distFromCenterSquared = dxSquared + dy * dy;
            
            // Check if pixel is within fill radius - use a slightly smaller threshold
            // for better edge appearance, especially on extremes (top, bottom, left, right)
            if (distFromCenterSquared < fillRadiusSquared) {
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
              filledPixels.add(pixelKey);
            }
          }
        }
      }
      
      // 3. STEP: Fill vertical band with horizontal scanning (row by row)
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          
          // Apply boundary checking for row - use stricter bounds for left and right
          const leftFillX = Math.max(minX, Math.ceil(cX - fillXDist));
          const rightFillX = Math.min(maxX, Math.floor(cX + fillXDist));
          
          for (let x = leftFillX; x <= rightFillX; x++) {
            
            
            // Check if already filled
            const pixelKey = `${x},${y}`;
            if (filledPixels.has(pixelKey)) {
              continue;
            }
            
            const dx = x - cX;
            const distFromCenterSquared = dx * dx + dySquared;
            
            // Check if pixel is within fill radius - use a slightly smaller threshold
            // for better edge appearance, especially on extremes (top, bottom, left, right)
            if (distFromCenterSquared < fillRadiusSquared) {
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
              filledPixels.add(pixelKey);
            }
          }
        }
      }
      

    }
    
    // Then draw stroke on top of fill
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      const drawnStrokePixels = new Set(); // Track drawn stroke pixels to prevent double-drawing
      
      // The radius at which we switch scan directions - choose the larger dimension
      const strokeMidRadius = (outerRadius + innerRadius) / 2;
      const strokeSectionSize = Math.ceil(strokeMidRadius * 1.0); // Use full radius for complete coverage
      
      // Define horizontal and vertical bands for the stroke
      const strokeHorizBandTop = Math.max(minY, Math.floor(cY - strokeSectionSize));
      const strokeHorizBandBottom = Math.min(maxY, Math.ceil(cY + strokeSectionSize));
      
      // 1. STEP: Draw horizontal band with vertical scanning (column by column)
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cX;
        const dxSquared = dx * dx;
        const outerDistSquared = outerRadiusSquared - dxSquared;
        
        if (outerDistSquared >= 0) {
          const outerYDist = Math.sqrt(outerDistSquared);
          
          // Apply boundary checking - use stricter bounds for top and bottom edges
          const topEdge = Math.max(minY, Math.ceil(cY - outerYDist));
          const bottomEdge = Math.min(maxY, Math.floor(cY + outerYDist));
          
          // Only scan within horizontal band
          const startY = Math.max(topEdge, strokeHorizBandTop);
          const endY = Math.min(bottomEdge, strokeHorizBandBottom);
          
          for (let y = startY; y <= endY; y++) {
            
            // Check if already drawn
            const pixelKey = `${x},${y}`;
            if (drawnStrokePixels.has(pixelKey)) {
              continue;
            }
            
            const dy = y - cY;
            const distFromCenterSquared = dxSquared + dy * dy; // Reuse dxSquared
            
            // Check if pixel is within the stroke area - using strict comparison for outer edge
            if (distFromCenterSquared < outerRadiusSquared) {
              if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
                // Draw the stroke
                this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
                drawnStrokePixels.add(pixelKey);
              }
            }
          }
        }
      }
      
      // 2. STEP: Draw vertical band with horizontal scanning (row by row)
      for (let y = minY; y <= maxY; y++) {
        // Don't skip any rows to ensure complete coverage of the stroke
        // The tracked pixels set will prevent duplicate drawing
        
        const dy = y - cY;
        const dySquared = dy * dy;
        const outerDistSquared = outerRadiusSquared - dySquared;
        
        if (outerDistSquared >= 0) {
          const outerXDist = Math.sqrt(outerDistSquared);
          
          // Apply boundary checking - use stricter bounds for left and right edges
          const leftEdge = Math.max(minX, Math.ceil(cX - outerXDist));
          const rightEdge = Math.min(maxX, Math.floor(cX + outerXDist));
          
          for (let x = leftEdge; x <= rightEdge; x++) {
            
            // Check if already drawn
            const pixelKey = `${x},${y}`;
            if (drawnStrokePixels.has(pixelKey)) {
              continue;
            }
            
            const dx = x - cX;
            const distFromCenterSquared = dx * dx + dySquared;
            
            // Check if pixel is within the stroke area - using strict comparison for outer edge
            if (distFromCenterSquared < outerRadiusSquared) {
              if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
                
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