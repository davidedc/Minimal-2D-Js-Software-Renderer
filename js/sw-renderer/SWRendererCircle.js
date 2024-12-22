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

    if (fillA > 0) {
      this.drawCircleHelper(center.x, center.y, radius,
        fillR, fillG, fillB, fillA, true);
    }
    if (strokeA > 0 && strokeWidth > 0) {
      this.drawCircleHelper(center.x, center.y, radius,
        strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
    }
  }

  circlePlotPoints(strokePixels, xc, yc, x, y, thickness) {
    this.addThickPoint(strokePixels, xc + x, yc + y, thickness);
    this.addThickPoint(strokePixels, xc - x, yc + y, thickness);
    this.addThickPoint(strokePixels, xc + x, yc - y, thickness);
    this.addThickPoint(strokePixels, xc - x, yc - y, thickness);
    this.addThickPoint(strokePixels, xc + y, yc + x, thickness);
    this.addThickPoint(strokePixels, xc - y, yc + x, thickness);
    this.addThickPoint(strokePixels, xc + y, yc - x, thickness);
    this.addThickPoint(strokePixels, xc - y, yc - x, thickness);
  }

  drawCircleHelper(centerX, centerY, radius, r, g, b, a, fill = false, thickness = 1) {
    // tweaks to make the sw render more closely match the canvas render
    if (thickness > 1)
      thickness *= 0.75;
    centerX -= 1;
    centerY -= 1;
    //radius *= 1.015;

    if (fill) {
      const radiusSquared = (radius - 0.5) * (radius - 0.5);
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (x * x + y * y <= radiusSquared) {
            this.pixelRenderer.setPixel(
              Math.round(centerX + x), 
              Math.round(centerY + y), 
              Math.round(r), g, b, a
            );
          }
        }
      }
    }

    if (!fill || thickness > 0) {
      // Collect all stroke pixels first
      const strokePixels = new Set();
      let x = 0;
      let y = radius;
      let d = 3 - 2 * radius;

      while (y >= x) {
        this.circlePlotPoints(strokePixels, centerX, centerY, x, y, thickness);
        x++;

        if (d > 0) {
          y--;
          d = d + 4 * (x - y) + 10;
        } else {
          d = d + 4 * x + 6;
        }
      }

      // Now render each pixel exactly once
      for (let pixel of strokePixels) {
        const [x, y] = pixel.split(',').map(Number);
        this.pixelRenderer.setPixel(x, y, r, g, b, a);
      }
    }
  }

  addStrokePixel(strokePixels, x, y) {
    strokePixels.add(`${x},${y}`);
  }

  addThickPoint(strokePixels, x, y, thickness) {
    const halfThick = Math.floor(thickness / 2);
    for (let dy = -halfThick; dy < thickness - halfThick; dy++) {
      for (let dx = -halfThick; dx < thickness - halfThick; dx++) {
        this.addStrokePixel(strokePixels, Math.round(x + dx), Math.round(y + dy));
      }
    }
  }
}
