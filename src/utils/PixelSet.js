class PixelSet {
  constructor(pixelRenderer) {
    this.pixels = new Map();
    this.pixelRenderer = pixelRenderer;
  }

  addPixel(x, y, r, g, b, a) {
    const key = `${Math.round(x)},${Math.round(y)}`;
    this.pixels.set(key, { x: Math.round(x), y: Math.round(y), r, g, b, a });
  }

  paint() {
    for (const pixel of this.pixels.values()) {
      this.pixelRenderer.setPixel(pixel.x, pixel.y, pixel.r, pixel.g, pixel.b, pixel.a);
    }
  }
}