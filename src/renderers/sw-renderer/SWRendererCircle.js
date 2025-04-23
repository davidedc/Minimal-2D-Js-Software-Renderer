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
      // Dispatch to either opaque or semi-transparent version based on alpha
      const isOpaque = strokeA === 255 && this.pixelRenderer.context.globalAlpha >= 1.0;
      
      if (isOpaque) {
        this.draw1PxStrokeFullCircleBresenhamOpaque(
          center.x, center.y, 
          radius,
          strokeR, strokeG, strokeB
        );
      } else {
        this.draw1PxStrokeFullCircleBresenhamAlpha(
          center.x, center.y, 
          radius,
          strokeR, strokeG, strokeB, strokeA
        );
      }
      return;
    }

    // Check for opaque fill with no stroke case - special optimization
    const hasStroke = strokeWidth > 0 && strokeA > 0;
    const isOpaqueFill = fillA === 255 && this.pixelRenderer.context.globalAlpha >= 1.0;
    
    
    if (hasFill && !hasStroke && isOpaqueFill) {
      // Optimize for opaque fill with no stroke using Bresenham circle algorithm
      this.drawOpaqueFillFullCircleBresenham(
        center.x, center.y,
        radius,
        fillR, fillG, fillB
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
   * Optimized method for drawing a circle with 1px opaque stroke and no fill using Bresenham's algorithm.
   * If the original radius has a fractional part of exactly 0.5, the top half is shifted
   * down 1px and the left half is shifted right 1px relative to the standard rounded rendering.
   * setPixel logic is inlined for maximum performance with fully opaque colors.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of stroke color (0-255)
   * @param {Number} g - Green component of stroke color (0-255)
   * @param {Number} b - Blue component of stroke color (0-255)
   */
  draw1PxStrokeFullCircleBresenhamOpaque(centerX, centerY, radius, r, g, b) {
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    const frameBuffer32 = renderer.frameBufferUint32View;
    const context = renderer.context;
    const clippingMask = context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate the packed 32-bit color (assuming ABGR format in memory for little-endian)
    // Format is typically RGBA in canvas, but ArrayBuffer/DataView are little-endian
    // Check system endianness if needed, but this order (ABGR) is common for canvas ImageData
    const packedColor = (255 << 24) | (b << 16) | (g << 8) | r;

    // --- Radius and Center Calculation ---
    const originalRadius = radius;
    const cX = Math.floor(centerX);
    const cY = Math.floor(centerY);
    const intRadius = Math.floor(originalRadius);

    if (intRadius < 0) return; // Cannot draw circle with negative integer radius

    // --- Handle Zero Radius Case (Single Pixel) ---
    if (intRadius === 0) {
      if (originalRadius >= 0) {
        const centerPx = Math.round(centerX);
        const centerPy = Math.round(centerY);
        renderer.setPixel(centerPx, centerPy, r, g, b, 255);
      }
      return; // Done if radius was zero
    }

    // --- Determine Offsets for .5 Radius Case ---
    let xOffset = 0;
    let yOffset = 0;
    if (originalRadius > 0 && (originalRadius * 2) % 2 === 1) {
      xOffset = 1;
      yOffset = 1;
    }

    // Skip if integer bounding box is completely outside canvas bounds (loose check)
    const minX = cX - intRadius - xOffset;
    const maxX = cX + intRadius;
    const minY = cY - intRadius - yOffset;
    const maxY = cY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Bresenham Initialization ---
    let x = 0;
    let y = intRadius;
    let d = 3 - 2 * intRadius;

    // Draw directly, no Set needed for opaque path
    while (x <= y) {
      // Calculate all 8 potential pixel coordinates
      const p1x = cX + x; const p1y = cY + y;
      const p2x = cX + y; const p2y = cY + x;
      const p3x = cX + y; const p3y = cY - x - yOffset;
      const p4x = cX + x; const p4y = cY - y - yOffset;
      const p5x = cX - x - xOffset; const p5y = cY - y - yOffset;
      const p6x = cX - y - xOffset; const p6y = cY - x - yOffset;
      const p7x = cX - y - xOffset; const p7y = cY + x;
      const p8x = cX - x - xOffset; const p8y = cY + y;

      // Plot 8 points directly with bounds and clipping checks
      // Point 1
      // 4th octant - lower-right quadrant
      if (p1x >= 0 && p1x < width && p1y >= 0 && p1y < height) {
        const pixelPos = p1y * width + p1x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 2 (Check needed for x == y)
      // 3rd octant - lower-right quadrant
      if (p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) {
        if (x !== y) { // Avoid plotting diagonal twice when x == y
          const pixelPos = p2y * width + p2x;
          if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
            frameBuffer32[pixelPos] = packedColor;
          }
        }
      }
      // Point 3
      // 2nd octant - upper-right quadrant
      if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) {
        const pixelPos = p3y * width + p3x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 4
      // 1st octant - upper-right quadrant
      if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) {
        const pixelPos = p4y * width + p4x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 5
      // 8th octant - upper-left quadrant
      if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) {
        const pixelPos = p5y * width + p5x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 6 (Check needed for x == y)
      // 7th octant - upper-left quadrant
      if (p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) {
        if (x !== y) { // Avoid plotting diagonal twice when x == y
          const pixelPos = p6y * width + p6x;
          if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
            frameBuffer32[pixelPos] = packedColor;
          }
        }
      }
      // Point 7
      // 6th octant - lower-left quadrant
      if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) {
        const pixelPos = p7y * width + p7x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }
      // Point 8
      // 5th octant - lower-left quadrant
      if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) {
        const pixelPos = p8y * width + p8x;
        if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
          frameBuffer32[pixelPos] = packedColor;
        }
      }

      // Update Bresenham algorithm state
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--;
      }
      x++;
    }
  }

  /**
   * Optimized method for drawing a circle with 1px semi-transparent stroke and no fill using Bresenham's algorithm.
   * Uses a Set for uniqueness checking and performs alpha blending for each pixel.
   * If the original radius has a fractional part of exactly 0.5, the top half is shifted
   * down 1px and the left half is shifted right 1px relative to the standard rounded rendering.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of stroke color (0-255)
   * @param {Number} g - Green component of stroke color (0-255)
   * @param {Number} b - Blue component of stroke color (0-255)
   * @param {Number} a - Alpha component of stroke color (0-255)
   */
  draw1PxStrokeFullCircleBresenhamAlpha(centerX, centerY, radius, r, g, b, a) {
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

    const globalAlpha = renderer.context.globalAlpha;
    if (a === 0 || globalAlpha <= 0) return; // Fully transparent

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    const context = renderer.context;
    const clippingMask = context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate alpha blending values
    const incomingAlpha = (a / 255) * globalAlpha;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    if (incomingAlpha <= 0) return; // Effective alpha is zero

    // --- Radius and Center Calculation ---
    const originalRadius = radius;
    const cX = Math.floor(centerX);
    const cY = Math.floor(centerY);
    const intRadius = Math.floor(originalRadius);

    if (intRadius < 0) return; // Cannot draw circle with negative integer radius

    // --- Handle Zero Radius Case (Single Pixel) ---
    if (intRadius === 0) {
      if (originalRadius >= 0) {
        const centerPx = Math.round(centerX);
        const centerPy = Math.round(centerY);
        renderer.setPixel(centerPx, centerPy, r, g, b, a);
      }
      return; // Done if radius was zero
    }

    // --- Determine Offsets for .5 Radius Case ---
    let xOffset = 0;
    let yOffset = 0;
    if (originalRadius > 0 && (originalRadius * 2) % 2 === 1) {
      xOffset = 1;
      yOffset = 1;
    }

    // Skip if integer bounding box is completely outside canvas bounds (loose check)
    const minX = cX - intRadius - xOffset;
    const maxX = cX + intRadius;
    const minY = cY - intRadius - yOffset;
    const maxY = cY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Bresenham Initialization ---
    let x = 0;
    let y = intRadius;
    let d = 3 - 2 * intRadius;

    // --- Use Set for uniqueness in semi-transparent path ---
    const uniquePixelKeys = new Set();

    while (x <= y) {
      // Calculate all 8 potential pixel coordinates
      const p1x = cX + x; const p1y = cY + y;
      const p2x = cX + y; const p2y = cY + x;
      const p3x = cX + y; const p3y = cY - x - yOffset;
      const p4x = cX + x; const p4y = cY - y - yOffset;
      const p5x = cX - x - xOffset; const p5y = cY - y - yOffset;
      const p6x = cX - y - xOffset; const p6y = cY - x - yOffset;
      const p7x = cX - y - xOffset; const p7y = cY + x;
      const p8x = cX - x - xOffset; const p8y = cY + y;

      // Add unique pixel keys, checking bounds inline
      if (p1x >= 0 && p1x < width && p1y >= 0 && p1y < height) uniquePixelKeys.add(p1y * width + p1x);
      if (p2x >= 0 && p2x < width && p2y >= 0 && p2y < height) uniquePixelKeys.add(p2y * width + p2x);
      if (p3x >= 0 && p3x < width && p3y >= 0 && p3y < height) uniquePixelKeys.add(p3y * width + p3x);
      if (p4x >= 0 && p4x < width && p4y >= 0 && p4y < height) uniquePixelKeys.add(p4y * width + p4x);
      if (p5x >= 0 && p5x < width && p5y >= 0 && p5y < height) uniquePixelKeys.add(p5y * width + p5x);
      if (p6x >= 0 && p6x < width && p6y >= 0 && p6y < height) uniquePixelKeys.add(p6y * width + p6x);
      if (p7x >= 0 && p7x < width && p7y >= 0 && p7y < height) uniquePixelKeys.add(p7y * width + p7x);
      if (p8x >= 0 && p8x < width && p8y >= 0 && p8y < height) uniquePixelKeys.add(p8y * width + p8x);

      // Update Bresenham algorithm state
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--;
      }
      x++;
    }

    // Render pixels from the Set using blending
    if (uniquePixelKeys.size > 0) {
      for (const pixelPos of uniquePixelKeys) { // faster than a forEach
        const index = pixelPos * 4;

        // Clipping check
        let clipped = false;
        if (clippingMask) {
          const clippingMaskByteIndex = pixelPos >> 3;
          const bitIndex = pixelPos & 7;
          if (clippingMask[clippingMaskByteIndex] === 0 || (clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
            clipped = true;
          }
        }

        if (!clipped) {
          // Standard path with alpha blending
          const oldAlpha = frameBufferUint8ClampedView[index + 3] / 255;
          const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
          const newAlpha = incomingAlpha + oldAlphaScaled;

          if (newAlpha > 0) { // Avoid division by zero/negative
            const blendFactor = 1 / newAlpha;
            frameBufferUint8ClampedView[index] = (r * incomingAlpha + frameBufferUint8ClampedView[index] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 1] = (g * incomingAlpha + frameBufferUint8ClampedView[index + 1] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 2] = (b * incomingAlpha + frameBufferUint8ClampedView[index + 2] * oldAlphaScaled) * blendFactor;
            frameBufferUint8ClampedView[index + 3] = newAlpha * 255;
          }
        }
      }
    }
  }

  /**
   * Generates relative horizontal extents for a circle.
   * This data describes the shape of the circle relative to its integer center,
   * suitable for scanline filling.
   * @param {Number} radius - Radius of the circle (float)
   * @returns {Object|null} An object { relativeExtents, intRadius, xOffset, yOffset } or null for invalid radius.
   *          relativeExtents: Array where index is rel_y and value is max_rel_x.
   *          intRadius: Integer part of the radius.
   *          xOffset, yOffset: Offsets for handling radius with fractional part 0.5.
   */
  _generateRelativeHorizontalExtentsBresenham(radius) {
    const originalRadius = radius;
    const intRadius = Math.floor(originalRadius);

    if (intRadius < 0) return null; // Invalid radius

    // Determine offsets for .5 radius case (affects how filler uses the extents)
    let xOffset = 0;
    let yOffset = 0;
    // Check if fractional part is exactly 0.5
    if (originalRadius > 0 && (originalRadius * 2) % 2 === 1) {
      xOffset = 1;
      yOffset = 1;
    }

    // Handle zero radius separately (returns valid structure for consistency)
    if (intRadius === 0) {
        // Although no Bresenham runs, provide the structure expected by the filler
        return { relativeExtents: [0], intRadius: 0, xOffset: xOffset, yOffset: yOffset };
    }

    // --- Bresenham Initialization for Extents ---
    const relativeExtents = new Array(intRadius + 1).fill(0);
    let x = 0;
    let y = intRadius;
    let d = 3 - 2 * intRadius;

    // --- Bresenham Loop to Calculate Extents ---
    while (x <= y) {
      // Update extents based on the current (x, y) point and its symmetry
      // For rel_y = y, the horizontal extent is at least x
      relativeExtents[y] = Math.max(relativeExtents[y], x);
      // For rel_y = x, the horizontal extent is at least y
      relativeExtents[x] = Math.max(relativeExtents[x], y);

      // Update Bresenham algorithm state
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--; // Move closer to the horizontal axis
      }
      x++; // Move further from the vertical axis
    }

    return { relativeExtents, intRadius, xOffset, yOffset };
  }

  /**
   * Draws a filled opaque circle using scanline conversion based on Bresenham-derived extents.
   * Handles fractional radius of 0.5 by shifting pixels as described in the original function.
   * Pixel setting logic is inlined for performance with fully opaque colors.
   * @param {Number} centerX - X coordinate of circle center
   * @param {Number} centerY - Y coordinate of circle center
   * @param {Number} radius - Radius of the circle (float)
   * @param {Number} r - Red component of fill color (0-255)
   * @param {Number} g - Green component of fill color (0-255)
   * @param {Number} b - Blue component of fill color (0-255)
   */
  drawOpaqueFillFullCircleBresenham(centerX, centerY, radius, r, g, b) {
    // --- Early Exit & Renderer Property Caching ---
    const renderer = this.pixelRenderer;
    if (!renderer) {
      console.error("Pixel renderer not found!");
      return;
    }

    const width = renderer.width;
    const height = renderer.height;
    const frameBufferUint8ClampedView = renderer.frameBufferUint8ClampedView;
    const frameBuffer32 = renderer.frameBufferUint32View;
    const context = renderer.context; // Assuming context holds clippingMask if needed
    const clippingMask = context && context.currentState ? context.currentState.clippingMask : null;

    // Pre-calculate the packed 32-bit color (assuming ABGR format in memory for little-endian)
    // Format is typically RGBA in canvas, but ArrayBuffer/DataView are little-endian
    // Check system endianness if needed, but this order (ABGR) is common for canvas ImageData
    const packedColor = (255 << 24) | (b << 16) | (g << 8) | r;

    // --- Generate Relative Extents ---
    const extentData = this._generateRelativeHorizontalExtentsBresenham(radius);
    if (!extentData) return; // Invalid radius handled by generator

    const { relativeExtents, intRadius, xOffset, yOffset } = extentData;

    // --- Handle Zero Radius Case (Single Pixel) ---
    // Note: generator returns intRadius=0 even for 0 <= radius < 1
    if (intRadius === 0 && radius >= 0) {
        const centerPx = Math.round(centerX); // Use Math.round for single pixel placement
        const centerPy = Math.round(centerY);

        // Check bounds for the single pixel
        if (centerPx >= 0 && centerPx < width && centerPy >= 0 && centerPy < height) {
            const pixelPos = centerPy * width + centerPx;
            // Check clipping mask for the single pixel
             if (!clippingMask || ((clippingMask[pixelPos >> 3] !== 0) && ((clippingMask[pixelPos >> 3] & (1 << (7 - (pixelPos & 7)))) !== 0))) {
                // Use the 32-bit write
                frameBuffer32[pixelPos] = packedColor;
            }
        }
        return; // Done if radius effectively zero
    }
    // Now we know intRadius > 0

    // --- Calculate Absolute Center and Bounds ---
    // ADJUSTMENT: Use center relative to pixel centers for scanline calculation
    const adjCenterX = Math.floor(centerX - 0.5);
    const adjCenterY = Math.floor(centerY - 0.5);
    // const cX = Math.floor(centerX); // Original center (keep for reference/debugging if needed)
    // const cY = Math.floor(centerY); // Original center

    // Optional: Loose bounding box check (can save loop iterations)
    // Use adjusted center for bounding box check for consistency
    const maxExt = relativeExtents[0]; // Widest extent is at rel_y = 0
    const minX = adjCenterX - maxExt - xOffset;
    const maxX = adjCenterX + maxExt;
    const minY = adjCenterY - intRadius - yOffset;
    const maxY = adjCenterY + intRadius;
    if (maxX < 0 || minX >= width || maxY < 0 || minY >= height) return;

    // --- Scanline Filling Loop ---
    // Hoist clipping check outside the main loop
    if (!clippingMask) {
      // --- Version WITHOUT Clipping Check ---
      for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
        const max_rel_x = relativeExtents[rel_y];
        // Use adjusted center and offsets, with +1 correction for min boundaries
        const abs_x_min = adjCenterX - max_rel_x - xOffset + 1; // Apply +1 correction
        const abs_x_max = adjCenterX + max_rel_x;
        const abs_y_bottom = adjCenterY + rel_y;
        const abs_y_top = adjCenterY - rel_y - yOffset + 1; // Apply +1 correction

        // --- Draw Bottom Scanline (No Clip) ---
        if (abs_y_bottom >= 0 && abs_y_bottom < height) {
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          let currentPixelPos = abs_y_bottom * width + startX;
          // Remove currentIndex, use currentPixelPos directly with frameBuffer32
          const endPixelPos = abs_y_bottom * width + endX;
          while (currentPixelPos <= endPixelPos) {
             frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
             // Remove currentIndex update
             currentPixelPos++;
          }
        }

        // --- Draw Top Scanline (No Clip) ---
        if (rel_y > 0 && abs_y_top >= 0 && abs_y_top < height) {
          // Use adjusted center and offsets
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          let currentPixelPos = abs_y_top * width + startX;
          // Remove currentIndex
          const endPixelPos = abs_y_top * width + endX;
          while (currentPixelPos <= endPixelPos) {
             frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
             // Remove currentIndex update
             currentPixelPos++;
          }
        }
      }
    } else {
      // --- Version WITH Clipping Check (Optimized) ---
      for (let rel_y = 0; rel_y <= intRadius; rel_y++) {
        const max_rel_x = relativeExtents[rel_y];
        // Use adjusted center and offsets, with +1 correction for min boundaries
        const abs_x_min = adjCenterX - max_rel_x - xOffset + 1; // Apply +1 correction
        const abs_x_max = adjCenterX + max_rel_x;
        const abs_y_bottom = adjCenterY + rel_y;
        const abs_y_top = adjCenterY - rel_y - yOffset + 1; // Apply +1 correction

        // --- Draw Bottom Scanline (Optimized Clip Check) ---
        if (abs_y_bottom >= 0 && abs_y_bottom < height) {
          const startX = Math.max(0, abs_x_min);
          const endX = Math.min(width - 1, abs_x_max);
          const startPixelPos = abs_y_bottom * width + startX;
          const endPixelPos = abs_y_bottom * width + endX;
          let currentPixelPos = startPixelPos;
          // Remove currentIndex

          while (currentPixelPos <= endPixelPos) {
            const byteIndex = currentPixelPos >> 3;
            const bitInByte = currentPixelPos & 7;

            // Can we check a full byte?
            if (bitInByte === 0 && currentPixelPos + 7 <= endPixelPos) {
              const maskByte = clippingMask[byteIndex];
              if (maskByte === 0xFF) { // Fully opaque byte
                // Draw 8 pixels directly using 32-bit writes
                const loopEndPos = currentPixelPos + 7;
                while (currentPixelPos <= loopEndPos) {
                    frameBuffer32[currentPixelPos] = packedColor;
                    currentPixelPos++;
                }
                // Remove currentIndex update
                continue; // Next iteration of while loop
              } else if (maskByte === 0x00) { // Fully transparent byte
                // Skip 8 pixels
                currentPixelPos += 8;
                // Remove currentIndex update
                continue; // Next iteration of while loop
              } else {
                // Partial byte - fall through to per-pixel check below
              }
            }

            // Per-pixel check (for partial bytes or end of span)
            const bitMask = 1 << (7 - bitInByte);
            if ((clippingMask[byteIndex] & bitMask) !== 0) {
              frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
            }
            // Remove currentIndex update
            currentPixelPos++;
          }
        }

        // --- Draw Top Scanline (Optimized Clip Check) ---
        if (rel_y > 0 && abs_y_top >= 0 && abs_y_top < height) {
            // Use adjusted center and offsets
            const startX = Math.max(0, abs_x_min);
            const endX = Math.min(width - 1, abs_x_max);
            const startPixelPos = abs_y_top * width + startX;
            const endPixelPos = abs_y_top * width + endX;
            let currentPixelPos = startPixelPos;
            // Remove currentIndex

            while (currentPixelPos <= endPixelPos) {
              const byteIndex = currentPixelPos >> 3;
              const bitInByte = currentPixelPos & 7;

              // Can we check a full byte?
              if (bitInByte === 0 && currentPixelPos + 7 <= endPixelPos) {
                const maskByte = clippingMask[byteIndex];
                 if (maskByte === 0xFF) { // Fully opaque byte
                  const loopEndPos = currentPixelPos + 7;
                  while(currentPixelPos <= loopEndPos) {
                    frameBuffer32[currentPixelPos] = packedColor;
                    currentPixelPos++;
                  }
                  // Remove currentIndex update
                  continue;
                } else if (maskByte === 0x00) { // Fully transparent byte
                  currentPixelPos += 8;
                  // Remove currentIndex update
                  continue;
                } else {
                  // Partial byte - fall through
                }
              }

              // Per-pixel check
              const bitMask = 1 << (7 - bitInByte);
              if ((clippingMask[byteIndex] & bitMask) !== 0) {
                frameBuffer32[currentPixelPos] = packedColor; // Use 32-bit write
              }
              // Remove currentIndex update
              currentPixelPos++;
            }
        }
      }
    } // End of if (!clippingMask) / else
  }

}