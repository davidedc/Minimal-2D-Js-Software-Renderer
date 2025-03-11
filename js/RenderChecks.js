/**
 * Class for performing various rendering checks and comparisons between software and canvas renderers
 */
class RenderChecks {
  /**
   * Creates a new RenderChecks instance
   * @param {Object} comparison - The comparison object used for showing errors
   */
  constructor(comparison) {
    this.comparison = comparison;
  }

  /**
   * Checks the count of unique colors in a horizontal or vertical line through the middle of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @param {boolean} isRow - True to check a horizontal row, false to check a vertical column
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, isRow) {
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.width, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.height);
    
    const data = imageData.data;
    const width = canvasContextOfSwRendererOrCanvasRenderer.canvas.width;
    const height = canvasContextOfSwRendererOrCanvasRenderer.canvas.height;
    const uniqueColors = new Set();
    
    if (isRow) {
      const middleY = Math.floor(height / 2);
      for(let x = 0; x < width; x++) {
        const i = (middleY * width + x) * 4;
        if(data[i+3] === 0) continue;
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    } else {
      const middleX = Math.floor(width / 2);
      for(let y = 0; y < height; y++) {
        const i = (y * width + middleX) * 4;
        if(data[i+3] === 0) continue;
        const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
        uniqueColors.add(colorKey);
      }
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      let message = `Expected ${expectedColors} colors but found ${count} colors in middle ${isRow ? 'row' : 'column'} of ${canvasContextOfSwRendererOrCanvasRenderer.canvas.title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.comparison.showError(message);
    }
    
    return count;
  }

  /**
   * Checks the count of unique colors in the middle horizontal row of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInMiddleRow(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    return this.checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, true);
  }

  /**
   * Checks the count of unique colors in the middle vertical column of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInMiddleColumn(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    return this.checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, false);
  }


  /**
   * Find the extremes (boundaries) of an image with an alpha tolerance
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number} alphaTolerance - Tolerance for alpha values (0-1)
   * @returns {Object|null} The extremes object with leftX, rightX, topY, bottomY or null if no qualifying pixels
   */
  findExtremesWithTolerance(canvasContextOfSwRendererOrCanvasRenderer, alphaTolerance = 0) {
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.width, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.height);
    
