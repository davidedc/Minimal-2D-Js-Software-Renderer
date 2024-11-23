function drawLineCanvas(ctx, x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
    ctx.stroke();
}

function drawRectCanvas(ctx, shape) {
    const {
        center, width, height, rotation,
        strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
        fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    if (rotation === 0) {
        drawAxisAlignedRectCanvas(ctx, center.x, center.y, width, height,
            strokeWidth, strokeR, strokeG, strokeB, strokeA,
            fillR, fillG, fillB, fillA);
    } else {
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(rotation);
        if (fillA > 0) {
            ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA / 255})`;
            ctx.fillRect(-width / 2, -height / 2, width, height);
        }
        if (strokeA > 0 && strokeWidth > 0) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
            ctx.strokeRect(-width / 2, -height / 2, width, height);
        }
        ctx.restore();
    }
}

function drawArcCanvas(ctx, shape) {
    const {
        center, radius, startAngle, endAngle,
        strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
        fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    const startRad = (startAngle % 360) * Math.PI / 180;
    const endRad = (endAngle % 360) * Math.PI / 180;
    
    if (fillA > 0) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + radius * Math.cos(startRad), center.y + radius * Math.sin(startRad));
        ctx.arc(center.x, center.y, radius, startRad, endRad);
        ctx.lineTo(center.x, center.y);
        ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA / 255})`;
        ctx.fill();
    }
    
    if (strokeA > 0 && strokeWidth > 0) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startRad, endRad);
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
        ctx.stroke();
    }
}

function drawCircleCanvas(ctx, shape) {
    const {
        center, radius,
        strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
        fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    if (fillA > 0) {
        ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA / 255})`;
        ctx.fill();
    }
    if (strokeA > 0 && strokeWidth > 0) {
        ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}

function drawAxisAlignedRectCanvas(ctx, centerX, centerY, width, height,
    strokeWidth, strokeR, strokeG, strokeB, strokeA,
    fillR, fillG, fillB, fillA) {

    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);

    const roundedCenterX = Math.round(centerX);
    const roundedCenterY = Math.round(centerY);

    const roundedStrokeWidth = Math.round(strokeWidth);

    const halfWidth = Math.floor(roundedWidth / 2);
    const halfHeight = Math.floor(roundedHeight / 2);
    
    const pathLeft = roundedCenterX - halfWidth;
    const pathTop = roundedCenterY - halfHeight;

    if (fillA > 0) {
        ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA / 255})`;
        const inset = Math.ceil(roundedStrokeWidth / 2) - 1;
        ctx.fillRect(
            pathLeft + inset + 1,
            pathTop + inset + 1,
            roundedWidth - 2 * (inset + 1),
            roundedHeight - 2 * (inset + 1)
        );
    }

    if (strokeA > 0 && roundedStrokeWidth > 0) {
        ctx.lineWidth = roundedStrokeWidth;
        ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
        
        const strokeOffset = roundedStrokeWidth % 2 === 0 ? 0 : 0.5;
        ctx.strokeRect(
            pathLeft + strokeOffset,
            pathTop + strokeOffset,
            roundedWidth - 2 * strokeOffset,
            roundedHeight - 2 * strokeOffset
        );
    }
}

function drawRoundedRectCanvas(ctx, shape) {
    const {
        center, width, height, radius, rotation,
        strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
        fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    if (rotation === 0) {
        drawAxisAlignedRoundedRectCanvas(ctx, shape);
    } else {
        ctx.save();
        ctx.translate(center.x, center.y);
        ctx.rotate(rotation);

        ctx.beginPath();
        roundedRectPath(ctx, -width/2, -height/2, width, height, radius);

        if (fillA > 0) {
            ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA / 255})`;
            ctx.fill();
        }
        if (strokeA > 0 && strokeWidth > 0) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Note that this code draws the rounded rect in such a way that
// the stroke path always begins and ends at the half-pixel boundary
// so that the stroke is drawn crisply.
// That depends on what both width/height and strokeWidth are!

function drawAxisAlignedRoundedRectCanvas(ctx, shape) {
    const {
      center,
      width,
      height,
      radius,
      strokeWidth,
      strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;
  
    // Calculate the half stroke width to align to pixel boundaries
    const halfStroke = strokeWidth / 2;
    
    // Calculate the actual drawing coordinates
    // We add 0.5 to align with pixel boundaries when the total is odd
    const x = Math.floor(center.x - width / 2) + (strokeWidth % 2 ? 0.5 : 0);
    const y = Math.floor(center.y - height / 2) + (strokeWidth % 2 ? 0.5 : 0);
    const w = Math.floor(width);
    const h = Math.floor(height);
    
    // Ensure radius doesn't exceed half of the smaller dimension
    const r = Math.min(radius, Math.min(w, h) / 2);
  
    ctx.beginPath();
    
    // Start from top-left corner, after the radius
    ctx.moveTo(x + r, y);
    
    // Top edge and top-right corner
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    
    // Right edge and bottom-right corner
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    
    // Bottom edge and bottom-left corner
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    
    // Left edge and top-left corner
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    
    // Close the path
    ctx.closePath();
  
    // Fill if alpha > 0
    if (fillA > 0) {
      ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA/255})`;
      ctx.fill();
    }
  
    // Stroke if alpha > 0
    if (strokeWidth > 0 && strokeA > 0) {
      ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA/255})`;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }