class SWRendererRoundedRect {
  constructor(frameBuffer, width, height, lineRenderer, pixelRenderer, swRectRenderer) {
    this.frameBuffer = frameBuffer;
    this.width = width;
    this.height = height;
    this.lineRenderer = lineRenderer;
    this.pixelRenderer = pixelRenderer;
    this.swRectRenderer = swRectRenderer;
  }

  drawRoundedRect(shape) {
    const {
      center, width, height, radius, rotation,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    // if the stroke is a) invisible (size zero or trasparent) OR b) opaque and thin,
    //  then use drawCrispAxisAlignedRoundedRectThinOpaqueStroke
    //  otherwise use drawCrispAxisAlignedRoundedRectThickOrSemitrasparentStroke
    if (rotation === 0) {
      const correctedRadius = radius > 2 ? radius - 1 : radius;
      if (strokeWidth == 0 || strokeA === 255 || (strokeWidth < 5 && strokeA === 255)) {
        this.drawCrispAxisAlignedRoundedRectThinOpaqueStroke(center.x, center.y, width, height, correctedRadius,
          strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA);
      } else {
        this.drawCrispAxisAlignedRoundedRectThickOrSemitrasparentStroke(center.x, center.y, width, height, correctedRadius,
          strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA);
      }
    } else {
      this.drawRotatedRoundedRect(center.x, center.y, width, height, radius, rotation,
        strokeWidth, strokeR, strokeG, strokeB, strokeA,
        fillR, fillG, fillB, fillA);
    }
  }

  drawCrispAxisAlignedRoundedRectThinOpaqueStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius,
    strokeWidth, strokeR, strokeG, strokeB, strokeA, fillR, fillG, fillB, fillA) {

    // to drow a crisp rectangle-like shape, while centerX and centerY could be non-integer,
    // the width and height must be integers, so let's throw an error if they are not
    if (rectWidth % 1 !== 0 || rectHeight % 1 !== 0) {
      throw new Error('Width and height must be integers');
    }

    // Handle fill
    if (fillA > 0) {
      this.drawRoundedRectFill(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth, 
        fillR, fillG, fillB, fillA);
    }

    // Handle stroke
    if (strokeA > 0) {
      if (strokeWidth === 1) {
        // For very thin strokes, use the simple direct drawing approach
        let pos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
        let r = Math.round(Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2));

        // Draw horizontal strokes
        for (let xx = Math.floor(pos.x + r); xx < pos.x + pos.w - r; xx++) {
            this.pixelRenderer.setPixel(xx, pos.y - 0.5, strokeR, strokeG, strokeB, strokeA);
            this.pixelRenderer.setPixel(xx, pos.y + pos.h - 0.5, strokeR, strokeG, strokeB, strokeA);
        }
        
        // Draw vertical strokes
        for (let yy = Math.floor(pos.y + r); yy < pos.y + pos.h - r; yy++) {
            this.pixelRenderer.setPixel(pos.x - 0.5, yy, strokeR, strokeG, strokeB, strokeA);
            this.pixelRenderer.setPixel(pos.x + pos.w - 0.5, yy, strokeR, strokeG, strokeB, strokeA);
        }

        // Draw corner strokes
        const drawCorner = (cx, cy, startAngle, endAngle) => {
          for (let angle = startAngle; angle <= endAngle; angle += Math.PI/180) {
              const sr = r - 0.5;
              const px = cx + sr * Math.cos(angle);
              const py = cy + sr * Math.sin(angle);
              this.pixelRenderer.setPixel(Math.floor(px), Math.floor(py), strokeR, strokeG, strokeB, strokeA);
          }
        };

        drawCorner(pos.x + r, pos.y + r, Math.PI, Math.PI * 3/2);
        drawCorner(pos.x + pos.w - r, pos.y + r, Math.PI * 3/2, Math.PI * 2);
        drawCorner(pos.x + pos.w - r, pos.y + pos.h - r, 0, Math.PI/2);
        drawCorner(pos.x + r, pos.y + pos.h - r, Math.PI/2, Math.PI);
      } else {
        // For thicker strokes, use the same mechanism as thick transparent stroke
        this.drawRoundedRectStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
          strokeR, strokeG, strokeB, strokeA);
      }
    }
  }

  drawCrispAxisAlignedRoundedRectThickOrSemitrasparentStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, 
    strokeWidth, strokeR, strokeG, strokeB, strokeA, 
    fillR, fillG, fillB, fillA) {

    if (rectWidth % 1 !== 0 || rectHeight % 1 !== 0) {
      throw new Error('Width and height must be integers');
    }

    // Handle fill
    if (fillA > 0) {
      this.drawRoundedRectFill(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
        fillR, fillG, fillB, fillA);
    }

    // Handle stroke
    if (strokeA > 0) {
      this.drawRoundedRectStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
        strokeR, strokeG, strokeB, strokeA);
    }
  }

  // Helper method for fill
  drawRoundedRectFill(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
    fillR, fillG, fillB, fillA) {
    let pos = roundCornerOfRectangularGeometryWithWarning(
      getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight)
    );
    let r = Math.round(Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2));

    function isInsideRoundedRect(px, py) {
      // Test if point is inside main rectangle
      if (px >= pos.x + r && px < pos.x + pos.w - r && 
          py >= pos.y && py < pos.y + pos.h) {
        return true;
      }
      if (px >= pos.x && px < pos.x + pos.w && 
          py >= pos.y + r && py < pos.y + pos.h - r) {
        return true;
      }

      // Test if point is inside rounded corners
      const corners = [
        { x: pos.x + r, y: pos.y + r },
        { x: pos.x + pos.w - r, y: pos.y + r },
        { x: pos.x + pos.w - r, y: pos.y + pos.h - r },
        { x: pos.x + r, y: pos.y + pos.h - r }
      ];
      
      for (const corner of corners) {
        const dx = px - corner.x + 1;
        const dy = py - corner.y + 1;
        if (dx * dx + dy * dy < r * r) {
          return true;
        }
      }
      
      return false;
    }

    for (let yy = Math.floor(pos.y); yy <= Math.ceil(pos.y + pos.h); yy++) {
      for (let xx = Math.floor(pos.x); xx <= Math.ceil(pos.x + pos.w); xx++) {
        if (isInsideRoundedRect(Math.ceil(xx), Math.ceil(yy))) {
          this.pixelRenderer.setPixel(xx, yy, fillR, fillG, fillB, fillA);
        }
      }
    }
  }

  // Helper method for both semi-transparent strokes and thick strokes
  // The pixels of the stroke are first collected in a set, and then drawn to the
  // screen. Not only that, but the stroke of the corners is actually kept in a set of scanlines, this is to avoid
  // internal gaps that one can see using the current algorithm. Using scanlines, the internal gaps are filled in.
  // Draws the stroke (outline) of a rounded rectangle by collecting pixels in a set first,
  // then drawing them all at once. Uses scanlines to avoid internal gaps in the stroke.
  drawRoundedRectStroke(centerX, centerY, rectWidth, rectHeight, cornerRadius, strokeWidth,
    strokeR, strokeG, strokeB, strokeA) {
    const halfStroke = strokeWidth / 2;
    let pos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
    let r = Math.round(Math.min(cornerRadius, Math.min(pos.w, pos.h) / 2));

    // Create a set to collect all stroke pixels before drawing
    const strokePixels = new PixelSet(this.pixelRenderer);
    
    // Draw horizontal strokes (top and bottom edges)
    const horizontalStrokes = new ScanlineSpans();
    // Add spans for top edge
    for (let y = pos.y - halfStroke; y < pos.y + halfStroke; y++) {
      horizontalStrokes.addSpan(y, pos.x + r, pos.x + pos.w - r);
    }
    // Add spans for bottom edge
    for (let y = pos.y + pos.h - halfStroke; y < pos.y + pos.h + halfStroke; y++) {
      horizontalStrokes.addSpan(y, pos.x + r, pos.x + pos.w - r);
    }
    horizontalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);

    // Draw vertical strokes (left and right edges)
    const leftVerticalStrokes = new ScanlineSpans();
    const rightVerticalStrokes = new ScanlineSpans();
    
    for (let y = pos.y + r; y < pos.y + pos.h - r; y++) {
      // Add pixels for left edge
      for (let x = pos.x - halfStroke; x < pos.x + halfStroke; x++) {
        leftVerticalStrokes.addPixel(x, y);
      }
      // Add pixels for right edge
      for (let x = pos.x + pos.w - halfStroke; x < pos.x + pos.w + halfStroke; x++) {
        rightVerticalStrokes.addPixel(x, y);
      }
    }
    leftVerticalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);
    rightVerticalStrokes.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);

    // Helper function to draw rounded corners using circular arcs
    const drawCornerSpans = (cx, cy, startAngle, endAngle) => {
      const cornerSpans = new ScanlineSpans();
      const angleStep = Math.PI / 180;  // 1 degree steps for smooth corners
      for (let angle = startAngle; angle <= endAngle; angle += angleStep) {
        // Add pixels along the stroke width
        for (let t = -halfStroke; t < halfStroke; t ++) {
          const sr = r + t;  // Radius adjusted for stroke width
          const px = cx + sr * Math.cos(angle);
          const py = cy + sr * Math.sin(angle);
          cornerSpans.addPixel(Math.floor(px), Math.floor(py));
        }
      }
      cornerSpans.addToPixelSet(strokePixels, strokeR, strokeG, strokeB, strokeA);
    };

    // Draw all four corners with appropriate arc angles
    drawCornerSpans(pos.x + r, pos.y + r, Math.PI, Math.PI * 3/2);           // Top-left
    drawCornerSpans(pos.x + pos.w - r, pos.y + r, Math.PI * 3/2, Math.PI * 2); // Top-right
    drawCornerSpans(pos.x + pos.w - r, pos.y + pos.h - r, 0, Math.PI/2);     // Bottom-right
    drawCornerSpans(pos.x + r, pos.y + pos.h - r, Math.PI/2, Math.PI);       // Bottom-left

    // Finally, paint all collected stroke pixels to the screen
    strokePixels.paint();
  }

  drawRotatedRoundedRect(centerX, centerY, width, height, radius, rotation,
    strokeWidth, strokeR, strokeG, strokeB, strokeA,
    fillR, fillG, fillB, fillA) {
    
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Calculate corner centers (these stay fixed)
    const cornerCenters = [
      [-halfWidth + radius, -halfHeight + radius],
      [halfWidth - radius, -halfHeight + radius],
      [halfWidth - radius, halfHeight - radius],
      [-halfWidth + radius, halfHeight - radius]
    ].map(([x, y]) => ({
      x: centerX + x * cos - y * sin,
      y: centerY + x * sin + y * cos
    }));

    // calculate edge directions
    const edges = cornerCenters.map((start, i) => {
      const end = cornerCenters[(i + 1) % 4];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      return {
        dx: dx / len,
        dy: dy / len
      };
    });

    // Calculate stroke endpoints with proper perpendicular offset
    const strokePoints = cornerCenters.map((center, i) => {
      const prevEdge = edges[(i + 3) % 4];
      const nextEdge = edges[i];
      
      // Perpendicular vectors to edges
      const prev = { x: -prevEdge.dy, y: prevEdge.dx };
      const next = { x: -nextEdge.dy, y: nextEdge.dx };
      
      return {
        start: {
          x: center.x - radius * prev.x,
          y: center.y - radius * prev.y
        },
        end: {
          x: center.x - radius * next.x,
          y: center.y - radius * next.y
        }
      };
    });

    if (fillA > 0) {
      // 1. Draw the central rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX, centerY,
        width - 2 * radius, height - 2 * radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // 2. Draw the four side rectangles
      // Top rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX + (-radius * sin),
        centerY + (-height/2 + radius/2) * cos,
        width - 2 * radius, radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // Right rectangle 
      this.swRectRenderer.fillRotatedRect(
        centerX + (width/2 - radius/2) * cos,
        centerY + (width/2 - radius/2) * sin,
        radius, height - 2 * radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // Bottom rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX + (radius * sin),
        centerY + (height/2 - radius/2) * cos,
        width - 2 * radius, radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // Left rectangle
      this.swRectRenderer.fillRotatedRect(
        centerX + (-width/2 + radius/2) * cos,
        centerY + (-width/2 + radius/2) * sin,
        radius, height - 2 * radius,
        rotation, false, false, fillR, fillG, fillB, fillA
      );

      // 3. Fill corner arcs
      const rotationDegrees = rotation * 180 / Math.PI;
      cornerCenters.forEach((center, i) => {
        const baseAngles = [
          [180, 270],
          [270, 360],
          [0, 90],
          [90, 180]
        ][i];
        
        const startAngle = (baseAngles[0] + rotationDegrees) % 360;
        const endAngle = (baseAngles[1] + rotationDegrees) % 360;
        
        drawArcSWHelper(center.x, center.y, radius,
          startAngle, endAngle,
          fillR, fillG, fillB, fillA, true);
      });
    }

    if (strokeA > 0) {
      for (let i = 0; i < 4; i++) {
        const currentPoint = strokePoints[i];
        const nextPoint = strokePoints[(i + 1) % 4];
        
        this.lineRenderer.drawLineThick(
          currentPoint.end.x, currentPoint.end.y,
          nextPoint.start.x, nextPoint.start.y,
          strokeWidth, strokeR, strokeG, strokeB, strokeA
        );
      }

      const rotationDegrees = rotation * 180 / Math.PI;
      cornerCenters.forEach((center, i) => {
        const baseAngles = [
          [180, 270],
          [270, 360],
          [0, 90],
          [90, 180]
        ][i];
        
        const startAngle = (baseAngles[0] + rotationDegrees) % 360;
        const endAngle = (baseAngles[1] + rotationDegrees) % 360;
        
        drawArcSWHelper(center.x, center.y, radius,
          startAngle, endAngle,
          strokeR, strokeG, strokeB, strokeA, false, strokeWidth);
      });
    }
  }
}