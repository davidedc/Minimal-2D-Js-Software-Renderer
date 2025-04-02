class SWRendererLine {
  constructor(pixelRenderer) {
    this.pixelRenderer = pixelRenderer;
    
    // Pre-allocated arrays for the polygon scan algorithm
    this._corners = [
      { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }
    ];
    this._edges = [
      { p1: this._corners[0], p2: this._corners[1], invDeltaY: 0, deltaX: 0 },
      { p1: this._corners[1], p2: this._corners[2], invDeltaY: 0, deltaX: 0 },
      { p1: this._corners[2], p2: this._corners[3], invDeltaY: 0, deltaX: 0 },
      { p1: this._corners[3], p2: this._corners[0], invDeltaY: 0, deltaX: 0 }
    ];
    this._intersections = new Array(8); // Pre-allocate space for intersections
    this._pixelRuns = []; // This will grow as needed
  }

  drawLine(shape) {
    const {
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: strokeWidth,
      color: { r: strokeR, g: strokeG, b: strokeB, a: strokeA }
    } = shape;

    // Handle the thick line case
    if (strokeWidth !== 1) {
      this.drawLineThick(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA);
      return;
    }
    
    // 1px line path follows
    
    // Tweaks to make the sw render match more closely the canvas render.
    // -----------------------------------------------------------------
    // For an intuition about why this works, imagine a thin vertical line.
    // If the start point is at x1 = 0.5, y1 = 0.5, then it means that
    // in canvas we mean to draw it crisply (because the path line is centered in the
    // middle of the pixel and extends 0.5 pixels in each direction to perfectly cover
    // one column). In SW, we need to draw that case at x = 0, y = 0.
    // If the start point is at x1 = 1, y1 = 1, then it means that in canvas we
    // mean to draw it "blurry" (because the path line is centered in between
    // pixels and hence the line extends 0.5 pixels in each direction to cover half of two columns).
    // In SW, we still draw it crisply (this library doesn't support anti-aliasing / sub-pixel
    // rendering), so we have to pick one of the half-columns to be drawn fully.
    // We choose the right one, but in general the floor() means that
    // we pick the one that is closer to the center of the path (which should be the
    // darker one as it's the most covered by the path).
    let floorX1 = Math.floor(x1);
    let floorY1 = Math.floor(y1);
    let floorX2 = Math.floor(x2);
    let floorY2 = Math.floor(y2);
    
    // MOREOVER, in Canvas you reason in terms of grid lines, so
    // in case of a vertical line, where you want the two renders to be
    // identical, for example three grid lines actually cover the span
    // of 2 pixels.
    // However, in SW you reason in terms of pixels, so you can't cover
    // "three" as in Canvas, rather "two" because you actually want to
    // cover two pixels, not three.
    // Hence, in a nutshell, you have to tweak the received parameters
    // (which work in canvas) by shortening the line by 1 pixel if it's vertical.
    //
    // Note how always decreasing the bottom y coordinate is always correct:
    //
    //          Case y2 > y1            #          Case y1 > y2
    //       e.g. y1 = 1, y2 = 3        #       e.g. y1 = 3, y2 = 1
    //      (drawing going down)        #       (drawing going up)
    //  ------------------------------- # ---------------------------------
    //  Before adjustment:              #   Before adjustment:
    //    0                             #     0
    //    1 ● ↓                         #     1 ●
    //    2 ● ↓                         #     2 ● ↑
    //    3 ●                           #     3 ● ↑
    //  ------------------------------- # ---------------------------------
    //  After adjustment (i.e. y2--):   #   After adjustment (i.e. y1--):
    //    0                             #     0
    //    1 ● ↓                         #     1 ●
    //    2 ●                           #     2 ● ↑
    //    3                             #     3
    //
    // Note also that this "off by one" difference is always present also
    // in oblique lines, however a) you don't expect the renders to be
    // identical in those cases as sw render doesn't support anti-aliasing / sub-pixel
    // rendering anyways and b) the difference is barely noticeable in those cases.
    if (floorX1 === floorX2) floorY2 > floorY1 ? floorY2-- : floorY1--;
    if (floorY1 === floorY2) floorX2 > floorX1 ? floorX2-- : floorX1--;

    // Skip if fully transparent
    const globalAlpha = this.pixelRenderer.context.globalAlpha;
    if ((strokeA === 0) || (globalAlpha <= 0)) return;

    // Calculate absolute differences for orientation detection
    const dx = Math.abs(floorX2 - floorX1);
    const dy = Math.abs(floorY2 - floorY1);

    // Dispatch to specialized renderers based on line orientation
    if (dx === 0) {
      // Vertical line
      return this.drawLine1px_vertical(floorX1, floorY1, floorY2, strokeR, strokeG, strokeB, strokeA);
    } else if (dy === 0) {
      // Horizontal line
      return this.drawLine1px_horizontal(floorX1, floorX2, floorY1, strokeR, strokeG, strokeB, strokeA);
    } else if (dx === dy) {
      // Perfect 45-degree line
      return this.drawLine1px_45degrees(floorX1, floorY1, floorX2, floorY2, strokeR, strokeG, strokeB, strokeA);
    } else {
      // All other lines
      return this.drawLine1px_genericOrientations(floorX1, floorY1, floorX2, floorY2, dx, dy, strokeR, strokeG, strokeB, strokeA);
    }
  }

  drawLine1px_horizontal(x1, x2, y, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBuffer = this.pixelRenderer.frameBuffer;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Early bounds check
    if (y < 0 || y >= height) return;
    
    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Ensure x1 < x2 for simpler logic
    if (x1 > x2) {
      let temp = x1;
      x1 = x2;
      x2 = temp;
    }
    
    // Clip to canvas boundaries
    if (x1 < 0) x1 = 0;
    if (x2 >= width) x2 = width - 1;
    if (x1 > x2) return;
    
    // Calculate base index for the row
    const baseIndex = (y * width + x1) * 4;
    
    // Draw the horizontal line
    for (let x = x1; x <= x2; x++) {
      const index = baseIndex + (x - x1) * 4;
      
      // Check clipping if needed
      if (hasClipping) {
        const pixelPos = y * width + x;
        const clippingMaskByteIndex = pixelPos >> 3;
        const bitIndex = pixelPos & 7;
        
        if (clippingMask[clippingMaskByteIndex] === 0) continue;
        if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
      }
      
      if (isOpaque) {
        // Fast path for opaque pixels
        frameBuffer[index] = r;
        frameBuffer[index + 1] = g;
        frameBuffer[index + 2] = b;
        frameBuffer[index + 3] = 255;
      } else {
        // Alpha blending
        const oldAlpha = frameBuffer[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;
        
        if (newAlpha <= 0) continue;
        
        const blendFactor = 1 / newAlpha;
        frameBuffer[index] = (r * incomingAlpha + frameBuffer[index] * oldAlphaScaled) * blendFactor;
        frameBuffer[index + 1] = (g * incomingAlpha + frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
        frameBuffer[index + 2] = (b * incomingAlpha + frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
        frameBuffer[index + 3] = newAlpha * 255;
      }
    }
  }

  drawLine1px_vertical(x, y1, y2, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBuffer = this.pixelRenderer.frameBuffer;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Early bounds check
    if (x < 0 || x >= width) return;
    
    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Ensure y1 < y2 for simpler logic
    if (y1 > y2) {
      let temp = y1;
      y1 = y2;
      y2 = temp;
    }
    
    // Clip to canvas boundaries
    if (y1 < 0) y1 = 0;
    if (y2 >= height) y2 = height - 1;
    if (y1 > y2) return;
    
    // Draw the vertical line
    for (let y = y1; y <= y2; y++) {
      const index = (y * width + x) * 4;
      
      // Check clipping if needed
      if (hasClipping) {
        const pixelPos = y * width + x;
        const clippingMaskByteIndex = pixelPos >> 3;
        const bitIndex = pixelPos & 7;
        
        if (clippingMask[clippingMaskByteIndex] === 0) continue;
        if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) continue;
      }
      
      if (isOpaque) {
        // Fast path for opaque pixels
        frameBuffer[index] = r;
        frameBuffer[index + 1] = g;
        frameBuffer[index + 2] = b;
        frameBuffer[index + 3] = 255;
      } else {
        // Alpha blending
        const oldAlpha = frameBuffer[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;
        
        if (newAlpha <= 0) continue;
        
        const blendFactor = 1 / newAlpha;
        frameBuffer[index] = (r * incomingAlpha + frameBuffer[index] * oldAlphaScaled) * blendFactor;
        frameBuffer[index + 1] = (g * incomingAlpha + frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
        frameBuffer[index + 2] = (b * incomingAlpha + frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
        frameBuffer[index + 3] = newAlpha * 255;
      }
    }
  }

  drawLine1px_45degrees(x1, y1, x2, y2, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBuffer = this.pixelRenderer.frameBuffer;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Direction of movement (1 or -1) in each axis
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // Since this is a 45-degree line, we always step diagonally
    // No error tracking needed as with Bresenham algorithm
    let x = x1;
    let y = y1;
    
    // Draw the 45-degree line
    while (true) {
      // Break if we've gone out of bounds entirely
      if (x < 0 && sx < 0) break; // Moving left and already off left edge
      if (x >= width && sx > 0) break; // Moving right and already off right edge
      if (y < 0 && sy < 0) break; // Moving up and already off top edge
      if (y >= height && sy > 0) break; // Moving down and already off bottom edge
      
      // Check if we're in bounds for this pixel
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const index = (y * width + x) * 4;
        const pixelPos = y * width + x;
        
        // Check clipping if needed
        let drawPixel = true;
        
        if (hasClipping) {
          const clippingMaskByteIndex = pixelPos >> 3;
          const bitIndex = pixelPos & 7;
          
          // Skip if clipping mask indicates pixel should be clipped
          if (clippingMaskByteIndex >= clippingMask.length ||
              clippingMask[clippingMaskByteIndex] === 0 || 
              (clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
            drawPixel = false;
          }
        }
        
        if (drawPixel) {
          if (isOpaque) {
            // Fast path for opaque pixels
            frameBuffer[index] = r;
            frameBuffer[index + 1] = g;
            frameBuffer[index + 2] = b;
            frameBuffer[index + 3] = 255;
          } else {
            // Alpha blending
            const oldAlpha = frameBuffer[index + 3] / 255;
            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
            const newAlpha = incomingAlpha + oldAlphaScaled;
            
            if (newAlpha > 0) {
              const blendFactor = 1 / newAlpha;
              frameBuffer[index] = (r * incomingAlpha + frameBuffer[index] * oldAlphaScaled) * blendFactor;
              frameBuffer[index + 1] = (g * incomingAlpha + frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
              frameBuffer[index + 2] = (b * incomingAlpha + frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
              frameBuffer[index + 3] = newAlpha * 255;
            }
          }
        }
      }
      
      // Check if we've reached the end point
      if (x === x2 && y === y2) break;
      
      // Move diagonally - for 45-degree lines, we move by 1 in both directions each time
      x += sx;
      y += sy;
    }
  }

  drawLine1px_genericOrientations(x1, y1, x2, y2, dx, dy, r, g, b, a) {
    // Cache renderer properties for performance
    const frameBuffer = this.pixelRenderer.frameBuffer;
    const width = this.pixelRenderer.width;
    const height = this.pixelRenderer.height;
    const hasClipping = this.pixelRenderer.context.currentState;
    const clippingMask = hasClipping ? this.pixelRenderer.context.currentState.clippingMask : null;
    const globalAlpha = this.pixelRenderer.context.globalAlpha;

    // Fast path for opaque colors
    const isOpaque = (a === 255) && (globalAlpha >= 1.0);
    
    // For non-opaque colors, pre-compute alpha values
    const incomingAlpha = isOpaque ? 1.0 : (a / 255) * globalAlpha;
    const inverseIncomingAlpha = isOpaque ? 0.0 : 1 - incomingAlpha;
    
    // Direction of movement in each axis
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // Initialize Bresenham algorithm state
    let err = dx - dy;
    
    // We prefer to do bounds checking inside the loop for generic orientations
    // Since they can enter and exit the viewable area multiple times
    while (true) {
      // Check if current pixel is in bounds
      if (x1 >= 0 && x1 < width && y1 >= 0 && y1 < height) {
        const index = (y1 * width + x1) * 4;
        const pixelPos = y1 * width + x1;
        
        // Check clipping if needed
        let drawPixel = true;
        
        if (hasClipping) {
          const clippingMaskByteIndex = pixelPos >> 3;
          const bitIndex = pixelPos & 7;
          
          if (clippingMaskByteIndex >= clippingMask.length ||
              clippingMask[clippingMaskByteIndex] === 0 || 
              (clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
            drawPixel = false;
          }
        }
        
        if (drawPixel) {
          if (isOpaque) {
            // Fast path for opaque pixels
            frameBuffer[index] = r;
            frameBuffer[index + 1] = g;
            frameBuffer[index + 2] = b;
            frameBuffer[index + 3] = 255;
          } else {
            // Alpha blending
            const oldAlpha = frameBuffer[index + 3] / 255;
            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
            const newAlpha = incomingAlpha + oldAlphaScaled;
            
            if (newAlpha > 0) {
              const blendFactor = 1 / newAlpha;
              frameBuffer[index] = (r * incomingAlpha + frameBuffer[index] * oldAlphaScaled) * blendFactor;
              frameBuffer[index + 1] = (g * incomingAlpha + frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
              frameBuffer[index + 2] = (b * incomingAlpha + frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
              frameBuffer[index + 3] = newAlpha * 255;
            }
          }
        }
      }
      
      // Break after processing the last pixel
      if (x1 === x2 && y1 === y2) break;
      
      // Calculate next pixel position using Bresenham algorithm
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  drawLineThick(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Original algorithm - bounding box with distance check
    //this.drawLineThickBoundingBox(x1, y1, x2, y2, thickness, r, g, b, a);
    
    // Uncomment one of these to use a different algorithm:
    // this.drawLineThickModifiedBresenham(x1, y1, x2, y2, thickness, r, g, b, a);
    // this.drawLineThickDistanceOptimized(x1, y1, x2, y2, thickness, r, g, b, a);
    // this.drawLineThickParallelOffset(x1, y1, x2, y2, thickness, r, g, b, a);
    this.drawLineThickPolygonScan(x1, y1, x2, y2, thickness, r, g, b, a);
  }

  /**
   * Algorithm 1: Original bounding box algorithm
   * Scans a rectangle containing the entire thick line and checks each pixel's distance
   */
  drawLineThickBoundingBox(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Tweaks to make the sw render more closely match the canvas render.
    // Canvas coordinates are offset by 0.5 pixels, so adjusting here
    x1 -= 0.5;
    y1 -= 0.5;
    x2 -= 0.5;
    y2 -= 0.5;

    // Calculate the line's direction vector and length
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Skip empty lines
    if (length === 0) return;
    
    // Calculate a perpendicular unit vector to the line
    // This vector points 90 degrees to the line direction
    const perpX = -dy / length;
    const perpY = dx / length;
    
    // Calculate half the thickness to offset from the line center
    const halfThickness = thickness / 2;
    
    // Calculate the four corners of the rectangle formed by the thick line
    // These are the endpoints offset perpendicular to the line by half thickness
    const corners = [
      [x1 + perpX * halfThickness, y1 + perpY * halfThickness], // Top-left
      [x1 - perpX * halfThickness, y1 - perpY * halfThickness], // Bottom-left
      [x2 + perpX * halfThickness, y2 + perpY * halfThickness], // Top-right
      [x2 - perpX * halfThickness, y2 - perpY * halfThickness]  // Bottom-right
    ];
    
    // Determine the bounding box of the thick line
    // This optimizes rendering by only checking pixels within this box
    const minX = Math.floor(Math.min(...corners.map(c => c[0])));
    const maxX = Math.ceil(Math.max(...corners.map(c => c[0])));
    const minY = Math.floor(Math.min(...corners.map(c => c[1])));
    const maxY = Math.ceil(Math.max(...corners.map(c => c[1])));
    
    // For each pixel in the bounding box, check if it should be colored
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Calculate the vector from the line start to the current pixel
        const px = x - x1;
        const py = y - y1;
        
        // Calculate the projection of pixel position onto the line
        // The dot product tells us how far along the line the closest point is
        const dot = (px * dx + py * dy) / length;
        
        // Calculate the coordinates of the projected point on the line
        const projX = (dx / length) * dot;
        const projY = (dy / length) * dot;
        
        // Calculate the distance from the pixel to its closest point on the line
        const distX = px - projX;
        const distY = py - projY;
        const dist = Math.sqrt(distX * distX + distY * distY);
        
        // If the pixel is both:
        // 1. Within the line segment (not beyond endpoints)
        // 2. Within the specified thickness from the line
        // Then draw it
        if (dot >= 0 && dot <= length && dist <= halfThickness) {
          this.pixelRenderer.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  /**
   * Algorithm 2: Modified Bresenham algorithm for thick lines
   * Extends the classic Bresenham line algorithm to draw perpendicular segments
   */
  drawLineThickModifiedBresenham(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    x1 = Math.floor(x1 - 0.5);
    y1 = Math.floor(y1 - 0.5);
    x2 = Math.floor(x2 - 0.5);
    y2 = Math.floor(y2 - 0.5);
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // Calculate perpendicular direction
    let perpX, perpY;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    
    if (lineLength === 0) {
      // Handle zero-length line case (draw a square)
      const halfThick = Math.floor(thickness / 2);
      for (let py = -halfThick; py <= halfThick; py++) {
        for (let px = -halfThick; px <= halfThick; px++) {
          this.pixelRenderer.setPixel(x1 + px, y1 + py, r, g, b, a);
        }
      }
      return;
    }
    
    perpX = -dy / lineLength;
    perpY = dx / lineLength;
    
    // Half thickness for extending in both directions
    const halfThick = thickness / 2;
    
    let err = dx - dy;
    let x = x1;
    let y = y1;
    
    // For each point along the line
    while (true) {
      // Draw perpendicular segment at each point
      this.drawPerpendicularSegment(x, y, perpX, perpY, halfThick, r, g, b, a);
      
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    
    // Draw square caps at endpoints
    const dirX1 = (x2 - x1) / lineLength;
    const dirY1 = (y2 - y1) / lineLength;
    this.drawSquareCap(x1, y1, perpX, perpY, halfThick, -dirX1, -dirY1, r, g, b, a);
    this.drawSquareCap(x2, y2, perpX, perpY, halfThick, dirX1, dirY1, r, g, b, a);
  }
  
  /**
   * Helper method to draw a perpendicular segment at a point
   */
  drawPerpendicularSegment(x, y, perpX, perpY, halfThick, r, g, b, a) {
    const steps = Math.ceil(halfThick);
    
    // Draw center pixel
    this.pixelRenderer.setPixel(x, y, r, g, b, a);
    
    // Draw pixels along the perpendicular direction
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps * halfThick;
      // Draw in both perpendicular directions
      const px1 = Math.round(x + perpX * ratio);
      const py1 = Math.round(y + perpY * ratio);
      const px2 = Math.round(x - perpX * ratio);
      const py2 = Math.round(y - perpY * ratio);
      
      this.pixelRenderer.setPixel(px1, py1, r, g, b, a);
      this.pixelRenderer.setPixel(px2, py2, r, g, b, a);
    }
  }
  
  /**
   * Draw a square cap at the endpoint of a line
   */
  drawSquareCap(x, y, perpX, perpY, halfThick, dirX, dirY, r, g, b, a) {
    const steps = Math.ceil(halfThick);
    
    for (let i = 1; i <= steps; i++) {
      const ratio = i / steps * halfThick;
      // Draw in the direction of the line extension
      const extX = Math.round(x + dirX * ratio);
      const extY = Math.round(y + dirY * ratio);
      
      // Draw perpendicular segment at this extended point
      this.drawPerpendicularSegment(extX, extY, perpX, perpY, halfThick, r, g, b, a);
    }
  }

  /**
   * Algorithm 3: Distance-based approach with center line optimization
   * First rasterizes the center line, then draws perpendicular spans
   */
  drawLineThickDistanceOptimized(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    x1 = Math.floor(x1 - 0.5);
    y1 = Math.floor(y1 - 0.5);
    x2 = Math.floor(x2 - 0.5);
    y2 = Math.floor(y2 - 0.5);
    
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    
    // For perpendicular spans
    const lineLength = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = Math.floor(thickness / 2);
      for (let py = -radius; py <= radius; py++) {
        for (let px = -radius; px <= radius; px++) {
          this.pixelRenderer.setPixel(x1 + px, y1 + py, r, g, b, a);
        }
      }
      return;
    }
    
    // Unit vector perpendicular to the line
    const perpX = -((y2 - y1) / lineLength);
    const perpY = ((x2 - x1) / lineLength);
    
    // Half thickness for extending in both directions
    const halfThick = Math.floor(thickness / 2);
    
    // Draw the center line using Bresenham's algorithm
    let err = dx - dy;
    let x = x1;
    let y = y1;
    
    // Collect center line points
    const centerPoints = [];
    while (true) {
      centerPoints.push({ x, y });
      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    
    // Draw horizontal spans at each center point
    for (const point of centerPoints) {
      for (let t = -halfThick; t <= halfThick; t++) {
        const px = Math.round(point.x + perpX * t);
        const py = Math.round(point.y + perpY * t);
        this.pixelRenderer.setPixel(px, py, r, g, b, a);
      }
    }
    
    // Draw square caps
    // For start cap
    const dirX1 = -(x2 - x1) / lineLength;
    const dirY1 = -(y2 - y1) / lineLength;
    for (let i = 1; i <= halfThick; i++) {
      const capX = Math.round(x1 + dirX1 * i);
      const capY = Math.round(y1 + dirY1 * i);
      
      // Draw horizontal span at this cap point
      for (let t = -halfThick; t <= halfThick; t++) {
        const px = Math.round(capX + perpX * t);
        const py = Math.round(capY + perpY * t);
        this.pixelRenderer.setPixel(px, py, r, g, b, a);
      }
    }
    
    // For end cap
    const dirX2 = (x2 - x1) / lineLength;
    const dirY2 = (y2 - y1) / lineLength;
    for (let i = 1; i <= halfThick; i++) {
      const capX = Math.round(x2 + dirX2 * i);
      const capY = Math.round(y2 + dirY2 * i);
      
      // Draw horizontal span at this cap point
      for (let t = -halfThick; t <= halfThick; t++) {
        const px = Math.round(capX + perpX * t);
        const py = Math.round(capY + perpY * t);
        this.pixelRenderer.setPixel(px, py, r, g, b, a);
      }
    }
  }

  /**
   * Algorithm 4: Parallel offset lines approach
   * Creates multiple parallel lines offset from the center line to create thickness
   */
  drawLineThickParallelOffset(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    x1 = Math.floor(x1 - 0.5);
    y1 = Math.floor(y1 - 0.5);
    x2 = Math.floor(x2 - 0.5);
    y2 = Math.floor(y2 - 0.5);
    
    const lineLength = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = Math.floor(thickness / 2);
      for (let py = -radius; py <= radius; py++) {
        for (let px = -radius; px <= radius; px++) {
          this.pixelRenderer.setPixel(x1 + px, y1 + py, r, g, b, a);
        }
      }
      return;
    }
    
    // Calculate perpendicular vector
    const perpX = -((y2 - y1) / lineLength);
    const perpY = ((x2 - x1) / lineLength);
    
    // Line direction unit vector for caps
    const dirX = (x2 - x1) / lineLength;
    const dirY = (y2 - y1) / lineLength;
    
    // Half thickness
    const halfThick = thickness / 2;
    
    // Draw offset lines
    const offsetCount = Math.ceil(halfThick);
    for (let offset = -offsetCount; offset <= offsetCount; offset++) {
      // Calculate offset ratio to ensure even coverage
      const offsetRatio = offset / offsetCount * halfThick;
      
      // Calculate offset points
      const ox1 = x1 + perpX * offsetRatio;
      const oy1 = y1 + perpY * offsetRatio;
      const ox2 = x2 + perpX * offsetRatio;
      const oy2 = y2 + perpY * offsetRatio;
      
      // Draw the offset line using Bresenham's algorithm
      this.drawBresenhamLine(Math.round(ox1), Math.round(oy1), 
                           Math.round(ox2), Math.round(oy2), 
                           r, g, b, a);
    }
    
    // Draw square caps
    // For start cap
    for (let offset = -offsetCount; offset <= offsetCount; offset++) {
      const offsetRatio = offset / offsetCount * halfThick;
      
      for (let i = 1; i <= halfThick; i++) {
        const capX = Math.round(x1 - dirX * i + perpX * offsetRatio);
        const capY = Math.round(y1 - dirY * i + perpY * offsetRatio);
        this.pixelRenderer.setPixel(capX, capY, r, g, b, a);
      }
    }
    
    // For end cap
    for (let offset = -offsetCount; offset <= offsetCount; offset++) {
      const offsetRatio = offset / offsetCount * halfThick;
      
      for (let i = 1; i <= halfThick; i++) {
        const capX = Math.round(x2 + dirX * i + perpX * offsetRatio);
        const capY = Math.round(y2 + dirY * i + perpY * offsetRatio);
        this.pixelRenderer.setPixel(capX, capY, r, g, b, a);
      }
    }
  }
  
  /**
   * Helper function: Standard Bresenham line algorithm
   */
  drawBresenhamLine(x1, y1, x2, y2, r, g, b, a) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
      this.pixelRenderer.setPixel(x1, y1, r, g, b, a);
      if (x1 === x2 && y1 === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  /**
   * Algorithm 5: Direct Rectangle Calculation with pixel runs
   * Treats the thick line as a four-sided polygon and directly computes spans
   * Optimized to eliminate sorting with direct span calculation
   */

  drawLineThickPolygonScan(x1, y1, x2, y2, thickness, r, g, b, a) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    
    // Reuse the pre-allocated pixel runs array, but clear it first
    const pixelRuns = this._pixelRuns;
    pixelRuns.length = 0;
    
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = thickness >> 1; // Bitwise right shift by 1 = divide by 2 and floor
      const centerX = x1 | 0; // Faster rounding using bitwise OR
      const centerY = y1 | 0;
      
      for (let py = -radius; py <= radius; py++) {
        // Add a complete horizontal run for each row
        pixelRuns.push(centerX - radius, centerY + py, (radius << 1) + 1); // (radius * 2) + 1
      }
      
      // Render all runs in a single batch
      this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);
      return;
    }
    
    // Cache common calculations - inverse line length to avoid division
    const invLineLength = 1 / lineLength;
    
    // Calculate perpendicular vector using multiplication instead of division
    const perpX = -dy * invLineLength;
    const perpY = dx * invLineLength;
    
    // Calculate half thickness
    const halfThick = thickness * 0.5;
    
    // Reuse pre-allocated corner objects
    const corners = this._corners;
    
    // Cache perpendicular offsets for corner calculations
    const perpXHalfThick = perpX * halfThick;
    const perpYHalfThick = perpY * halfThick;
    
    // Update the corners in-place to avoid allocations
    corners[0].x = x1 + perpXHalfThick;  corners[0].y = y1 + perpYHalfThick;  // top-left
    corners[1].x = x1 - perpXHalfThick;  corners[1].y = y1 - perpYHalfThick;  // bottom-left
    corners[2].x = x2 - perpXHalfThick;  corners[2].y = y2 - perpYHalfThick;  // bottom-right
    corners[3].x = x2 + perpXHalfThick;  corners[3].y = y2 + perpYHalfThick;  // top-right
    
    // Find bounding box using bitwise operations for faster floor/ceil
    const minY = (Math.min(corners[0].y, corners[1].y, corners[2].y, corners[3].y)) | 0;
    const maxY = (Math.max(corners[0].y, corners[1].y, corners[2].y, corners[3].y) + 0.999) | 0;
    
    // Pre-compute edge data to avoid recalculating slopes
    const edges = this._edges;
    
    for (let i = 0; i < 4; i++) {
      const edge = edges[i];
      const p1 = corners[i];
      const p2 = corners[(i + 1) & 3]; // Faster modulo for power of 2 using bitwise AND
      
      // Update edge endpoints
      edge.p1 = p1;
      edge.p2 = p2;
      
      // Pre-compute inverse delta Y to avoid division during scanline processing
      // Only update if not horizontal to avoid division by zero
      if (p1.y !== p2.y) {
        edge.invDeltaY = 1 / (p2.y - p1.y);
        edge.deltaX = p2.x - p1.x;
      }
    }
    
    // Reuse pre-allocated intersections array
    const intersections = this._intersections;
    
    // Scan each row
    for (let y = minY; y <= maxY; y++) {
      // Counter for intersections
      let intersectionCount = 0;
      
      for (let i = 0; i < 4; i++) {
        const edge = edges[i];
        const p1 = edge.p1;
        const p2 = edge.p2;
        
        // Skip horizontal edges
        if (p1.y === p2.y) continue;
        
        // Check if scanline intersects this edge
        if ((y >= p1.y && y < p2.y) || (y >= p2.y && y < p1.y)) {
          // Use pre-computed values for x-intersection
          const t = (y - p1.y) * edge.invDeltaY;
          intersections[intersectionCount++] = p1.x + t * edge.deltaX;
        }
      }
      
      if (intersectionCount === 1) {
        // Single intersection case - just draw one pixel
        const x = intersections[0] | 0; // Faster floor using bitwise OR
        pixelRuns.push(x, y, 1);
      }
      else if (intersectionCount === 2) {
        // Two intersections case - draw span between them
        const x1 = intersections[0];
        const x2 = intersections[1];
        // No need to sort - just compare directly
        const leftX = x1 < x2 ? x1 | 0 : x2 | 0; // Math.floor using bitwise OR
        const rightX = x1 > x2 ? (x1 + 0.999) | 0 : (x2 + 0.999) | 0; // Math.ceil approximation
        const spanLength = rightX - leftX;
        
        if (spanLength > 0) {
          pixelRuns.push(leftX, y, spanLength);
        }
      }
    }
    
    // Render all collected pixel runs in a single batch operation
    if (pixelRuns.length > 0) {
      this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);
    }
  }
}

