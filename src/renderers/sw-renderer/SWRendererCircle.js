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

    // Check for no fill and 1px stroke case - special optimization
    const hasFill = fillA > 0;
    const is1pxStroke = strokeWidth === 1 && strokeA > 0;

    if (!hasFill && is1pxStroke) {
      // Optimize for 1px stroke with no fill using Bresenham circle algorithm
      this.drawFullCircleBresenham(
        center.x, center.y, 
        radius,
        strokeR, strokeG, strokeB, strokeA
      );
      return;
    }

    const innerRadius = strokeWidth > 0 ? radius - strokeWidth / 2 : radius;
    const outerRadius = radius + strokeWidth / 2;

    // leaving this as a separate function for now because I think we might use
    // variants of this function to draw quarter-circles and arbitrary arcs in the
    // future.
    this.drawFullCircleFast(
      center.x, center.y, 
      innerRadius, outerRadius,
      fillR, fillG, fillB, fillA,
      strokeR, strokeG, strokeB, strokeA
    );
  }

  drawFullCircleSlow(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

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

  drawFullCircleFast(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

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
    
    // Arrays to collect pixel runs for batch rendering
    const fillRuns = [];
    const strokeRuns = [];
    
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
        
        // Calculate the length of the run
        const length = rightFillX - leftFillX + 1;
        
        // Only add runs with positive length
        if (length > 0) {
          // Add the pixel run to the collection
          fillRuns.push(leftFillX, y, length);
        }
      }
      
      // Render all fill runs in a single batch operation
      if (fillRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(fillRuns, fillR, fillG, fillB, fillA);
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
          // Add the entire horizontal line as a single run
          const length = outerRightX - outerLeftX + 1;
          if (length > 0) {
            strokeRuns.push(outerLeftX, y, length);
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Add left segment (from outer left to inner left)
          const leftLength = innerLeftX - outerLeftX + 1;
          if (leftLength > 0) {
            strokeRuns.push(outerLeftX, y, leftLength);
          }
          
          // Add right segment (from inner right to outer right)
          const rightLength = outerRightX - innerRightX + 1;
          if (rightLength > 0) {
            strokeRuns.push(innerRightX, y, rightLength);
          }
        }
      }
      
      // Render all stroke runs in a single batch operation
      if (strokeRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(strokeRuns, strokeR, strokeG, strokeB, strokeA);
      }
    }
    
    // Case 3: Both fill and stroke - collect runs for both operations
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
        
        // STEP 1: Collect fill runs if this row intersects the fill circle
        if (leftFillX >= 0) {
          const fillLength = rightFillX - leftFillX + 1;
          if (fillLength > 0) {
            fillRuns.push(leftFillX, y, fillLength);
          }
        }
        
        // STEP 2: Collect stroke runs
        if (innerRadius <= 0 || dySquared > innerRadiusSquared) {
          // No inner circle intersection - collect the entire stroke span
          const strokeLength = outerRightX - outerLeftX + 1;
          if (strokeLength > 0) {
            strokeRuns.push(outerLeftX, y, strokeLength);
          }
        } 
        else {
          // Intersects both inner and outer circles - collect two stroke spans
          
          // Collect left segment of stroke (from outer left to inner left)
          const leftStrokeLength = innerLeftX - outerLeftX + 1;
          if (leftStrokeLength > 0) {
            strokeRuns.push(outerLeftX, y, leftStrokeLength);
          }
          
          // Collect right segment of stroke (from inner right to outer right)
          const rightStrokeLength = outerRightX - innerRightX + 1;
          if (rightStrokeLength > 0) {
            strokeRuns.push(innerRightX, y, rightStrokeLength);
          }
        }
      }
      
      // Render all fill runs first (so stroke will be on top)
      if (fillRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(fillRuns, fillR, fillG, fillB, fillA);
      }
      
      // Render all stroke runs
      if (strokeRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(strokeRuns, strokeR, strokeG, strokeB, strokeA);
      }
    }
  }

  // Not used. The idea was that in tha case we have both a stroke and a fill,
  // we could collect the runs for both, and then render them in a single batch operation that
  // scans the rows from top to bottom only once, for each line drawing the fill and then stroke
  // The hope was that although the number of set pixels doesn't change, this would be more cache-friendly
  // as it scans the lines sequentially only once (instead of twice), and therefore faster.
  // However, this was not faster than the other approach of doing first a pass for the fill,
  // and then for the stroke.
  drawFullCircleFastest(centerX, centerY, innerRadius, outerRadius, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {

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
    
    // Arrays to collect pixel runs for batch rendering
    const fillRuns = [];
    const strokeRuns = [];
    const combinedRuns = [];
    
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
        
        // Calculate the length of the run
        const length = rightFillX - leftFillX + 1;
        
        // Only add runs with positive length
        if (length > 0) {
          // Add the pixel run to the collection
          fillRuns.push(leftFillX, y, length);
        }
      }
      
      // Render all fill runs in a single batch operation
      if (fillRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(fillRuns, fillR, fillG, fillB, fillA);
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
          // Add the entire horizontal line as a single run
          const length = outerRightX - outerLeftX + 1;
          if (length > 0) {
            strokeRuns.push(outerLeftX, y, length);
          }
        } 
        // Case: Intersects both inner and outer circles
        else {
          const innerXDist = Math.sqrt(innerRadiusSquared - dySquared);
          const innerLeftX = Math.min(outerRightX, Math.floor(cX - innerXDist));
          const innerRightX = Math.max(outerLeftX, Math.ceil(cX + innerXDist));
          
          // Add left segment (from outer left to inner left)
          const leftLength = innerLeftX - outerLeftX + 1;
          if (leftLength > 0) {
            strokeRuns.push(outerLeftX, y, leftLength);
          }
          
          // Add right segment (from inner right to outer right)
          const rightLength = outerRightX - innerRightX + 1;
          if (rightLength > 0) {
            strokeRuns.push(innerRightX, y, rightLength);
          }
        }
      }
      
      // Render all stroke runs in a single batch operation
      if (strokeRuns.length > 0) {
        this.pixelRenderer.setPixelRuns(strokeRuns, strokeR, strokeG, strokeB, strokeA);
      }
    }
    
    // Case 3: Both fill and stroke - use the optimized combined method
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
        let fillLength = 0;
        
        if (fillDistSquared >= 0) {
          const fillXDist = Math.sqrt(fillDistSquared);
          leftFillX = Math.max(minX, Math.ceil(cX - fillXDist + 0.0001));
          rightFillX = Math.min(maxX, Math.floor(cX + fillXDist - 0.0001));
          fillLength = rightFillX - leftFillX + 1;
        }
        
        // Collect stroke segments
        let leftStrokeX = -1;
        let leftStrokeLength = 0;
        let rightStrokeX = -1;
        let rightStrokeLength = 0;
        
        if (innerRadius < 0 || dySquared > innerRadiusSquared) {
          // No inner circle intersection - collect the entire stroke span
          leftStrokeX = outerLeftX;
          leftStrokeLength = outerRightX - outerLeftX + 1;
          // No right stroke in this case
        } 
        else {
          // Intersects both inner and outer circles - collect two stroke spans
          
          // Left segment of stroke (from outer left to inner left)
          leftStrokeX = outerLeftX;
          leftStrokeLength = innerLeftX - outerLeftX + 1;
          
          // Right segment of stroke (from inner right to outer right)
          rightStrokeX = innerRightX;
          rightStrokeLength = outerRightX - innerRightX + 1;
        }
        
        // Add entry to combined runs array: [xFill, fillLen, xStroke1, stroke1Len, xStroke2, stroke2Len]
        // If a segment doesn't exist, use -1 for both x and length
        combinedRuns.push(
          fillLength > 0 ? leftFillX : -1,
          fillLength > 0 ? fillLength : -1,
          leftStrokeLength > 0 ? leftStrokeX : -1,
          leftStrokeLength > 0 ? leftStrokeLength : -1,
          rightStrokeLength > 0 ? rightStrokeX : -1,
          rightStrokeLength > 0 ? rightStrokeLength : -1
        );
      }
      
      // Render all runs in a single combined batch operation
      if (combinedRuns.length > 0) {
        this.pixelRenderer.setPixelFillAndStrokeRuns(minY, combinedRuns, 
          fillR, fillG, fillB, fillA, 
          strokeR, strokeG, strokeB, strokeA);
      }
    }
  }

  /**
   * Optimized method for drawing a circle with 1px stroke and no fill using Bresenham's algorithm.
   * Uses floor(radius) for Bresenham path, then explicitly adds floor-based boundary pixels.
   * @param {Number} centerX - X coordinate of circle center (can be float)
   * @param {Number} centerY - Y coordinate of circle center (can be float)
   * @param {Number} radius - Radius of the circle (can be float)
   * @param {Number} r - Red component of stroke color (0-255)
   * @param {Number} g - Green component of stroke color (0-255)
   * @param {Number} b - Blue component of stroke color (0-255)
   * @param {Number} a - Alpha component of stroke color (0-255)
   */
  drawFullCircleBresenham(centerX, centerY, radius, r, g, b, a) {
    // --- Input Validation and Early Exit ---
    if (radius < 0) return;

    const globalAlpha = this.pixelRenderer.context.globalAlpha;
    if (a === 0 || globalAlpha <= 0) return;

    // --- Coordinate and Parameter Preparation ---

    // Integer center anchor points using floor() for Bresenham algorithm origin
    const cX_floor = Math.floor(centerX);
    const cY_floor = Math.floor(centerY);

    // Use floored radius for the main Bresenham path generation.
    // This ensures top/left boundaries are met and right/bottom don't exceed floor(c+r).
    const intRadius_floor = Math.floor(radius);

    // Calculate the strict target pixel boundaries using floor()
    const minX = Math.floor(centerX - radius);
    const maxX = Math.floor(centerX + radius);
    const minY = Math.floor(centerY - radius);
    const maxY = Math.floor(centerY + radius); // <-- Corrected line ending

    // Rounded integer center needed for placing forced boundary pixels on centerlines
    const cX_round = Math.round(centerX);
    const cY_round = Math.round(centerY);


    // --- Caching and Canvas Bounds Check ---
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;

    // Preliminary check using the strict floor bounds.
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) {
        return; // No part of the strict bounding box is on canvas
    }

    // --- Handle Radius Zero / Small Cases ---
    if (radius === 0) {
        // Check if the single pixel (using rounded center) falls within the strict bounds
        if (cX_round >= minX && cX_round <= maxX && cY_round >= minY && cY_round <= maxY) {
            this.setPixel(cX_round, cY_round, r, g, b, a);
        }
        return;
    }
    // If radius is small but > 0, floor(radius) might be 0.
    if (intRadius_floor < 0) { // Should only happen if input radius < 0, already handled.
      return; // Or handle 0 < radius < 1 case specifically if needed.
    }
    // If intRadius_floor is 0 (meaning 0 <= radius < 1)
    if (intRadius_floor === 0 && radius > 0) {
        // Draw the pixel at the rounded center if it's within the strict bounds.
        // For 0<r<1, min/max X/Y will typically be cX_floor/cX_floor+1 etc.
          if (cX_round >= minX && cX_round <= maxX && cY_round >= minY && cY_round <= maxY) {
            this.setPixel(cX_round, cY_round, r, g, b, a);
        }
        return;
    }
    // Now we expect intRadius_floor >= 1 for the main loop


    // --- Bresenham Algorithm Initialization (using Floor values) ---
    let x = 0;
    let y = intRadius_floor; // Use floored radius
    let d = 3 - 2 * intRadius_floor; // Decision parameter

    // Set to collect unique final pixels
    const finalPixels = new Set();

    // --- Helper to add pixels to the final set (checks bounds, clipping, uniqueness) ---
    const addPixelToSet = (px, py) => {
        // 1. Check canvas bounds
        if (px < 0 || px >= width || py < 0 || py >= height) return;
        // 3. Add unique pixel to the set
        finalPixels.add(`${px},${py}`);
    };

    // --- Bresenham Algorithm Loop (using Floor values) ---
    // Plot initial points using floor center and radius
    addPixelToSet(cX_floor + x, cY_floor + y);
    addPixelToSet(cX_floor - x, cY_floor + y);
    addPixelToSet(cX_floor + x, cY_floor - y);
    addPixelToSet(cX_floor - x, cY_floor - y);
    if (x !== y) {
        addPixelToSet(cX_floor + y, cY_floor + x);
        addPixelToSet(cX_floor - y, cY_floor + x);
        addPixelToSet(cX_floor + y, cY_floor - x);
        addPixelToSet(cX_floor - y, cY_floor - x);
    }


    while (x < y) { // Loop until x crosses y
        // Update Bresenham state FIRST
        if (d < 0) {
            // Move East
            d = d + 4 * x + 6;
            x++;
        } else {
            // Move South-East
            d = d + 4 * (x - y) + 10;
            x++;
            y--;
        }

        // Add the 8 symmetric points for the new (x, y) relative to floor center
        addPixelToSet(cX_floor + x, cY_floor + y);
        addPixelToSet(cX_floor - x, cY_floor + y);
        addPixelToSet(cX_floor + x, cY_floor - y);
        addPixelToSet(cX_floor - x, cY_floor - y);

        if (x !== y) { // Avoid double-plotting diagonal pixels
            addPixelToSet(cX_floor + y, cY_floor + x);
            addPixelToSet(cX_floor - y, cY_floor + x);
            addPixelToSet(cX_floor + y, cY_floor - x);
            addPixelToSet(cX_floor - y, cY_floor - x);
        }
    } // End while loop

    // --- Force Add Cardinal Boundary Pixels ---
    // Explicitly add the pixels at the min/max X/Y boundaries, using the
    // rounded center coordinates (cX_round, cY_round) for the axis alignment.
    // The addPixelToSet function handles bounds, clipping, and prevents duplicates.
    if (radius > 0) { // Only add boundary points if radius is positive
        addPixelToSet(minX, cY_round); // Leftmost on rounded horizontal center
        addPixelToSet(maxX, cY_round); // Rightmost on rounded horizontal center
        addPixelToSet(cX_round, minY); // Topmost on rounded vertical center
        addPixelToSet(cX_round, maxY); // Bottommost on rounded vertical center
    }


    // --- Render Final Pixels ---
    if (finalPixels.size > 0) {
        const pixelRuns = [];
        finalPixels.forEach(coordStr => {
            const [px, py] = coordStr.split(',').map(Number);
            pixelRuns.push(px, py, 1); // Add x, y, runLength=1
        });

        // Render all pixels in a single batch
        // Assuming setPixelRuns handles alpha blending internally based on 'a' and globalAlpha
        this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);

    }
  }

}