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
    
    // Add cardinal point fixes to address stray pixels
    const rightCardinalFix = Math.round(cX + outerRadius - 0.5);
    const bottomCardinalFix = Math.round(cY + outerRadius - 0.5);
    
    // Fix for fill cardinal points too
    const topFillCardinal = Math.round(cY - fillRadius);
    const leftFillCardinal = Math.round(cX - fillRadius);
    const rightFillCardinalFix = Math.round(cX + fillRadius - 0.5);
    const bottomFillCardinalFix = Math.round(cY + fillRadius - 0.5);
    
    // Add left and top cardinal fixed points
    const leftFillCardinalFix = leftFillCardinal;
    const topFillCardinalFix = topFillCardinal;
    
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
      const cardinalFillPoints = new Set();
      
      // 1. STEP: Fill center with uniform fill (no distance checks needed)
      if (centerRegionSize > 0) {
        for (let y = Math.max(minY, centerTop); y <= Math.min(maxY, centerBottom); y++) {
          for (let x = Math.max(minX, centerLeft); x <= Math.min(maxX, centerRight); x++) {
            const dx = x - cX;
            const dy = y - cY;
            const distSquared = dx * dx + dy * dy;
            
            if (distSquared <= fillRadiusSquared) {
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
        // Apply horizontal adjustments based on position
        let xAdjust = 0;
        if (x < cX) xAdjust = leftAdjust;
        else if (x > cX) xAdjust = rightAdjust;
        
        const dx = x - (cX + xAdjust);
        const dxSquared = dx * dx;
        const fillDistSquared = fillRadiusSquared - dxSquared;
        
        if (fillDistSquared >= 0) {
          const fillYDist = Math.sqrt(fillDistSquared);
          
          // Apply boundary checking for column with same adjustments as stroke
          const topFillY = Math.max(minY, Math.floor(cY - fillYDist + topAdjust));
          const bottomFillY = Math.min(maxY, Math.ceil(cY + fillYDist + bottomAdjust));
          
          // Only scan within horizontal band
          const startY = Math.max(topFillY, fillHorizBandTop);
          const endY = Math.min(bottomFillY, fillHorizBandBottom);
          
          for (let y = startY; y <= endY; y++) {
            // Skip cardinal points - we'll handle these specially like in stroke
            if ((x === rightFillCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomFillCardinal && Math.abs(x - cX) < 2) ||
                (x === leftFillCardinal && Math.abs(y - cY) < 2) || 
                (y === topFillCardinal && Math.abs(x - cX) < 2)) {
              
              // Use modified coordinates for cardinal points
              let modX = x;
              let modY = y;
              
              if (x === rightFillCardinal && Math.abs(y - cY) < 0.5) {
                modX = rightFillCardinalFix;
              }
              if (y === bottomFillCardinal && Math.abs(x - cX) < 0.5) {
                modY = bottomFillCardinalFix;
              }
              // More aggressive adjustment for left/top edges
              if (x === leftFillCardinal) {
                modX = leftFillCardinal;
              }
              if (y === topFillCardinal) {
                modY = topFillCardinal;
              }
              
              cardinalFillPoints.add(`${modX},${modY}`);
              continue;
            }
            
            // Check if already filled
            const pixelKey = `${x},${y}`;
            if (filledPixels.has(pixelKey)) {
              continue;
            }
            
            // Apply vertical adjustments based on position
            let yAdjust = 0;
            if (y < cY) yAdjust = topAdjust;
            else if (y > cY) yAdjust = bottomAdjust;
            
            const dy = y - (cY + yAdjust);
            const distFromCenterSquared = dxSquared + dy * dy;
            
            // Check if pixel is within fill radius
            if (distFromCenterSquared <= fillRadiusSquared) {
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
              filledPixels.add(pixelKey);
            }
          }
        }
      }
      
      // 3. STEP: Fill vertical band with horizontal scanning (row by row)
      for (let y = minY; y <= maxY; y++) {
        // Apply vertical adjustments based on position
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        const dy = y - (cY + yAdjust);
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          
          // Apply boundary checking for row with same adjustments as stroke
          const leftFillX = Math.max(minX, Math.floor(cX - fillXDist + leftAdjust));
          const rightFillX = Math.min(maxX, Math.ceil(cX + fillXDist + rightAdjust));
          
          for (let x = leftFillX; x <= rightFillX; x++) {
            // Skip cardinal points - handled in special pass
            if ((x === rightFillCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomFillCardinal && Math.abs(x - cX) < 2) ||
                (x === leftFillCardinal && Math.abs(y - cY) < 2) || 
                (y === topFillCardinal && Math.abs(x - cX) < 2)) {
              
              // Use modified coordinates for cardinal points
              let modX = x;
              let modY = y;
              
              if (x === rightFillCardinal && Math.abs(y - cY) < 0.5) {
                modX = rightFillCardinalFix;
              }
              if (y === bottomFillCardinal && Math.abs(x - cX) < 0.5) {
                modY = bottomFillCardinalFix;
              }
              // More aggressive adjustment for left/top edges
              if (x === leftFillCardinal) {
                modX = leftFillCardinal;
              }
              if (y === topFillCardinal) {
                modY = topFillCardinal;
              }
              
              cardinalFillPoints.add(`${modX},${modY}`);
              continue;
            }
            
            // Special case for rightmost and bottommost points, copied from stroke logic
            if ((x === rightFillCardinal || x === rightFillCardinal + 1) && 
                Math.abs(y - cY) < 1.5) {
              // Skip the rightmost spurious pixel
              if (x === rightFillCardinal + 1) continue;
            }
            
            if ((y === bottomFillCardinal || y === bottomFillCardinal + 1) && 
                Math.abs(x - cX) < 1.5) {
              // Skip the bottommost spurious pixel
              if (y === bottomFillCardinal + 1) continue;
            }
            
            // Check if already filled
            const pixelKey = `${x},${y}`;
            if (filledPixels.has(pixelKey)) {
              continue;
            }
            
            // Apply horizontal adjustments based on position
            let xAdjust = 0;
            if (x < cX) xAdjust = leftAdjust;
            else if (x > cX) xAdjust = rightAdjust;
            
            const dx = x - (cX + xAdjust);
            const distFromCenterSquared = dx * dx + dySquared;
            
            // Check if pixel is within fill radius
            if (distFromCenterSquared <= fillRadiusSquared) {
              this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
              filledPixels.add(pixelKey);
            }
          }
        }
      }
      
      // 4. STEP: Handle cardinal points specially, mimicking stroke's approach
      for (const point of cardinalFillPoints) {
        const [x, y] = point.split(',').map(Number);
        
        // Apply adjustments
        let xAdjust = 0;
        if (x < cX) xAdjust = leftAdjust;
        else if (x > cX) xAdjust = rightAdjust;
        
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        const dx = x - (cX + xAdjust);
        const dy = y - (cY + yAdjust);
        const distFromCenterSquared = dx * dx + dy * dy;
        
        // Add specific fill for top and left cardinal points
        // These are the most likely to have missing pixels
        if (x === leftFillCardinal || y === topFillCardinal) {
          // Exactly at the edges - make sure we draw these
          if (Math.abs(distFromCenterSquared - fillRadiusSquared) < fillRadius) {
            this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
            filledPixels.add(`${x},${y}`);
            // Use fixed cardinal points
          }
        }
        
        if (distFromCenterSquared <= fillRadiusSquared) {
          // Special case handling for cardinal points
          if ((x === rightFillCardinal + 1) || (y === bottomFillCardinal + 1) ||
              (x === leftFillCardinal - 1) || (y === topFillCardinal - 1)) {
            continue; // Skip spurious pixels
          }
          
          // Check for cardinal points that need adjustment
          const isRightFillEdge = (x === rightFillCardinal && Math.abs(y - cY) < 1.5);
          const isBottomFillEdge = (y === bottomFillCardinal && Math.abs(x - cX) < 1.5);
          const isLeftFillEdge = (x === leftFillCardinal && Math.abs(y - cY) < 1.5);
          const isTopFillEdge = (y === topFillCardinal && Math.abs(x - cX) < 1.5);
          
          // Create a pixel key that uses adjusted coordinates if needed
          let adjustedX = x;
          let adjustedY = y;
          
          if (isRightFillEdge) adjustedX = rightFillCardinalFix;
          if (isBottomFillEdge) adjustedY = bottomFillCardinalFix;
          
          // More aggressive handling for left and top edges
          // Ensure we draw at exact cardinal points for left/top
          if (isLeftFillEdge) adjustedX = leftFillCardinalFix;
          if (isTopFillEdge) adjustedY = topFillCardinalFix;
          
          const pixelKey = `${adjustedX},${adjustedY}`;
          
          // Check if already filled
          if (!filledPixels.has(pixelKey)) {
            // Draw using the adjusted coordinates
            this.pixelRenderer.setPixel(adjustedX, adjustedY, fillR, fillG, fillB, fillA);
            filledPixels.add(pixelKey);
          }
        }
      }
    }
    
    // Then draw stroke on top of fill
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      const cardinalPoints = new Set();
      const drawnStrokePixels = new Set(); // Track drawn stroke pixels to prevent double-drawing
      
      // The radius at which we switch scan directions - choose the larger dimension
      const strokeMidRadius = (outerRadius + innerRadius) / 2;
      const strokeSectionSize = Math.ceil(strokeMidRadius * 1.0); // Use full radius for complete coverage
      
      // Define horizontal and vertical bands for the stroke
      const strokeHorizBandTop = Math.max(minY, Math.floor(cY - strokeSectionSize));
      const strokeHorizBandBottom = Math.min(maxY, Math.ceil(cY + strokeSectionSize));
      
      // 1. STEP: Draw horizontal band with vertical scanning (column by column)
      for (let x = minX; x <= maxX; x++) {
        // Apply horizontal adjustments based on position
        let xAdjust = 0;
        if (x < cX) xAdjust = leftAdjust;
        else if (x > cX) xAdjust = rightAdjust;
        
        const dx = x - (cX + xAdjust);
        const dxSquared = dx * dx;
        const outerDistSquared = outerRadiusSquared - dxSquared;
        
        if (outerDistSquared >= 0) {
          const outerYDist = Math.sqrt(outerDistSquared);
          
          // Apply boundary checking
          const topEdge = Math.max(minY, Math.floor(cY - outerYDist + topAdjust));
          const bottomEdge = Math.min(maxY, Math.ceil(cY + outerYDist + bottomAdjust));
          
          // Only scan within horizontal band
          const startY = Math.max(topEdge, strokeHorizBandTop);
          const endY = Math.min(bottomEdge, strokeHorizBandBottom);
          
          for (let y = startY; y <= endY; y++) {
            // Skip cardinal points - we'll handle these specially
            if ((x === rightCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomCardinal && Math.abs(x - cX) < 2)) {
              // Use modified coordinates for cardinal points
              let modX = x;
              let modY = y;
              if (x === rightCardinal && Math.abs(y - cY) < 0.5) {
                modX = rightCardinalFix;
              }
              if (y === bottomCardinal && Math.abs(x - cX) < 0.5) {
                modY = bottomCardinalFix;
              }
              cardinalPoints.add(`${modX},${modY}`);
              continue;
            }
            
            // Check if already drawn
            const pixelKey = `${x},${y}`;
            if (drawnStrokePixels.has(pixelKey)) {
              continue;
            }
            
            // Apply vertical adjustments based on position
            let yAdjust = 0;
            if (y < cY) yAdjust = topAdjust;
            else if (y > cY) yAdjust = bottomAdjust;
            
            const dy = y - (cY + yAdjust);
            const distFromCenterSquared = dxSquared + dy * dy; // Reuse dxSquared
            
            // Check if pixel is within the stroke area
            if (distFromCenterSquared <= outerRadiusSquared) {
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
        
        // Apply vertical adjustments based on position
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        const dy = y - (cY + yAdjust);
        const dySquared = dy * dy;
        const outerDistSquared = outerRadiusSquared - dySquared;
        
        if (outerDistSquared >= 0) {
          const outerXDist = Math.sqrt(outerDistSquared);
          
          // Apply boundary checking
          const leftEdge = Math.max(minX, Math.floor(cX - outerXDist + leftAdjust));
          const rightEdge = Math.min(maxX, Math.ceil(cX + outerXDist + rightAdjust));
          
          for (let x = leftEdge; x <= rightEdge; x++) {
            // Skip cardinal points
            if ((x === rightCardinal && Math.abs(y - cY) < 2) || 
                (y === bottomCardinal && Math.abs(x - cX) < 2)) {
              // Use modified coordinates for cardinal points
              let modX = x;
              let modY = y;
              if (x === rightCardinal && Math.abs(y - cY) < 0.5) {
                modX = rightCardinalFix;
              }
              if (y === bottomCardinal && Math.abs(x - cX) < 0.5) {
                modY = bottomCardinalFix;
              }
              cardinalPoints.add(`${modX},${modY}`);
              continue;
            }
            
            // Check if already drawn
            const pixelKey = `${x},${y}`;
            if (drawnStrokePixels.has(pixelKey)) {
              continue;
            }
            
            // Apply horizontal adjustments based on position
            let xAdjust = 0;
            if (x < cX) xAdjust = leftAdjust;
            else if (x > cX) xAdjust = rightAdjust;
            
            const dx = x - (cX + xAdjust);
            const distFromCenterSquared = dx * dx + dySquared;
            
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
      
      // 3. STEP: Handle cardinal points specially
      for (const point of cardinalPoints) {
        const [x, y] = point.split(',').map(Number);
        
        // Apply adjustments
        let xAdjust = 0;
        if (x < cX) xAdjust = leftAdjust;
        else if (x > cX) xAdjust = rightAdjust;
        
        let yAdjust = 0;
        if (y < cY) yAdjust = topAdjust;
        else if (y > cY) yAdjust = bottomAdjust;
        
        const dx = x - (cX + xAdjust);
        const dy = y - (cY + yAdjust);
        const distFromCenterSquared = dx * dx + dy * dy;
        
        if (distFromCenterSquared <= outerRadiusSquared) {
          if (innerRadius <= 0 || distFromCenterSquared >= innerRadiusSquared) {
            // Special case handling for cardinal points
            if ((x === rightCardinal + 1) || (y === bottomCardinal + 1) ||
                (x === rightCardinal && Math.abs(y - cY) < 0.5) ||
                (y === bottomCardinal && Math.abs(x - cX) < 0.5)) {
              continue; // Skip spurious pixels
            }
            
            // Check for cardinal points that need adjustment
            const isRightCardinal = (x === rightCardinal && Math.abs(y - cY) < 1.5);
            const isBottomCardinal = (y === bottomCardinal && Math.abs(x - cX) < 1.5);
            
            // Create a pixel key that uses adjusted coordinates if needed
            const adjustedX = isRightCardinal ? rightCardinalFix : x;
            const adjustedY = isBottomCardinal ? bottomCardinalFix : y;
            const pixelKey = `${adjustedX},${adjustedY}`;
            
            // Check if already drawn
            if (!drawnStrokePixels.has(pixelKey)) {
              // Draw using the adjusted coordinates
              this.pixelRenderer.setPixel(adjustedX, adjustedY, strokeR, strokeG, strokeB, strokeA);
              drawnStrokePixels.add(pixelKey);
            }
          }
        }
      }
    }
  }
}