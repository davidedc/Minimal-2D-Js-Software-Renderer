/**
 * Class for performing various checks on the rendered images
 */
class RenderChecks {
  /**
   * Creates a new RenderChecks instance
   * @param {Object} test - The test object used for showing errors
   */
  constructor(test) {
    this.test = test;
  }

  /**
   * Checks if a stroke forms a continuous loop without holes
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The rendering context to analyze
   * @param {Object} extremes - The shape boundaries {leftX, rightX, topY, bottomY}
   * @param {boolean} horizontalScan - Whether to perform a horizontal (column-by-column) scan instead of vertical
   * @returns {boolean} True if the stroke is continuous, false if holes are found
   */
  checkStrokeContinuity(canvasCtxOfSwRender, extremes, horizontalScan = false) {
    // Get canvas dimensions and image data
    const canvas = canvasCtxOfSwRender.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasCtxOfSwRender.title || 'unknown');
    
    const imageData = canvasCtxOfSwRender.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Extract edges from extremes
    const { leftX, rightX, topY, bottomY } = extremes;
    
    // Function to check if a pixel is transparent (alpha = 0)
    const isTransparent = (idx) => data[idx + 3] === 0;
    
    // Track the pattern transitions as we scan
    let transitionPattern = [];
    let holeFound = false;
    let detailMessage = '';
    
    if (!horizontalScan) {
      // Vertical scan (row by row from top to bottom)
      this.scanVertically(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern);
    } else {
      // Horizontal scan (column by column from left to right)
      this.scanHorizontally(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern);
    }
    
    // Find any fragmented patterns that indicate holes
    for (const transition of transitionPattern) {
      if (transition.pattern === 'fragmented') {
        holeFound = true;
        const coord = horizontalScan ? `x=${transition.pos}` : `y=${transition.pos}`;
        detailMessage = `${horizontalScan ? 'Column' : 'Row'} ${coord} has ${transition.groupCount} disconnected pixel groups instead of 1 or 2`;
        break;
      }
    }
    
    // Validate the transition pattern - should follow this sequence:
    // 1. One or more 'solid' rows/cols (cap)
    // 2. Zero or more 'sides' rows/cols (if shape is large enough)
    // 3. One or more 'solid' rows/cols (cap)
    
    // The only valid patterns are:
    // - solid only (small shape)
    // - solid → sides → solid (normal shape)
    
    let validTransitionSequence = true;
    let currentState = 'start';
    const directionLabel = horizontalScan ? 'column' : 'row';
    
    for (let i = 0; i < transitionPattern.length; i++) {
      const { pattern, pos } = transitionPattern[i];
      
      switch (currentState) {
        case 'start':
          if (pattern === 'solid') {
            currentState = 'firstCap';
          } else if (pattern === 'sides') {
            // Missing first cap
            validTransitionSequence = false;
            detailMessage = `Missing first cap at ${directionLabel} ${pos}`;
          } else if (pattern === 'fragmented') {
            // Fragmented pattern not allowed
            validTransitionSequence = false;
            detailMessage = `Fragmented pattern at ${directionLabel} ${pos}`;
          }
          break;
          
        case 'firstCap':
          if (pattern === 'sides') {
            currentState = 'sides';
          } else if (pattern === 'fragmented') {
            // Fragmented pattern not allowed
            validTransitionSequence = false;
            detailMessage = `Fragmented pattern at ${directionLabel} ${pos}`;
          } else if (pattern === 'empty') {
            // Empty row/column not allowed here
            validTransitionSequence = false;
            detailMessage = `Unexpected empty ${directionLabel} at ${pos}`;
          }
          break;
          
        case 'sides':
          if (pattern === 'solid') {
            currentState = 'secondCap';
          } else if (pattern === 'fragmented') {
            // Fragmented pattern not allowed
            validTransitionSequence = false;
            detailMessage = `Fragmented pattern at ${directionLabel} ${pos}`;
          } else if (pattern === 'empty') {
            // Empty row/column not allowed here
            validTransitionSequence = false;
            detailMessage = `Unexpected empty ${directionLabel} at ${pos}`;
          }
          break;
          
        case 'secondCap':
          if (pattern !== 'solid') {
            // Only solid allowed in second cap
            validTransitionSequence = false;
            detailMessage = `Expected solid pattern for second cap, got ${pattern} at ${directionLabel} ${pos}`;
          }
          break;
      }
      
      if (!validTransitionSequence) {
        break;
      }
    }
    
