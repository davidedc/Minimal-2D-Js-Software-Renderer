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
}