class RenderChecks {
  constructor(comparison) {
    this.comparison = comparison;
  }

  checkCountOfUniqueColorsInMiddleRow(ctx, expectedColors = null) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const middleY = Math.floor(ctx.canvas.height / 2);
    const uniqueColors = new Set();
    
    // Scan middle row
    for(let x = 0; x < ctx.canvas.width; x++) {
      const i = (middleY * ctx.canvas.width + x) * 4;
      if(data[i+3] === 255) continue;
      const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
      uniqueColors.add(colorKey);
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      this.comparison.showError(`Expected ${expectedColors} colors but found ${count} colors in middle row of ${ctx.canvas.title}`);
    }
    
    return count;
  }

  checkCountOfUniqueColorsInMiddleColumn(ctx, expectedColors = null) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const middleX = Math.floor(ctx.canvas.width / 2);
    const uniqueColors = new Set();
    
    for(let y = 0; y < ctx.canvas.height; y++) {
      const i = (y * ctx.canvas.width + middleX) * 4;
      if(data[i+3] === 255) continue;
      const colorKey = `${data[i]},${data[i+1]},${data[i+2]},${data[i+3]}`;
      uniqueColors.add(colorKey);
    }
    
    const count = uniqueColors.size;
    if (expectedColors !== null && count !== expectedColors) {
      this.comparison.showError(`Expected ${expectedColors} colors but found ${count} colors in middle column of ${ctx.canvas.title}`);
    }
    
    return count;
  }

  checkPlacementOf4Sides(swCtx, canvasCtx, edges) {
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
        const message = `Left edge expected at ${edges.leftX}, found at ${actualLeftX}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      if (actualRightX !== edges.rightX) {
        const message = `Right edge expected at ${edges.rightX}, found at ${actualRightX}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      if (actualTopY !== edges.topY) {
        const message = `Top edge expected at ${edges.topY}, found at ${actualTopY}`;
        edgeResults.push(message);
        this.comparison.showError(message);
      }
      if (actualBottomY !== edges.bottomY) {
        const message = `Bottom edge expected at ${edges.bottomY}, found at ${actualBottomY}`;
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
}