    // Check final state - must end in firstCap (small shape) or secondCap (normal shape)
    if (validTransitionSequence && currentState !== 'firstCap' && currentState !== 'secondCap') {
      validTransitionSequence = false;
      detailMessage = 'Incomplete stroke pattern';
    }
    
    if (!validTransitionSequence || holeFound) {
      const rendererName = title ? title.split('-')[0] : 'Unknown';
      const scanType = horizontalScan ? 'horizontal' : 'vertical';
      const errorMessage = `${rendererName} Renderer: Found holes in stroke during ${scanType} scan! ${detailMessage}`;
      this.test.showError(errorMessage);
      return false;
    }
    
    return true;
  }
  
  /**
   * Scan vertically (row by row) and analyze pixel patterns
   * @private
   */
  scanVertically(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern) {
    // Scan each row from top to bottom
    for (let y = topY; y <= bottomY; y++) {
      // Track contiguous pixel groups in the current row
      let contiguousGroups = [];
      let currentGroup = null;
      
      // Scan this row from left to right
      for (let x = leftX; x <= rightX; x++) {
        const idx = (y * width + x) * 4;
        const isPixelTransparent = isTransparent(idx);
        
        if (!isPixelTransparent) {
          // Start a new group or extend current group
          if (currentGroup === null) {
            currentGroup = { startX: x, endX: x };
          } else {
            currentGroup.endX = x;
          }
        } else if (currentGroup !== null) {
          // End of a group
          contiguousGroups.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Add the last group if it exists
      if (currentGroup !== null) {
        contiguousGroups.push(currentGroup);
      }
      
      // Categorize the pattern for this row
      let rowPattern = '';
      if (contiguousGroups.length === 0) {
        rowPattern = 'empty';
      } else if (contiguousGroups.length === 1) {
        rowPattern = 'solid';
      } else if (contiguousGroups.length === 2) {
        rowPattern = 'sides';
      } else {
        rowPattern = 'fragmented';
      }
      
      // Add the pattern to our transition sequence
      if (transitionPattern.length === 0 || transitionPattern[transitionPattern.length - 1].pattern !== rowPattern) {
        transitionPattern.push({ pos: y, pattern: rowPattern, groupCount: contiguousGroups.length });
      }
    }
  }
  
  /**
   * Scan horizontally (column by column) and analyze pixel patterns
   * @private
   */
  scanHorizontally(data, width, leftX, rightX, topY, bottomY, isTransparent, transitionPattern) {
    // Scan each column from left to right
    for (let x = leftX; x <= rightX; x++) {
      // Track contiguous pixel groups in the current column
      let contiguousGroups = [];
      let currentGroup = null;
      
      // Scan this column from top to bottom
      for (let y = topY; y <= bottomY; y++) {
        const idx = (y * width + x) * 4;
        const isPixelTransparent = isTransparent(idx);
        
        if (!isPixelTransparent) {
          // Start a new group or extend current group
          if (currentGroup === null) {
            currentGroup = { startY: y, endY: y };
          } else {
            currentGroup.endY = y;
          }
        } else if (currentGroup !== null) {
          // End of a group
          contiguousGroups.push(currentGroup);
          currentGroup = null;
        }
      }
      
      // Add the last group if it exists
      if (currentGroup !== null) {
        contiguousGroups.push(currentGroup);
      }
      
      // Categorize the pattern for this column
      let colPattern = '';
      if (contiguousGroups.length === 0) {
        colPattern = 'empty';
      } else if (contiguousGroups.length === 1) {
        colPattern = 'solid';
      } else if (contiguousGroups.length === 2) {
        colPattern = 'sides';
      } else {
        colPattern = 'fragmented';
      }
      
      // Add the pattern to our transition sequence
      if (transitionPattern.length === 0 || transitionPattern[transitionPattern.length - 1].pattern !== colPattern) {
        transitionPattern.push({ pos: x, pattern: colPattern, groupCount: contiguousGroups.length });
      }
    }
  }

  /**
   * Checks the count of unique colors in a horizontal or vertical line through the middle of the canvas
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @param {boolean} isRow - True to check a horizontal row, false to check a vertical column
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInLine(canvasContextOfSwRendererOrCanvasRenderer, expectedColors, isRow) {
    // Get the canvas width/height - handling both real canvas and our CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
    
    const data = imageData.data;
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
      let message = `Expected ${expectedColors} colors but found ${count} colors in middle ${isRow ? 'row' : 'column'} of ${title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.test.showError(message);
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
    // Get canvas dimensions - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
    
    const data = imageData.data;
    
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
    // Build an array of contexts to check, always including SW renderer
    // Only include Canvas renderer if it's provided (not null/undefined)
    const contexts = [
      { name: 'SW Renderer', context: canvasCtxOfSwRender }
    ];
    
    // Add Canvas renderer only if it exists (handles Node environment case)
    if (canvasCtxOfCanvasRender) {
      contexts.push({ name: 'Canvas Renderer', context: canvasCtxOfCanvasRender });
    }
    
    const results = [];
    const errors = [];
    
    for (const { name, context } of contexts) {
      const actualExtremes = this.findExtremesWithTolerance(context, alphaTolerance);
      
      // If no qualifying pixels were found
      if (!actualExtremes) {
        const message = `${name}: No non-transparent pixels found`;
        results.push(message);
        this.test.showError(message);
        continue;
      }
      
      // Check against expected extremes if provided
      if (expectedExtremes) {
        if (actualExtremes.leftX !== expectedExtremes.leftX) {
          const message = `${name}: Left extreme expected at ${expectedExtremes.leftX}, found at ${actualExtremes.leftX}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
        if (actualExtremes.rightX !== expectedExtremes.rightX) {
          const message = `${name}: Right extreme expected at ${expectedExtremes.rightX}, found at ${actualExtremes.rightX}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
        if (actualExtremes.topY !== expectedExtremes.topY) {
          const message = `${name}: Top extreme expected at ${expectedExtremes.topY}, found at ${actualExtremes.topY}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
        if (actualExtremes.bottomY !== expectedExtremes.bottomY) {
          const message = `${name}: Bottom extreme expected at ${expectedExtremes.bottomY}, found at ${actualExtremes.bottomY}`;
          results.push(message);
          errors.push(message);
          this.test.showError(message);
        }
      }
      
      results.push(`${name}: left=${actualExtremes.leftX}, right=${actualExtremes.rightX}, top=${actualExtremes.topY}, bottom=${actualExtremes.bottomY}`);
    }
    
    // For Node environment compatibility, add error count to result
    results.errors = errors.length;
    
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
    // Get canvas dimensions and title - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, canvas.height);
      
    const data = imageData.data;
    
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
    
    // Extract renderer name from title or use a default
    const rendererName = title ? title.split('-')[0] : 'Unknown';
    
    // Generate result message
    let resultMsg = `${rendererName} Renderer: `;
    
    if (results.gaps === 0) {
      resultMsg += `No gaps found in ${isStroke ? 'stroke' : 'fill'} edges!`;
    } else {
      resultMsg += `Found ${results.gaps} gaps in ${isStroke ? 'stroke' : 'fill'} edges: ${results.details.join(', ')}`;
      
      // Only show error for software renderer (this should always be true as we only call with SW renderer)
      this.test.showError(
        `Found ${results.gaps} gaps in SW renderer ${isStroke ? 'stroke' : 'fill'} edges. ` +
        `This indicates missing pixels at circle boundaries!`
      );
    }
    
    return resultMsg;
  }
  
  /**
   * Check edges of a shape for gaps. This is particularly used for circles, where some rendering
   * artefacts could happen where there would be holes in the top/bottom/left/right edges.
   * Note that this check works regardless of the fill presence and/or width or color.
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
      this.test.showError(errorMsg);
      return errorMsg;
    }
    
    // Check only the software renderer for gaps
    const swResults = this.checkEdgeGaps(canvasCtxOfSwRender, calculatedExtremes, isStroke);
    return `Edge gap check result (${isStroke ? 'stroke' : 'fill'}): ${swResults}`;
  }
  
  /**
   * Check if a stroke has no holes. Note that this only works for a) shapes that have a starting cap,
   * two sides, and an ending cap (like circles, rectangles, rounded rectangles, etc), and
   * b) shapes with no fill (or with a fill that is the same color as the stroke).
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfSwRender - The software renderer context
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasCtxOfCanvasRender - The canvas renderer context
   * @param {Object} options - Options for the check
   * @param {boolean} options.verticalScan - Whether to perform a vertical scan (default: true)
   * @param {boolean} options.horizontalScan - Whether to perform a horizontal scan (default: true)
   * @returns {string} Results of the check
   */
  checkStrokeForHoles(canvasCtxOfSwRender, canvasCtxOfCanvasRender, options = {}) {
    // Default options
    const { 
      verticalScan = true, 
      horizontalScan = true 
    } = options;
    
    // Calculate extremes for the shape by scanning the canvas
    const calculatedExtremes = this.findExtremesWithTolerance(canvasCtxOfSwRender, 0);
    
    // If no non-transparent pixels were found, return error
    if (!calculatedExtremes) {
      const errorMsg = "No non-transparent pixels found, cannot check for stroke holes";
      this.test.showError(errorMsg);
      return errorMsg;
    }
    
    const rendererName = canvasCtxOfSwRender.canvas.title ? 
      canvasCtxOfSwRender.canvas.title.split('-')[0] : 'SW';
    
    let isStrokeContinuous = true;
    let resultMsgs = [];
    
    // Perform vertical scan if requested
    if (verticalScan) {
      const isVerticalContinuous = this.checkStrokeContinuity(canvasCtxOfSwRender, calculatedExtremes, false);
      isStrokeContinuous = isStrokeContinuous && isVerticalContinuous;
      
      if (!isVerticalContinuous) {
        resultMsgs.push(`Vertical scan: Found holes`);
      }
    }
    
    // Perform horizontal scan if requested
    if (horizontalScan) {
      const isHorizontalContinuous = this.checkStrokeContinuity(canvasCtxOfSwRender, calculatedExtremes, true);
      isStrokeContinuous = isStrokeContinuous && isHorizontalContinuous;
      
      if (!isHorizontalContinuous) {
        resultMsgs.push(`Horizontal scan: Found holes`);
      }
    }
    
    // Determine overall result message
    const resultMsg = isStrokeContinuous ? 
      `${rendererName} Renderer: Stroke is continuous with no holes` : 
      `${rendererName} Renderer: Stroke has holes or discontinuities (${resultMsgs.join(', ')})`;
      
    return `Stroke continuity check result: ${resultMsg}`;
  }

  /**
   * Counts the number of unique colors in the entire image
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @param {number|null} expectedColors - The expected number of unique colors, or null if no expectation
   * @returns {number} The count of unique colors found
   */
  checkCountOfUniqueColorsInImage(canvasContextOfSwRendererOrCanvasRenderer, expectedColors = null) {
    // Get canvas dimensions and title - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
      
    const data = imageData.data;
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
      let message = `Expected ${expectedColors} unique colors but found ${count} unique colors in ${title}`;
      uniqueColors.forEach(color => {
        message += `\n- ${color}`;
      });
      this.test.showError(message);
    }
    
    return count;
  }

  /**
   * Checks for speckles (isolated pixels with different colors from their matching neighbors)
   * @param {CanvasRenderingContext2D|CrispSwContext} canvasContextOfSwRendererOrCanvasRenderer - The rendering context to analyze
   * @returns {number} The number of speckles found
   */
  checkForSpeckles(canvasContextOfSwRendererOrCanvasRenderer) {
    // Get canvas dimensions and title - handle both real canvas and CrispSwContext
    const canvas = canvasContextOfSwRendererOrCanvasRenderer.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const title = canvas.title || (canvasContextOfSwRendererOrCanvasRenderer.title || 'unknown');
    
    const imageData = canvasContextOfSwRendererOrCanvasRenderer.getImageData(0, 0, width, height);
    
    const data = imageData.data;
    
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
      this.test.showError(
        `Found ${speckleCount} speckle${speckleCount === 1 ? '' : 's'} in ${title} ` +
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
   * @returns {string} Results of the test
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
      
      this.test.showError(message);
      return message;
    }
    
    return `All pixels are within thresholds (RGB: ${RGBThreshold}, Alpha: ${alphaThreshold})`;
  }
}
