class SWRendererRect {
  constructor(frameBuffer, width, height, lineRenderer, pixelRenderer) {
    this.frameBuffer = frameBuffer;
    this.width = width;
    this.height = height;
    this.lineRenderer = lineRenderer;
    this.pixelRenderer = pixelRenderer;
  }

  drawRect(shape) {
    const {
      center, width, height, rotation,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    if (rotation === 0) {    
      this.drawAxisAlignedRect(center.x, center.y, width, height,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    } else {
      this.drawRotatedRect(center.x, center.y, width, height, rotation,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    }
  }

  clearRect(shape) {
    const center = shape.center;
    const shapeWidth = shape.width;
    const shapeHeight = shape.height;
    const rotation = shape.rotation;

    if (rotation === 0) {
      if (shapeWidth === this.width && 
        shapeHeight === this.height &&
        center.x === shapeWidth / 2 &&
        center.y === shapeHeight / 2) {
        this.frameBuffer.fill(0);
        return;
      }
      this.clearAxisAlignedRect(center.x, center.y, shapeWidth, shapeHeight);
    } else {
      this.clearRotatedRect(center.x, center.y, shapeWidth, shapeHeight, rotation);
    }
  }

  drawRotatedRect(centerX, centerY, width, height, rotation, strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const points = [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2]
    ].map(([x, y]) => ({
      x: centerX + x * cos - y * sin,
      y: centerY + x * sin + y * cos
    }));

    // draw fill first
    if (fillA > 0) {
      const minX = Math.floor(Math.min(...points.map(p => p.x)));
      const maxX = Math.ceil(Math.max(...points.map(p => p.x)));
      const minY = Math.floor(Math.min(...points.map(p => p.y)));
      const maxY = Math.ceil(Math.max(...points.map(p => p.y)));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (pointInPolygon(x, y, points)) {
            this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
          }
        }
      }
    }

    if (strokeA > 0) {
      if (strokeWidth === 1) {
        for (let i = 0; i < 4; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 4];
          this.lineRenderer.drawLine1px(
            p1.x, p1.y,
            p2.x, p2.y,
            strokeR, strokeG, strokeB, strokeA
          );
        }
      } else {
        const halfStroke = strokeWidth / 2;

        for (let i = 0; i < 4; i += 2) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 4];
          const line = extendLine(p1, p2, halfStroke);

          this.lineRenderer.drawLineThick(
            line.start.x, line.start.y,
            line.end.x, line.end.y,
            strokeWidth,
            strokeR, strokeG, strokeB, strokeA
          );
        }

        for (let i = 1; i < 4; i += 2) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 4];
          const line = shortenLine(p1, p2, halfStroke);

          this.lineRenderer.drawLineThick(
            line.start.x, line.start.y,
            line.end.x, line.end.y,
            strokeWidth,
            strokeR, strokeG, strokeB, strokeA
          );
        }
      }
    }
  }

  clearRotatedRect(centerX, centerY, width, height, rotation) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    const points = [
      [-width / 2, -height / 2],
      [width / 2, -height / 2],
      [width / 2, height / 2],
      [-width / 2, height / 2]
    ].map(([x, y]) => ({
      x: centerX + x * cos - y * sin,
      y: centerY + x * sin + y * cos
    }));

    const minX = Math.floor(Math.min(...points.map(p => p.x)));
    const maxX = Math.ceil(Math.max(...points.map(p => p.x)));
    const minY = Math.floor(Math.min(...points.map(p => p.y)));
    const maxY = Math.ceil(Math.max(...points.map(p => p.y)));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (pointInPolygon(x, y, points)) {
          this.pixelRenderer.clearPixel(x, y);
        }
      }
    }
  }

  drawAxisAlignedRect(centerX, centerY, rectWidth, rectHeight,
    strokeWidth, strokeR, strokeG, strokeB, strokeA,
    fillR, fillG, fillB, fillA) {
    centerX = Math.round(centerX);
    centerY = Math.round(centerY);
    rectWidth = Math.round(rectWidth);
    rectHeight = Math.round(rectHeight);
    strokeWidth = Math.round(strokeWidth);

    const halfWidth = Math.floor(rectWidth / 2);
    const halfHeight = Math.floor(rectHeight / 2);
    
    const pathLeft = centerX - halfWidth;
    const pathTop = centerY - halfHeight;
    const pathRight = pathLeft + rectWidth;
    const pathBottom = pathTop + rectHeight;
    
    // draw fill first
    if (fillA > 0) {
      const inset = Math.ceil(strokeWidth / 2) - 1;
      const fillLeft = pathLeft + inset + 1;
      const fillRight = pathRight - inset - 1;
      const fillTop = pathTop + inset + 1;
      const fillBottom = pathBottom - inset - 1;
      
      for (let y = fillTop; y < fillBottom; y++) {
        for (let x = fillLeft; x < fillRight; x++) {
          this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }

    if (strokeA > 0 && strokeWidth > 0) {
      const outsetStroke = Math.floor(strokeWidth / 2);
      const insetStroke = Math.ceil(strokeWidth / 2);

      const strokeOuterLeft = pathLeft - outsetStroke;
      const strokeOuterRight = pathRight + outsetStroke;
      const strokeOuterTop = pathTop - outsetStroke;
      const strokeOuterBottom = pathBottom + outsetStroke;

      const strokeInnerLeft = pathLeft + insetStroke;
      const strokeInnerRight = pathRight - insetStroke;
      const strokeInnerTop = pathTop + insetStroke;
      const strokeInnerBottom = pathBottom - insetStroke;

      // Draw all pixels that are within stroke distance of the path
      for (let y = strokeOuterTop; y < strokeOuterBottom; y++) {
        for (let x = strokeOuterLeft; x < strokeOuterRight; x++) {
          // Skip the inner rectangle (area beyond stroke width)
          if (x >= strokeInnerLeft && x < strokeInnerRight && 
            y >= strokeInnerTop && y < strokeInnerBottom) {
            continue;
          }
          this.pixelRenderer.setPixel(x, y, strokeR, strokeG, strokeB, strokeA);
        }
      }
    }
  }

  clearAxisAlignedRect(centerX, centerY, rectWidth, rectHeight) {
    // Round inputs for consistency with draw function
    centerX = Math.round(centerX);
    centerY = Math.round(centerY);
    rectWidth = Math.round(rectWidth);
    rectHeight = Math.round(rectHeight);

    const halfWidth = Math.floor(rectWidth / 2);
    const halfHeight = Math.floor(rectHeight / 2);
    const pathLeft = centerX - halfWidth;
    const pathTop = centerY - halfHeight;
    const pathRight = pathLeft + rectWidth;
    const pathBottom = pathTop + rectHeight;

    for (let y = pathTop; y < pathBottom; y++) {
      for (let x = pathLeft; x < pathRight; x++) {
        this.pixelRenderer.clearPixel(x, y);
      }
    }
  }
}