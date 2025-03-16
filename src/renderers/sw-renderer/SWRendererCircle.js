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

    // leaving this as a separate function for now because I think we might use
    // variants of this function to draw quarter-circles and arbitrary arcs in the
    // future.
    this.drawFullCircle(
      center.x, center.y, 
      innerRadius, outerRadius,
      fillR, fillG, fillB, fillA,
      strokeR, strokeG, strokeB, strokeA
    );
  }

  drawFullCircle(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

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
    
    
    // Draw fill first using analytical edge detection for maximum efficiency
    if (fillA > 0) {
      //console.log("Using optimized analytical fill method");
      
      // Fill the circle using row-by-row scanning with analytical edge detection
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        // Skip rows that don't intersect with the circle
        if (fillDistSquared < 0) continue;
        
        // Calculate horizontal span for this row using a single sqrt operation
        const fillXDist = Math.sqrt(fillDistSquared);
        
        // Calculate precise boundaries for this row with a small correction
        // The tiny offset prevents "speckles" at the extremes of the circle
        const leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001)); // Add tiny offset to prevent speckle
        const rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001)); // Subtract tiny offset to prevent speckle
        
        // Debug logging for some rows
        //if ((y - minY) % 50 === 0) {
        //  console.log(`Fill row ${y}: span from ${leftFillX} to ${rightFillX}`);
        //}
        
        // Fill entire span without per-pixel distance check - much more efficient
        for (let x = leftFillX; x <= rightFillX; x++) {
          this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }
    
    // Then draw stroke on top of fill
    if (strokeA > 0 && outerRadius > innerRadius) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // IMPORTANT: Using precise mathematical partitioning at 45° tangent points
      // This eliminates the need for tracking drawn pixels
      //console.log("Precise mathematical partitioning at 45° tangent points:");
      //console.log(`- Center: (${cX}, ${cY}), Radius: inner=${innerRadius}, outer=${outerRadius}`);
      //console.log("- Using exact 45° lines to divide regions (where |x-cX| = |y-cY|)");
      //console.log("- Each pixel processed exactly once (no tracking needed)");
      
      // 1. STEP: Draw LEFT and RIGHT sides with column-by-column scanning
      // These regions are where |x-cX| >= |y-cY| (i.e., more horizontal distance than vertical)
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cX;
        const dxSquared = dx * dx;
        const absXDist = Math.abs(dx);
        
        // Skip if outside outer circle
        if (dxSquared > outerRadiusSquared) continue;
        
        // Process this column to see if it's entirely inside the inner circle
        // We'll track if any stroke pixels are drawn in this column
        let anyStrokePixelsDrawn = false;
        
        // Calculate outer intersections
        const outerYDist = Math.sqrt(outerRadiusSquared - dxSquared);
        const outerTopY = Math.max(minY, Math.ceil(cY - outerYDist));
        const outerBottomY = Math.min(maxY, Math.floor(cY + outerYDist));
        
        // Debug logging for a sample of columns
        //if (x % 20 === 0) {
        //  console.log(`Left-right processing: x=${x}, y range=${outerTopY}-${outerBottomY}`);
        //}
        
        // Case: No inner intersection on this column
        if (innerRadius <= 0 || dxSquared > innerRadiusSquared) {
          // Process vertical segment with 45° check
          for (let y = outerTopY; y <= outerBottomY; y++) {
            const dy = y - cY;
            const absYDist = Math.abs(dy);
            
            // CRITICAL: Only process pixels in left-right regions (|x-cX| >= |y-cY|)
            // This is the exact 45° partitioning
            if (absXDist < absYDist) continue;
            
            // Draw this pixel (in left-right region)
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
            anyStrokePixelsDrawn = true;
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerYDist = Math.sqrt(innerRadiusSquared - dxSquared);
          const innerTopY = Math.min(outerBottomY, Math.floor(cY - innerYDist));
          const innerBottomY = Math.max(outerTopY, Math.ceil(cY + innerYDist));
          
          // Draw top segment (from outer top to inner top)
          for (let y = outerTopY; y <= innerTopY; y++) {
            const dy = y - cY;
            const absYDist = Math.abs(dy);
            
            // Only process pixels in left-right regions (|x-cX| >= |y-cY|)
            if (absXDist < absYDist) continue;
            
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
            anyStrokePixelsDrawn = true;
          }
          
          // Draw bottom segment (from inner bottom to outer bottom)
          for (let y = innerBottomY; y <= outerBottomY; y++) {
            const dy = y - cY;
            const absYDist = Math.abs(dy);
            
            // Only process pixels in left-right regions (|x-cX| >= |y-cY|)
            if (absXDist < absYDist) continue;
            
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
            anyStrokePixelsDrawn = true;
          }
        }
        
        // OPTIMIZATION: If we didn't draw any pixels in this column and we're processing the left half,
        // we can skip directly to the symmetrically opposite column on the right
        if (!anyStrokePixelsDrawn && x < cX) {
          // Calculate the symmetrically opposite column
          const skipToX = Math.ceil(cX + (cX - x));
          
          // Only skip if it would save us some columns
          if (skipToX > x) {
            // Debug logging for significant skips
            //if (skipToX - x > 20) {
            //  console.log(`Column ${x} had no stroke pixels - skipping to column ${skipToX}`);
            //}
            
            x = skipToX - 1; // -1 because the loop will increment x
          }
        }
      }
      
      // 2. STEP: Draw TOP and BOTTOM with row-by-row scanning
      // These regions are where |y-cY| > |x-cX| (i.e., more vertical distance than horizontal)
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const absYDist = Math.abs(dy);
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
        
        // We'll track if any stroke pixels are drawn in this row
        let anyStrokePixelsDrawn = false;
        
        // Calculate outer intersections
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Debug logging for a sample of rows
        //if (y % 20 === 0) {
        //  console.log(`Top-bottom processing: y=${y}, x range=${outerLeftX}-${outerRightX}`);
        //}
        
        // Case: No inner intersection on this row
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // Process horizontal segment with 45° check
          for (let x = outerLeftX; x <= outerRightX; x++) {
            const dx = x - cX;
            const absXDist = Math.abs(dx);
            
            // CRITICAL: Only process pixels in top-bottom regions (|y-cY| > |x-cX|)
            // This is the exact complement to the left-right regions
            if (absYDist <= absXDist) continue;
            
            // Draw this pixel (in top-bottom region)
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
            anyStrokePixelsDrawn = true;
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Draw left segment (from outer left to inner left)
          for (let x = outerLeftX; x <= innerLeftX; x++) {
            const dx = x - cX;
            const absXDist = Math.abs(dx);
            
            // Only process pixels in top-bottom regions (|y-cY| > |x-cX|)
            if (absYDist <= absXDist) continue;
            
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
            anyStrokePixelsDrawn = true;
          }
          
          // Draw right segment (from inner right to outer right)
          for (let x = innerRightX; x <= outerRightX; x++) {
            const dx = x - cX;
            const absXDist = Math.abs(dx);
            
            // Only process pixels in top-bottom regions (|y-cY| > |x-cX|)
            if (absYDist <= absXDist) continue;
            
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
            anyStrokePixelsDrawn = true;
          }
        }
        
        // OPTIMIZATION: If we didn't draw any pixels in this row and we're processing the top half,
        // we can skip directly to the symmetrically opposite row on the bottom
        if (!anyStrokePixelsDrawn && y < cY) {
          // Calculate the symmetrically opposite row
          const skipToY = Math.ceil(cY + (cY - y));
          
          // Only skip if it would save us some rows
          if (skipToY > y) {
            // Debug logging for significant skips
            //if (skipToY - y > 20) {
            //  console.log(`Row ${y} had no stroke pixels - skipping to row ${skipToY}`);
            //}
            
            y = skipToY - 1; // -1 because the loop will increment y
          }
        }
      }

    }
  }
}