    const data = imageData.data;
    const width = canvasContextOfSwRendererOrCanvasRenderer.canvas.width;
    const height = canvasContextOfSwRendererOrCanvasRenderer.canvas.height;
    
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
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {Object} expectedExtremes - The expected extremes
   * @param {number} alphaTolerance - Tolerance for alpha values (0-1)
   * @returns {string} Results of the check
   */
  checkExtremes(canvasCtxOfSwRender, canvasCtxOfCanvasRender, expectedExtremes, alphaTolerance = 0) {
    const contexts = [
      { name: 'SW Renderer', context: canvasCtxOfSwRender },
      { name: 'Canvas Renderer', context: canvasCtxOfCanvasRender }
    ];
    
    const results = [];
    
    for (const { name, context } of contexts) {
      const actualExtremes = this.findExtremesWithTolerance(context, alphaTolerance);
      
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
  
  /**
   * Checks for gaps in the edges of a shape
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {Object} extremes - The shape boundaries {leftX, rightX, topY, bottomY}
   * @param {boolean} isStroke - Whether checking stroke edges (true) or fill edges (false)
   * @returns {string} Results of the gap check
   */
  checkEdgeGaps(canvasContextOfSwRendererOrCanvasRenderer, extremes, isStroke) {
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.width, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.height);
      
    const data = imageData.data;
    const width = canvasContextOfSwRendererOrCanvasRenderer.canvas.width;
    
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
    
    // Extract renderer name from canvas title or use a default
    const rendererName = canvasContextOfSwRendererOrCanvasRenderer.canvas.title ? 
                       canvasContextOfSwRendererOrCanvasRenderer.canvas.title.split('-')[0] : 'Unknown';
    
    // Generate result message
    let resultMsg = `${rendererName} Renderer: `;
    
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
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {boolean} isStroke - Whether to check stroke edges (true) or fill edges (false)
   * @returns {string} Results of the check
   */
  checkEdgesForGaps(canvasCtxOfSwRender, canvasCtxOfCanvasRender, isStroke = false) {
    // Calculate extremes for the shape by scanning the canvas
    const calculatedExtremes = this.findExtremesWithTolerance(canvasCtxOfSwRender, 0);
    
    // If no non-transparent pixels were found, return error
    if (!calculatedExtremes) {
      const errorMsg = "No non-transparent pixels found, cannot check for gaps";
      this.comparison.showError(errorMsg);
      return errorMsg;
    }
    
    // Check only the software renderer for gaps, as specified
    const swResults = this.checkEdgeGaps(canvasCtxOfSwRender, calculatedExtremes, isStroke);
    return `Edge gap check result (${isStroke ? 'stroke' : 'fill'}): ${swResults}`;
  }

  /**
   * Counts the number of unique colors in the entire image
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInImage(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.width, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.height);
      
    const data = imageData.data;
    const width = canvasContextOfSwRendererOrCanvasRenderer.canvas.width;
    const height = canvasContextOfSwRendererOrCanvasRenderer.canvas.height;
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
      let message = `Expected ${expectedColors} unique colors but found ${count} unique colors in ${canvasContextOfSwRendererOrCanvasRenderer.canvas.title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.comparison.showError(message);
    }
    
    return count;
  }

  /**
   * Checks for speckles (isolated pixels with different colors from their matching neighbors)
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @returns {number} The number of speckles found
   */
  checkForSpeckles(canvasContextOfSwRendererOrCanvasRenderer) {
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.width, 
      canvasContextOfSwRendererOrCanvasRenderer.canvas.height);
    
    const data = imageData.data;
    const width = canvasContextOfSwRendererOrCanvasRenderer.canvas.width;
    const height = canvasContextOfSwRendererOrCanvasRenderer.canvas.height;
    
    let speckleCount = 0;
    let firstSpeckleX = -1;
    let firstSpeckleY = -1;
    
    // Check each pixel (except edges)
    for (let y = 1; y < height - 1; y++) {  // Changed to skip first and last rows
      for (let x = 1; x < width - 1; x++) {
        const currentIdx = (y * width + x) * 4;
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const topIdx = ((y - 1) * width + x) * 4;     // Added top neighbor check
        const bottomIdx = ((y + 1) * width + x) * 4;  // Added bottom neighbor check
                
        // Check if horizontal neighbors match
        const horizontalMatch = 
          data[leftIdx] === data[rightIdx] &&
          data[leftIdx + 1] === data[rightIdx + 1] &&
          data[leftIdx + 2] === data[rightIdx + 2] &&
          data[leftIdx + 3] === data[rightIdx + 3];
        
        // Check if vertical neighbors match
        const verticalMatch = 
          data[topIdx] === data[bottomIdx] &&
          data[topIdx + 1] === data[bottomIdx + 1] &&
          data[topIdx + 2] === data[bottomIdx + 2] &&
          data[topIdx + 3] === data[bottomIdx + 3];
        
        // Check if current pixel is different from neighbors
        const differentFromHorizontal = 
          data[currentIdx] !== data[leftIdx] ||
          data[currentIdx + 1] !== data[leftIdx + 1] ||
          data[currentIdx + 2] !== data[leftIdx + 2] ||
          data[currentIdx + 3] !== data[leftIdx + 3];
          
        const differentFromVertical = 
          data[currentIdx] !== data[topIdx] ||
          data[currentIdx + 1] !== data[topIdx + 1] ||
          data[currentIdx + 2] !== data[topIdx + 2] ||
          data[currentIdx + 3] !== data[topIdx + 3];
        
        // Count as speckle if either horizontal or vertical neighbors match but current pixel differs
        if ((horizontalMatch && differentFromHorizontal) || 
            (verticalMatch && differentFromVertical)) {
          speckleCount++;
          if (firstSpeckleX === -1) {
            firstSpeckleX = x;
            firstSpeckleY = y;
          }
        }
      }
    }
    
    if (speckleCount > 0) {
      const specklePixel = (firstSpeckleY * width + firstSpeckleX) * 4;
      this.comparison.showError(
        `Found ${speckleCount} speckle${speckleCount === 1 ? '' : 's'} in ${canvasContextOfSwRendererOrCanvasRenderer.canvas.title} ` +
        `(single pixels with different color from matching neighbors). First speckle at (${firstSpeckleX}, ${firstSpeckleY}) ` +
        `with color rgba(${data[specklePixel]}, ${data[specklePixel + 1]}, ${data[specklePixel + 2]}, ${data[specklePixel + 3]})`
      );
    }
    
    return speckleCount;
  }

  /**
   * Compares two renderings with color and alpha thresholds
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {number} RGBThreshold - Maximum allowed difference in RGB values
   * @param {number} alphaThreshold - Maximum allowed difference in alpha values
   * @returns {string} Results of the comparison
   */
  compareWithThreshold(canvasCtxOfSwRender, canvasCtxOfCanvasRender, RGBThreshold, alphaThreshold) {
    const swImageData = canvasCtxOfSwRender.getImageData(0, 0, 
      canvasCtxOfSwRender.canvas.width, 
      canvasCtxOfSwRender.canvas.height);
      
    const canvasImageData = canvasCtxOfCanvasRender.getImageData(0, 0, 
      canvasCtxOfCanvasRender.canvas.width, 
      canvasCtxOfCanvasRender.canvas.height);
      
    const swData = swImageData.data;
    const canvasData = canvasImageData.data;
    const width = canvasCtxOfSwRender.canvas.width;
    const height = canvasCtxOfSwRender.canvas.height;
    
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
                      `Canvas Renderer: rgba(${canvasR}, ${canvasG}, ${canvasB}, ${canvasA}) // ` +
                      `Difference: rgba(${rHighlight}, ${gHighlight}, ${bHighlight}, ${aHighlight})`;
      
      this.comparison.showError(message);
      return message;
    }
    
    return `All pixels are within thresholds (RGB: ${RGBThreshold}, Alpha: ${alphaThreshold})`;
  }
}
