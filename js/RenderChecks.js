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

  checkExtremes(swCtx, canvasCtx, expectedExtremes, alphaTolerance = 0) {
    const contexts = [
      { name: 'Software Renderer', ctx: swCtx },
      { name: 'Canvas', ctx: canvasCtx }
    ];
    
    const results = [];
    
    for (const { name, ctx } of contexts) {
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
      
      // If no non-transparent pixels were found, all values will be at their initial values
      if (minX === width || maxX === -1 || minY === height || maxY === -1) {
        const message = `${name}: No non-transparent pixels found`;
        results.push(message);
        this.comparison.showError(message);
        continue;
      }

      const actualExtremes = { leftX: minX, rightX: maxX, topY: minY, bottomY: maxY };
      console.log(`${name} found extremes:`, actualExtremes);
      
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
}
