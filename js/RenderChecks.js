class RenderChecks {
  constructor(comparison) {
    this.comparison = comparison;
  }

  checkCountOfUniqueColorsInLine(ctx, expectedColors, isRow) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const uniqueColors = new Set();
    
    if (isRow) {
      const middleY = Math.floor(ctx.canvas.height / 2);
      for(let x = 0; x < width; x++) {
        const i = (middleY * width + x) * 4;
        if(data[i+3] === 0) continue;
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    } else {
      const middleX = Math.floor(width / 2);
      for(let y = 0; y < ctx.canvas.height; y++) {
        const i = (y * width + middleX) * 4;
        if(data[i+3] === 0) continue;
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      let message = `Expected ${expectedColors} colors but found ${count} colors in middle ${isRow ? 'row' : 'column'} of ${ctx.canvas.title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.comparison.showError(message);
    }
    
    return count;
  }

  checkCountOfUniqueColorsInMiddleRow(ctx, expectedColors = null) {
    return this.checkCountOfUniqueColorsInLine(ctx, expectedColors, true);
  }

  checkCountOfUniqueColorsInMiddleColumn(ctx, expectedColors = null) {
    return this.checkCountOfUniqueColorsInLine(ctx, expectedColors, false);
  }

  // note that these first two parameters are both CanvasRenderingContext2D
  // NOT USED AT THE MOMENT, we rather check the leftmost and rightmost and topmost and bottommost pixels
  // that are not transparent, because there are some defects like protruding pixels in rounded rects
  // that get missed if one just checks the middle lines.
  checkPlacementOf4SidesAlongMiddleLines(swCtx, canvasCtx, edges) {
    const results = [];
    const contexts = [
      { name: 'Software Renderer', ctx: swCtx },
      { name: 'Canvas', ctx: canvasCtx }
    ];
    
    for (const { name, ctx } of contexts) {
      const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
      const data = imageData.data;
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      
      const middleY = Math.floor(height / 2);
      let actualLeftX = -1;
      let actualRightX = -1;
      
      for (let x = 0; x < width; x++) {
        const i = (middleY * width + x) * 4;
        if (data[i + 3] > 0) {
          actualLeftX = x;
          break;
        }
      }
      
      for (let x = width - 1; x >= 0; x--) {
        const i = (middleY * width + x) * 4;
        if (data[i + 3] > 0) {
          actualRightX = x;
          break;
        }
      }
      
      const middleX = Math.floor(width / 2);
      let actualTopY = -1;
      let actualBottomY = -1;
      
      for (let y = 0; y < height; y++) {
        const i = (y * width + middleX) * 4;
        if (data[i + 3] > 0) {
          actualTopY = y;
          break;
        }
      }
      
      for (let y = height - 1; y >= 0; y--) {
        const i = (y * width + middleX) * 4;
        if (data[i + 3] > 0) {
          actualBottomY = y;
          break;
        }
      }
      
      console.log(`${name} found edges:`, { actualLeftX, actualRightX, actualTopY, actualBottomY });
      console.log('Expected edges:', edges);
      
      const edgeResults = [];
      if (actualLeftX !== edges.leftX) {
        const message = `${name}: Left edge expected at ${edges.leftX}, found at ${actualLeftX}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      if (actualRightX !== edges.rightX) {
        const message = `${name}: Right edge expected at ${edges.rightX}, found at ${actualRightX}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      if (actualTopY !== edges.topY) {
        const message = `${name}: Top edge expected at ${edges.topY}, found at ${actualTopY}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      if (actualBottomY !== edges.bottomY) {
        const message = `${name}: Bottom edge expected at ${edges.bottomY}, found at ${actualBottomY}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      
      results.push(`${name} results:${
        edgeResults.length === 0 
          ? ' All edges correctly placed top: ' + actualTopY + ' bottom: ' + actualBottomY + ' left: ' + actualLeftX + ' right:' + actualRightX
          : '\n- ' + edgeResults.join('\n- ')
      }`);
    }
    
    return results.join('\n\n');
  }

  /**
   * Find the extremes (boundaries) of an image with an alpha tolerance
   * @param {CanvasRenderingContext2D} ctx - The canvas context to analyze
   * @param {number} alphaTolerance - Tolerance for alpha values (0-1)
   * @returns {Object|null} The extremes object with leftX, rightX, topY, bottomY or null if no qualifying pixels
   */
  findExtremesWithTolerance(ctx, alphaTolerance = 0) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    
    // Scan all pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3]/255 > alphaTolerance) {  // If pixel is not fully transparent (or very close, depending on alphaTolerance)
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // If no qualifying pixels were found, return null
    if (minX === width || maxX === -1 || minY === height || maxY === -1) {
      return null;
    }
    
    return { leftX: minX, rightX: maxX, topY: minY, bottomY: maxY };
  }
  
  /**
   * Check if the extremes match the expected values for both renderers
   * @param {CanvasRenderingContext2D} swCtx - The software renderer context
   * @param {CanvasRenderingContext2D} canvasCtx - The canvas context
   * @param {Object} expectedExtremes - The expected extremes
   * @param {number} alphaTolerance - Tolerance for alpha values (0-1)
   * @returns {string} Results of the check
   */
  checkExtremes(swCtx, canvasCtx, expectedExtremes, alphaTolerance = 0) {
    const contexts = [
      { name: 'Software Renderer', ctx: swCtx },
      { name: 'Canvas', ctx: canvasCtx }
    ];
    
    const results = [];
    
    for (const { name, ctx } of contexts) {
      const actualExtremes = this.findExtremesWithTolerance(ctx, alphaTolerance);
      
      // If no qualifying pixels were found
      if (!actualExtremes) {
        const message = `${name}: No non-transparent pixels found`;
        results.push(message);
        this.comparison.showError(message);
        continue;
      }
      
      // Check against expected extremes if provided
      if (expectedExtremes) {
        if (actualExtremes.leftX !== expectedExtremes.leftX) {
          const message = `${name}: Left extreme expected at ${expectedExtremes.leftX}, found at ${actualExtremes.leftX}`;
          results.push(message);
          this.comparison.showError(message);
        }
        if (actualExtremes.rightX !== expectedExtremes.rightX) {
          const message = `${name}: Right extreme expected at ${expectedExtremes.rightX}, found at ${actualExtremes.rightX}`;
          results.push(message);
          this.comparison.showError(message);
        }
        if (actualExtremes.topY !== expectedExtremes.topY) {
          const message = `${name}: Top extreme expected at ${expectedExtremes.topY}, found at ${actualExtremes.topY}`;
          results.push(message);
          this.comparison.showError(message);
        }
        if (actualExtremes.bottomY !== expectedExtremes.bottomY) {
          const message = `${name}: Bottom extreme expected at ${expectedExtremes.bottomY}, found at ${actualExtremes.bottomY}`;
          results.push(message);
          this.comparison.showError(message);
        }
      }
      
      results.push(`${name}: left=${actualExtremes.leftX}, right=${actualExtremes.rightX}, top=${actualExtremes.topY}, bottom=${actualExtremes.bottomY}`);
    }
    
    return results.join('\n');
  }
  
  checkEdgeGaps(ctx, extremes, isStroke) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    
    // Extract edges from extremes
    const { leftX, rightX, topY, bottomY } = extremes;
    
    // Function to check for transparent pixels - a pixel is transparent if alpha = 0
    const isTransparent = (idx) => data[idx + 3] === 0;
    
    // Results for tracking gaps
    const results = { gaps: 0, details: [] };
    
    // Find first and last non-transparent pixels in top row
    let topFirstFilled = null, topLastFilled = null;
    
    for (let x = leftX; x <= rightX; x++) {
      const i = (topY * width + x) * 4;
      if (!isTransparent(i)) {
        topFirstFilled = topFirstFilled === null ? x : topFirstFilled;
        topLastFilled = x;
      }
    }
    
    // Check for gaps in top row if we found filled pixels
    if (topFirstFilled !== null) {
      for (let x = topFirstFilled; x <= topLastFilled; x++) {
        const i = (topY * width + x) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at top row, x=${x}`);
        }
      }
    }
    
    // Find first and last non-transparent pixels in bottom row
    let bottomFirstFilled = null, bottomLastFilled = null;
    
    for (let x = leftX; x <= rightX; x++) {
      const i = (bottomY * width + x) * 4;
      if (!isTransparent(i)) {
        bottomFirstFilled = bottomFirstFilled === null ? x : bottomFirstFilled;
        bottomLastFilled = x;
      }
    }
    
    // Check for gaps in bottom row if we found filled pixels
    if (bottomFirstFilled !== null) {
      for (let x = bottomFirstFilled; x <= bottomLastFilled; x++) {
        const i = (bottomY * width + x) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at bottom row, x=${x}`);
        }
      }
    }
    
    // Find first and last non-transparent pixels in left column
    let leftFirstFilled = null, leftLastFilled = null;
    
    for (let y = topY; y <= bottomY; y++) {
      const i = (y * width + leftX) * 4;
      if (!isTransparent(i)) {
        leftFirstFilled = leftFirstFilled === null ? y : leftFirstFilled;
        leftLastFilled = y;
      }
    }
    
    // Check for gaps in left column if we found filled pixels
    if (leftFirstFilled !== null) {
      for (let y = leftFirstFilled; y <= leftLastFilled; y++) {
        const i = (y * width + leftX) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at left column, y=${y}`);
        }
      }
    }
    
    // Find first and last non-transparent pixels in right column
    let rightFirstFilled = null, rightLastFilled = null;
    
    for (let y = topY; y <= bottomY; y++) {
      const i = (y * width + rightX) * 4;
      if (!isTransparent(i)) {
        rightFirstFilled = rightFirstFilled === null ? y : rightFirstFilled;
        rightLastFilled = y;
      }
    }
    
    // Check for gaps in right column if we found filled pixels
    if (rightFirstFilled !== null) {
      for (let y = rightFirstFilled; y <= rightLastFilled; y++) {
        const i = (y * width + rightX) * 4;
        if (isTransparent(i)) {
          results.gaps++;
          results.details.push(`Gap at right column, y=${y}`);
        }
      }
    }
    
    // Generate result message
    let resultMsg = `${ctx.canvas.title.split('-')[0]} Renderer: `;
    
    if (results.gaps === 0) {
      resultMsg += `No gaps found in ${isStroke ? 'stroke' : 'fill'} edges!`;
    } else {
      resultMsg += `Found ${results.gaps} gaps in ${isStroke ? 'stroke' : 'fill'} edges: ${results.details.join(', ')}`;
      
      // Only show error for software renderer (this should always be true as we only call with SW renderer)
      this.comparison.showError(
        `Found ${results.gaps} gaps in SW renderer ${isStroke ? 'stroke' : 'fill'} edges. ` +
        `This indicates missing pixels at circle boundaries!`
      );
    }
    
    return resultMsg;
  }
  
  /**
   * Check edges of a shape for gaps
   * @param {CanvasRenderingContext2D} swCtx - The software renderer context
   * @param {CanvasRenderingContext2D} canvasCtx - The canvas context
   * @param {boolean} isStroke - Whether to check stroke edges (true) or fill edges (false)
   * @returns {string} Results of the check
   */
  checkEdgesForGaps(swCtx, canvasCtx, isStroke = false) {
    // Calculate extremes for the shape by scanning the canvas
    const calculatedExtremes = this.findExtremesWithTolerance(swCtx, 0);
    
    // If no non-transparent pixels were found, return error
    if (!calculatedExtremes) {
      const errorMsg = "No non-transparent pixels found, cannot check for gaps";
      this.comparison.showError(errorMsg);
      return errorMsg;
    }
    
    // Check only the software renderer for gaps, as specified
    const swResults = this.checkEdgeGaps(swCtx, calculatedExtremes, isStroke);
    return `Edge gap check result (${isStroke ? 'stroke' : 'fill'}): ${swResults}`;
  }

  checkCountOfUniqueColorsInImage(ctx, expectedColors = null) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const uniqueColors = new Set();
    
    // Check all pixels in the image
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i+3] === 0) continue; // Skip transparent pixels
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      let message = `Expected ${expectedColors} unique colors but found ${count} unique colors in ${ctx.canvas.title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.comparison.showError(message);
    }
    
    return count;
  }

  checkForSpeckles(ctx) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    let speckleCount = 0;
    
    // Check each pixel (except edges)
    for (let y = 0; y < height; y++) {
      for (let x = 1; x < width - 1; x++) {
        const currentIdx = (y * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
                
        // Check if left and right pixels have the same color
        const leftMatchesRight = 
          data[leftIdx] === data[rightIdx] &&
          data[leftIdx + 1] === data[rightIdx + 1] &&
          data[leftIdx + 2] === data[rightIdx + 2] &&
          data[leftIdx + 3] === data[rightIdx + 3];
        
        // Check if current pixel is different from neighbors
        const currentDifferent = 
          data[currentIdx] !== data[leftIdx] ||
          data[currentIdx + 1] !== data[leftIdx + 1] ||
          data[currentIdx + 2] !== data[leftIdx + 2] ||
          data[currentIdx + 3] !== data[leftIdx + 3];
        
        if (leftMatchesRight && currentDifferent) {
          speckleCount++;
        }
      }
    }
    
    if (speckleCount > 0) {
      this.comparison.showError(
        `Found ${speckleCount} speckle${speckleCount === 1 ? '' : 's'} in ${ctx.canvas.title} ` +
        '(single pixels with different color from matching left and right neighbors)'
      );
    }
    
    return speckleCount;
  }

  compareWithThreshold(swCtx, canvasCtx, RGBThreshold, alphaThreshold) {
    const swImageData = swCtx.getImageData(0, 0, swCtx.canvas.width, swCtx.canvas.height);
    const canvasImageData = canvasCtx.getImageData(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);
    const swData = swImageData.data;
    const canvasData = canvasImageData.data;
    const width = swCtx.canvas.width;
    const height = swCtx.canvas.height;
    
    let differenceCount = 0;
    let firstDiffX = -1;
    let firstDiffY = -1;
    
    // Compare each pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // Check if the color components are within the threshold
        const rDiff = Math.abs(swData[idx] - canvasData[idx]);
        const gDiff = Math.abs(swData[idx + 1] - canvasData[idx + 1]);
        const bDiff = Math.abs(swData[idx + 2] - canvasData[idx + 2]);
        const aDiff = Math.abs(swData[idx + 3] - canvasData[idx + 3]);
        
        if (rDiff > RGBThreshold || gDiff > RGBThreshold || bDiff > RGBThreshold || aDiff > alphaThreshold) {
          differenceCount++;
          
          // Record first difference position
          if (firstDiffX === -1) {
            firstDiffX = x;
            firstDiffY = y;
          }
        }
      }
    }
    
    if (differenceCount > 0) {
      // Get the color values at the first difference point
      const idx = (firstDiffY * width + firstDiffX) * 4;
      const swR = swData[idx];
      const swG = swData[idx + 1];
      const swB = swData[idx + 2];
      const swA = swData[idx + 3];
      
      const canvasR = canvasData[idx];
      const canvasG = canvasData[idx + 1];
      const canvasB = canvasData[idx + 2];
      const canvasA = canvasData[idx + 3];
      
      // Calculate the differences
      const rDiff = Math.abs(swR - canvasR);
      const gDiff = Math.abs(swG - canvasG);
      const bDiff = Math.abs(swB - canvasB);
      const aDiff = Math.abs(swA - canvasA);
      
      // Highlight which component(s) exceeds the threshold
      const rHighlight = rDiff > RGBThreshold ? `<strong>${rDiff}</strong>` : rDiff;
      const gHighlight = gDiff > RGBThreshold ? `<strong>${gDiff}</strong>` : gDiff;
      const bHighlight = bDiff > RGBThreshold ? `<strong>${bDiff}</strong>` : bDiff;
      const aHighlight = aDiff > alphaThreshold ? `<strong>${aDiff}</strong>` : aDiff;
      
      const message = `Found ${differenceCount} pixels with differences exceeding thresholds (RGB: ${RGBThreshold}, Alpha: ${alphaThreshold}). // ` +
                      `First difference at (${firstDiffX}, ${firstDiffY}): ` +
                      `SW Renderer: rgba(${swR}, ${swG}, ${swB}, ${swA}) // ` +
                      `Canvas: rgba(${canvasR}, ${canvasG}, ${canvasB}, ${canvasA}) // ` +
                      `Difference: rgba(${rHighlight}, ${gHighlight}, ${bHighlight}, ${aHighlight})`;
      
      this.comparison.showError(message);
      return message;
    }
    
    return `All pixels are within thresholds (RGB: ${RGBThreshold}, Alpha: ${alphaThreshold})`;
  }
}
