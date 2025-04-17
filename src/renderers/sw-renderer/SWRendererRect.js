class SWRendererRect {
  constructor(frameBufferUint8ClampedView, frameBufferUint32View, width, height, lineRenderer, pixelRenderer) {
    this.frameBufferUint8ClampedView = frameBufferUint8ClampedView;
    this.frameBufferUint32View = frameBufferUint32View;
    this.width = width;
    this.height = height;
    this.lineRenderer = lineRenderer;
    this.pixelRenderer = pixelRenderer;
  }

  drawRect(shape) {
    if(shape.clippingOnly) {
      if (isNearMultipleOf90Degrees(shape.rotation)) {
        const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(shape.width, shape.height, shape.rotation);
        this.drawAxisAlignedRect(shape.center.x, shape.center.y, adjustedWidth, adjustedHeight, true);
      } else {
        this.drawRotatedRect(shape.center.x, shape.center.y, shape.width, shape.height, shape.rotation, true);
      }
      return;
    }

    const {
      center, width, height, rotation, clippingOnly,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    if (isNearMultipleOf90Degrees(rotation)) {
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(width, height, rotation);
      this.drawAxisAlignedRect(center.x, center.y, adjustedWidth, adjustedHeight, clippingOnly,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    } else {
      this.drawRotatedRect(center.x, center.y, width, height, rotation, clippingOnly,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    }
  }

  clearRect(shape) {
    const center = shape.center;
    const shapeWidth = shape.width;
    const shapeHeight = shape.height;
    const rotation = shape.rotation;

    if (isNearMultipleOf90Degrees(rotation)) {
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(shapeWidth, shapeHeight, rotation);
      
      if (adjustedWidth === this.width && 
        adjustedHeight === this.height &&
        center.x === adjustedWidth / 2 &&
        center.y === adjustedHeight / 2) {
        this.frameBufferUint8ClampedView.fill(0);
        return;
      }
      this.clearAxisAlignedRect(center.x, center.y, adjustedWidth, adjustedHeight);
    } else {
      this.fillRotatedRect(center.x, center.y, shapeWidth, shapeHeight, rotation, false, true);
    }
  }

  drawRotatedRect(centerX, centerY, width, height, rotation, clippingOnly, strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    // draw fill first
    if (clippingOnly || fillA > 0) {
      this.fillRotatedRect(centerX, centerY, width, height, rotation, clippingOnly, false, fillR, fillG, fillB, fillA);
    }
    if (clippingOnly) {
      return;
    }

    if (strokeA > 0) {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const points = [
        [-halfWidth, -halfHeight],
        [halfWidth, -halfHeight],
        [halfWidth, halfHeight],
        [-halfWidth, halfHeight]
      ].map(([x, y]) => ({
        x: centerX + x * cos - y * sin,
        y: centerY + x * sin + y * cos
      }));

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

  drawAxisAlignedRect(centerX, centerY, rectWidth, rectHeight, clippingOnly,
    strokeWidth, strokeR, strokeG, strokeB, strokeA,
    fillR, fillG, fillB, fillA) {
    
    // Round inputs for consistency
    //centerX = Math.round(centerX);
    //centerY = Math.round(centerY);
    //rectWidth = Math.round(rectWidth);
    //rectHeight = Math.round(rectHeight);
    //strokeWidth = Math.round(strokeWidth);
    if (clippingOnly) {strokeWidth = 0;}
  
    
    // Draw fill first
    if (clippingOnly || fillA > 0) {
      // Get fill geometry
      let fillPos = null;

      // If we are drawing the fill under a fully opaque stroke, then we can ignore some minor defects
      // in positioning that would make the fill not crisp (and hence would show differently in the
      // standard canvas renderer), as they will be covered by the stroke.
      // If instead we are drawing the fill under a semi-transparent (or non existent) stroke, then we
      // throw a warning, as the rendering would be different in the standard canvas renderer.
      if (strokeA == 255 && strokeWidth > 0) {
        fillPos = roundCornerOfRectangularGeometry(getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight));
      } else {
        fillPos = roundCornerOfRectangularGeometryWithWarning(getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight));
      }
      if (clippingOnly) {
        for (let y = Math.floor(fillPos.y); y < Math.ceil(fillPos.y + fillPos.h); y++) {
          for (let x = Math.floor(fillPos.x); x < Math.ceil(fillPos.x + fillPos.w); x++) {
            this.pixelRenderer.clipPixel(x, y);
          }
        }
        return;
      }
  
      for (let y = Math.floor(fillPos.y); y < Math.ceil(fillPos.y + fillPos.h); y++) {
        for (let x = Math.floor(fillPos.x); x < Math.ceil(fillPos.x + fillPos.w); x++) {
          this.pixelRenderer.setPixel(x, y, fillR, fillG, fillB, fillA);
        }
      }
    }
  
    // Draw stroke if needed. Note that the stroke can't always be precisely centered on the fill
    // i.e. in case the stroke is larger by an odd number of pixels.
    if (strokeA > 0 && strokeWidth > 0) {
      let strokePos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
      const halfStroke = strokeWidth / 2;
  
      // Draw horizontal strokes
      for (let x = Math.floor(strokePos.x - halfStroke); x < strokePos.x + strokePos.w + halfStroke; x++) {
        for (let t = -halfStroke; t < halfStroke; t++) {
          this.pixelRenderer.setPixel(x, strokePos.y + t, strokeR, strokeG, strokeB, strokeA);
          this.pixelRenderer.setPixel(x, strokePos.y + strokePos.h + t, strokeR, strokeG, strokeB, strokeA);
        }
      }
  
      // Draw vertical strokes
      for (let y = Math.floor(strokePos.y + halfStroke); y < strokePos.y + strokePos.h - halfStroke; y++) {
        for (let t = -halfStroke; t < halfStroke; t++) {
          this.pixelRenderer.setPixel(strokePos.x + t, y, strokeR, strokeG, strokeB, strokeA);
          this.pixelRenderer.setPixel(strokePos.x + strokePos.w + t, y, strokeR, strokeG, strokeB, strokeA);
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

  fillRotatedRect(centerX, centerY, width, height, rotation, clippingOnly, clear, r, g, b, a) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const hw = width / 2;
    const hh = height / 2;
    
    // Calculate corners
    const corners = [
      { x: centerX + hw * cos - hh * sin, y: centerY + hw * sin + hh * cos },
      { x: centerX + hw * cos + hh * sin, y: centerY + hw * sin - hh * cos },
      { x: centerX - hw * cos + hh * sin, y: centerY - hw * sin - hh * cos },
      { x: centerX - hw * cos - hh * sin, y: centerY - hw * sin + hh * cos }
    ];
    
    // Create edge functions for each edge
    const edges = [];
    for(let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      
      // Edge equation coefficients
      const a = p2.y - p1.y;
      const b = p1.x - p2.x;
      const c = p2.x * p1.y - p1.x * p2.y;
      
      edges.push({a, b, c});
    }
    
    // Find bounding box
    const minX = Math.floor(Math.min(...corners.map(p => p.x)));
    const maxX = Math.ceil(Math.max(...corners.map(p => p.x)));
    const minY = Math.floor(Math.min(...corners.map(p => p.y)));
    const maxY = Math.ceil(Math.max(...corners.map(p => p.y)));
    
    // Test each pixel using edge functions
    if (clippingOnly) {
      for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
          // A point is inside if it's on the "inside" of all edges
          const inside = edges.every(edge => 
            (edge.a * x + edge.b * y + edge.c) >= 0
          );
          
          if(inside) {
            this.pixelRenderer.clipPixel(x, y);
          }
        }
      }
    }
    else if (clear) {
      for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
          // A point is inside if it's on the "inside" of all edges
          const inside = edges.every(edge => 
            (edge.a * x + edge.b * y + edge.c) >= 0
          );
          
          if(inside) {
            this.pixelRenderer.clearPixel(x, y);
          }
        }
      }
    }
    else {
      for(let y = minY; y <= maxY; y++) {
        for(let x = minX; x <= maxX; x++) {
          // A point is inside if it's on the "inside" of all edges
          const inside = edges.every(edge => 
            (edge.a * x + edge.b * y + edge.c) >= 0
          );
          
          if(inside) {
            this.pixelRenderer.setPixel(x, y, r, g, b, a);
          }
        }
      }
    }
  }
}