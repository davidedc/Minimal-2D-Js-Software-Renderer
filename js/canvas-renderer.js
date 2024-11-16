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
