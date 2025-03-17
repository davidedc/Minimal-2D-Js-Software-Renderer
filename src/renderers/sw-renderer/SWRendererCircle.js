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
    
    // Determine which rendering approach to use based on what we need to draw
    const hasFill = fillA > 0;
    const hasStroke = strokeA > 0 && outerRadius > innerRadius;
    
    // OPTIMIZATION: Choose the best rendering approach based on what's needed
    
    // Case 1: Fill only (no stroke)
    if (hasFill && !hasStroke) {
      // Fill the circle using row-by-row scanning with analytical edge detection
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        const fillDistSquared = fillRadiusSquared - dySquared;
        
        // Skip rows that don't intersect with the circle
        if (fillDistSquared < 0) continue;
        
        // Calculate horizontal span for this row using a single sqrt operation
        const fillXDist = Math.sqrt(fillDistSquared);
        
        // Calculate precise boundaries with small correction to prevent speckles
        const leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
        const rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        
        // Fill entire span without per-pixel distance check - much more efficient
        for (let x = leftFillX; x <= rightFillX; x++) {
          this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }
    
    // Case 2: Stroke only (no fill)
    else if (hasStroke && !hasFill) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
        
        // Calculate outer intersections
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Case: No inner intersection on this row
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // Draw the entire horizontal line
          for (let x = outerLeftX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Draw left segment (from outer left to inner left)
          for (let x = outerLeftX; x <= innerLeftX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
          
          // Draw right segment (from inner right to outer right)
          for (let x = innerRightX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        }
      }
    }
    
    // Case 3: Both fill and stroke - do them in a single scan for efficiency
    else if (hasFill && hasStroke) {
      const outerRadiusSquared = outerRadius * outerRadius;
      const innerRadiusSquared = innerRadius * innerRadius;
      
      // Process each row from top to bottom
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cY;
        const dySquared = dy * dy;
        
        // Skip if outside outer circle
        if (dySquared > outerRadiusSquared) continue;
                
        // Calculate outer circle intersections for this row (for stroke)
        const outerXDist = Math.sqrt(outerRadiusSquared - dySquared);
        const outerLeftX = Math.max(minX, Math.ceil(cX - outerXDist));
        const outerRightX = Math.min(maxX, Math.floor(cX + outerXDist));
        
        // Calculate inner circle intersections if needed
        let innerLeftX = -1;
        let innerRightX = -1;
        
        if (innerRadius > 0 && dySquared <= innerRadiusSquared) {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
        }
        
        // Calculate fill circle intersections if this row passes through the fill area
        const fillDistSquared = fillRadiusSquared - dySquared;
        let leftFillX = -1;
        let rightFillX = -1;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
          rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
        }
        
        // STEP 1: Draw the fill first (if this row intersects the fill circle)
        if (leftFillX >= 0) {
          for (let x = leftFillX; x <= rightFillX; x++) {
            this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
          }
        }
        
        // STEP 2: Draw the stroke on top
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // No inner circle intersection - draw the entire stroke span
          for (let x = outerLeftX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        } 
        else {
          // Intersects both inner and outer circles - draw two stroke spans
          
          // Draw left segment of stroke (from outer left to inner left)
          for (let x = outerLeftX; x <= innerLeftX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
          
          // Draw right segment of stroke (from inner right to outer right)
          for (let x = innerRightX; x <= outerRightX; x++) {
            this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
          }
        }
      }
    }
  }
}