class SWRendererLine {
  constructor(pixelRenderer) {
    this.pixelRenderer = pixelRenderer;
  }

  drawLine(shape) {
    const {
      start: { x: x1, y: y1 },
      end: { x: x2, y: y2 },
      thickness: strokeWidth,
      color: { r: strokeR, g: strokeG, b: strokeB, a: strokeA }
    } = shape;

    if (strokeWidth === 1) {
      this.drawLine1px(x1, y1, x2, y2, strokeR, strokeG, strokeB, strokeA);
    } else {
      this.drawLineThick(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA);
    }
  }

  drawLine1px(x1, y1, x2, y2, r, g, b, a) {
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
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);
    x2 = Math.floor(x2);
    y2 = Math.floor(y2);
    
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

    if (x1 === x2) y2 > y1 ? y2-- : y1--;
    // same as above but for shortening the line by 1 pixel if it's horizontal
    if (y1 === y2) x2 > x1 ? x2-- : x1--;

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
   * Algorithm 5: Active Edge Table implementation with pixel runs
   * Optimized to completely eliminate sorting during rendering
   * Uses incremental updates for edge tracking and intersection calculation
   */
  drawLineThickPolygonScan(x1, y1, x2, y2, thickness, r, g, b, a) {
    // Adjust for canvas coordinate system
    //x1 -= 0.5;
    //y1 -= 0.5;
    //x2 -= 0.5;
    //y2 -= 0.5;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    
    // Array to collect pixel runs for batch rendering
    const pixelRuns = [];
    
    if (lineLength === 0) {
      // Handle zero-length line case
      const radius = Math.floor(thickness / 2);
      const centerX = Math.round(x1);
      const centerY = Math.round(y1);
      
      for (let py = -radius; py <= radius; py++) {
        // Add a complete horizontal run for each row
        pixelRuns.push(centerX - radius, centerY + py, 2 * radius + 1);
      }
      
      // Render all runs in a single batch
      this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);
      return;
    }
    
    // Calculate perpendicular vector
    const perpX = -dy / lineLength;
    const perpY = dx / lineLength;
    
    // Calculate half thickness
    const halfThick = thickness / 2;
    
    // Calculate the four corners of the rectangle
    const corners = [
      { x: x1 + perpX * halfThick, y: y1 + perpY * halfThick }, // 0: top-left for positive slope
      { x: x1 - perpX * halfThick, y: y1 - perpY * halfThick }, // 1: bottom-left for positive slope
      { x: x2 - perpX * halfThick, y: y2 - perpY * halfThick }, // 2: bottom-right for positive slope
      { x: x2 + perpX * halfThick, y: y2 + perpY * halfThick }  // 3: top-right for positive slope
    ];
    
    // Define edges (each connects two corners)
    const edges = [];
    
    // Connect corners to form the four edges
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      
      // Skip horizontal edges (won't be used in scanline algorithm)
      if (p1.y === p2.y) continue;
      
      // Ensure p1 is always the top point (lower y value)
      const top = p1.y < p2.y ? p1 : p2;
      const bottom = p1.y < p2.y ? p2 : p1;
      
      // Calculate edge parameters for incremental update
      const edge = {
        yStart: Math.floor(top.y),     // Start y (integer scanline)
        yEnd: Math.ceil(bottom.y),     // End y (integer scanline)
        x: top.x,                       // Current x at top y
        dx: (bottom.x - top.x) / (bottom.y - top.y) // Change in x per unit y
      };
      
      edges.push(edge);
    }
    
    // Find y bounds for all edges
    let minY = Infinity;
    let maxY = -Infinity;
    
    for (const edge of edges) {
      minY = Math.min(minY, edge.yStart);
      maxY = Math.max(maxY, edge.yEnd);
    }
    
    // Create the Active Edge Table - initially empty
    const activeEdges = [];
    
    // Process each scanline
    for (let y = minY; y <= maxY; y++) {
      // Step 1: Add new edges that start at this scanline
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (edge.yStart === y) {
          activeEdges.push({
            yEnd: edge.yEnd,
            x: edge.x,
            dx: edge.dx
          });
        }
      }
      
      // Step 2: Remove edges that end before this scanline
      for (let i = activeEdges.length - 1; i >= 0; i--) {
        if (activeEdges[i].yEnd <= y) {
          activeEdges.splice(i, 1);
        }
      }
      
      // Step 3: Generate scanline spans from active edges
      if (activeEdges.length >= 2) {
        // Find leftmost and rightmost intersection points
        // No sorting needed! Just find min and max directly
        let minX = Infinity;
        let maxX = -Infinity;
        
        for (const edge of activeEdges) {
          minX = Math.min(minX, edge.x);
          maxX = Math.max(maxX, edge.x);
        }
        
        // Convert to integer pixel coordinates with proper rounding
        const leftX = Math.floor(minX);
        const rightX = Math.ceil(maxX);
        const spanLength = rightX - leftX;
        
        // Add horizontal span to output
        if (spanLength > 0) {
          pixelRuns.push(leftX, y, spanLength);
        }
      }
      
      // Step 4: Update x-coordinates for the next scanline
      for (const edge of activeEdges) {
        edge.x += edge.dx;
      }
    }
    
    // Render all collected pixel runs in a single batch operation
    if (pixelRuns.length > 0) {
      this.pixelRenderer.setPixelRuns(pixelRuns, r, g, b, a);
    }
  }
}

