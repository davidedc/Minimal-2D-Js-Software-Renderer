class SWRendererPixel {
  constructor(frameBuffer, width, height, context) {
    this.frameBuffer = frameBuffer;
    this.width = width;
    this.height = height;
    // if context is null, then it means we are just using the primitives without the
    // whole context apparatus, so we create a placeholder object with the globalAlpha property
    // that we need for the blending calculations
    if (context) {
      this.context = context;
      this.tempClippingMask = context.tempClippingMask;
    } else {
      this.context = { globalAlpha: 1.0 };
    }
  }

  clipPixel(x, y) {
    // Convert to integer with bitwise OR
    x = x | 0;
    y = y | 0;
    
    // Cache width for performance
    const width = this.width;
    
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position
    const pixelPos = y * width + x;
    
    // Use bit shifting for division and modulo
    const byteIndex = pixelPos >> 3; // Faster than Math.floor(pixelPos / 8)
    const bitIndex = pixelPos & 7;   // Faster than pixelPos % 8
    
    // OR the bit in the tempClippingMask
    this.tempClippingMask[byteIndex] |= (1 << (7 - bitIndex));
  }

  // Blending happens in sRGB space for performance reasons
  setPixel(x, y, r, g, b, a) {
    // emit a warning if x or y are not integers
    if (false) {
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        console.warn(`setPixel called with non-integer coordinates: x=${x}, y=${y}`);
      }
    }
    // fix x and y to be integers using bitwise OR (faster than Math.round)
    x = x | 0;
    y = y | 0;
    
    // Cache frequently used constants
    const width = this.width;
    const globalAlpha = this.context.globalAlpha;
    
    // Early bounds check
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position (used multiple times)
    const pixelPos = y * width + x;
    const index = pixelPos * 4;
    
    // Check for clipping with optimized path
    if (this.context.currentState) {
      const clippingMask = this.context.currentState.clippingMask;
      const clippingMaskByteIndex = pixelPos >> 3; // Faster than Math.floor(pixelPos / 8)
      const bitIndex = pixelPos & 7; // Faster than pixelPos % 8
      
      // Quick check for common case (fully clipped byte)
      if (clippingMask[clippingMaskByteIndex] === 0) return;
      
      // Bit-level check only if needed
      if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) return;
    }
    
    // Batch alpha calculations to reduce divisions
    const incomingAlpha = (a / 255) * globalAlpha;
    const oldAlpha = this.frameBuffer[index + 3] / 255;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
    const newAlpha = incomingAlpha + oldAlphaScaled;
    
    // Avoid division if possible
    if (newAlpha <= 0) return;
    
    // Pre-calculate division factor once
    const blendFactor = 1 / newAlpha;
    
    // Apply color blending
    this.frameBuffer[index] = (r * incomingAlpha + this.frameBuffer[index] * oldAlphaScaled) * blendFactor;
    this.frameBuffer[index + 1] = (g * incomingAlpha + this.frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
    this.frameBuffer[index + 2] = (b * incomingAlpha + this.frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
    this.frameBuffer[index + 3] = newAlpha * 255;
  }

  clearPixel(x, y) {
    // Convert to integer with bitwise OR
    x = x | 0;
    y = y | 0;
    
    // Cache width for performance
    const width = this.width;
    
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position
    const index = (y * width + x) * 4;
    
    // Set all pixel values to 0 
    this.frameBuffer[index] = 0;
    this.frameBuffer[index + 1] = 0;
    this.frameBuffer[index + 2] = 0;
    this.frameBuffer[index + 3] = 0;
  }

  /**
   * Set multiple horizontal pixel runs with the same color
   * @param {Array} runs - Array of [x, y, length] triplets
   * @param {Number} r - Red component (0-255)
   * @param {Number} g - Green component (0-255)
   * @param {Number} b - Blue component (0-255)
   * @param {Number} a - Alpha component (0-255)
   */
  setPixelRuns(runs, r, g, b, a) {
    // Cache frequently used constants
    const width = this.width;
    const height = this.height;
    const globalAlpha = this.context.globalAlpha;
    const hasClipping = this.context.currentState;
    const clippingMask = hasClipping ? this.context.currentState.clippingMask : null;
    
    // Batch alpha calculations 
    const incomingAlpha = (a / 255) * globalAlpha;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    
    // Skip processing if fully transparent
    if (incomingAlpha <= 0) return;

    for (let i = 0; i < runs.length; i += 3) {
      // Get run parameters and convert to integers
      let x = runs[i] | 0;
      const y = runs[i+1] | 0;
      let length = runs[i+2] | 0;
      
      // Skip if y is out of bounds
      if (y < 0 || y >= height) continue;
      
      // Handle horizontal clipping
      if (x < 0) {
        length += x; // Reduce length by the amount x is negative
        x = 0;       // Start at left edge
        if (length <= 0) continue; // Skip if nothing to draw
      }
      
      // Clip to right edge
      if (x + length > width) {
        length = width - x;
        if (length <= 0) continue; // Skip if nothing to draw
      }
      
      // Calculate base position for this scanline
      let pixelPos = y * width + x;
      let index = pixelPos * 4;
      
      // Draw the run
      for (let j = 0; j < length; j++, pixelPos++, index += 4) {
        // Check clipping if needed
        if (hasClipping) {
          const clippingMaskByteIndex = pixelPos >> 3;
          
          // Quick check for fully clipped byte
          if (clippingMask[clippingMaskByteIndex] === 0) {
            // Skip to the end of this byte boundary
            const pixelsInThisByte = 8 - (pixelPos & 7);
            const pixelsToSkip = Math.min(pixelsInThisByte, length - j);
            j += pixelsToSkip - 1; // -1 because loop also increments j
            pixelPos += pixelsToSkip - 1;
            index += (pixelsToSkip - 1) * 4;
            continue;
          }
          
          // Bit-level check
          const bitIndex = pixelPos & 7;
          if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
            continue;
          }
        }
        
        // Get existing pixel alpha
        const oldAlpha = this.frameBuffer[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;
        
        // Skip fully transparent pixels
        if (newAlpha <= 0) continue;
        
        // Pre-calculate division factor once for this pixel
        const blendFactor = 1 / newAlpha;
        
        // Apply color blending
        this.frameBuffer[index] = (r * incomingAlpha + this.frameBuffer[index] * oldAlphaScaled) * blendFactor;
        this.frameBuffer[index + 1] = (g * incomingAlpha + this.frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
        this.frameBuffer[index + 2] = (b * incomingAlpha + this.frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
        this.frameBuffer[index + 3] = newAlpha * 255;
      }
    }
  }
}