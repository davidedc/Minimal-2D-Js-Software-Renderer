class SWRendererPixel {
  constructor(frameBuffer, width, height) {
    this.frameBuffer = frameBuffer;
    this.width = width;
    this.height = height;
  }

  // Blending happens in sRGB space for performance reasons
  setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const index = (y * this.width + x) * 4;
    
    const alpha = a / 255;
    const oldAlpha = this.frameBuffer[index + 3] / 255;
    const newAlpha = alpha + oldAlpha * (1 - alpha);
    
    if (newAlpha > 0) {
      this.frameBuffer[index] = (r * alpha + this.frameBuffer[index] * oldAlpha * (1 - alpha)) / newAlpha;
      this.frameBuffer[index + 1] = (g * alpha + this.frameBuffer[index + 1] * oldAlpha * (1 - alpha)) / newAlpha;
      this.frameBuffer[index + 2] = (b * alpha + this.frameBuffer[index + 2] * oldAlpha * (1 - alpha)) / newAlpha;
      this.frameBuffer[index + 3] = newAlpha * 255;
    }
  }

  clearPixel(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const index = (y * this.width + x) * 4;
    this.frameBuffer[index] = 0;
    this.frameBuffer[index + 1] = 0;
    this.frameBuffer[index + 2] = 0;
    this.frameBuffer[index + 3] = 0;
  }
}