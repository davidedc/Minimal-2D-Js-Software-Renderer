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
// the stroke path and the fill always begin and end at the half-pixel boundary
// so that their borders are drawn crisply.
// That depends on what both width/height and strokeWidth are!
// Also note that this draws the fill and stroke *exactly* aligned
// with the sw renderer (not the arcs of the rounded corners, those are
// slightly different, but the borrders of the fill and stroke are the same apart
// from those arcs).

function drawAxisAlignedRoundedRectCanvas(ctx, shape) {
    const { 
        center: {x: centerX, y: centerY}, 
        width: rectWidth, 
        height: rectHeight, 
        radius, 
        strokeWidth, 
        strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
        fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    const pos = getAlignedPosition(centerX, centerY, rectWidth, rectHeight, strokeWidth);
    const r = Math.min(radius, Math.min(pos.w, pos.h) / 2);

    // Create fill path aligned strictly to whole pixels
    const createFillPath = () => {
        ctx.beginPath();
        // Round all coordinates for fill to ensure pixel-perfect alignment
        const fx = Math.ceil(pos.x);
        const fy = Math.ceil(pos.y);
        const fw = pos.w;
        const fh = pos.h;
        const fr = Math.round(r);  // Round radius too for consistency

        ctx.moveTo(fx + fr, fy);
        ctx.lineTo(fx + fw - fr, fy);
        ctx.arcTo(fx + fw, fy, fx + fw, fy + fr, fr);
        ctx.lineTo(fx + fw, fy + fh - fr);
        ctx.arcTo(fx + fw, fy + fh, fx + fw - fr, fy + fh, fr);
        ctx.lineTo(fx + fr, fy + fh);
        ctx.arcTo(fx, fy + fh, fx, fy + fh - fr, fr);
        ctx.lineTo(fx, fy + fr);
        ctx.arcTo(fx, fy, fx + fr, fy, fr);
        ctx.closePath();
    };

    // Create stroke path using original aligned positions
    const createStrokePath = () => {
        ctx.beginPath();
        ctx.moveTo(pos.x + r, pos.y);
        ctx.lineTo(pos.x + pos.w - r, pos.y);
        ctx.arcTo(pos.x + pos.w, pos.y, pos.x + pos.w, pos.y + r, r);
        ctx.lineTo(pos.x + pos.w, pos.y + pos.h - r);
        ctx.arcTo(pos.x + pos.w, pos.y + pos.h, pos.x + pos.w - r, pos.y + pos.h, r);
        ctx.lineTo(pos.x + r, pos.y + pos.h);
        ctx.arcTo(pos.x, pos.y + pos.h, pos.x, pos.y + pos.h - r, r);
        ctx.lineTo(pos.x, pos.y + r);
        ctx.arcTo(pos.x, pos.y, pos.x + r, pos.y, r);
        ctx.closePath();
    };

    // Draw fill first (if needed)
    if (fillA > 0) {
        createFillPath();
        ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA/255})`;
        ctx.fill();
    }

    // Draw stroke (if needed)
    if (strokeWidth > 0 && strokeA > 0) {
        createStrokePath();
        ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA/255})`;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}