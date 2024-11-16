function drawLineCanvas(ctx, shape) {
  const { start, end, thickness, color } = shape;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = thickness;
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
  ctx.stroke();
}

function drawRectCanvas(ctx, shape) {
  if (shape.rotation === 0) {
    drawAxisAlignedRectCanvas(ctx, shape);
  } else {
    ctx.save();
    ctx.translate(shape.center.x, shape.center.y);
    ctx.rotate(shape.rotation);
    if (shape.fillColor.a > 0) {
      ctx.fillStyle = `rgba(${shape.fillColor.r}, ${shape.fillColor.g}, ${shape.fillColor.b}, ${shape.fillColor.a / 255})`;
      ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
    }
    if (shape.strokeColor.a > 0 && shape.strokeWidth > 0) {
      ctx.lineWidth = shape.strokeWidth;
      ctx.strokeStyle = `rgba(${shape.strokeColor.r}, ${shape.strokeColor.g}, ${shape.strokeColor.b}, ${shape.strokeColor.a / 255})`;
      ctx.strokeRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
    }
    ctx.restore();
  }
}

function drawArcCanvas(ctx, shape) {
  const { center, radius, startAngle, endAngle, strokeWidth, strokeColor, fillColor } = shape;
  const startRad = (startAngle % 360) * Math.PI / 180;
  const endRad = (endAngle % 360) * Math.PI / 180;
  
  if (fillColor.a > 0) {
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(center.x + radius * Math.cos(startRad), center.y + radius * Math.sin(startRad));
    ctx.arc(center.x, center.y, radius, startRad, endRad);
    ctx.lineTo(center.x, center.y);
    ctx.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillColor.a / 255})`;
    ctx.fill();
  }
  
  if (strokeColor.a > 0 && strokeWidth > 0) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startRad, endRad);
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
    ctx.stroke();
  }
}

function drawCircleCanvas(ctx, shape) {
  const { center, radius, strokeWidth, strokeColor, fillColor } = shape;
  
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  
  if (fillColor.a > 0) {
    ctx.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillColor.a / 255})`;
    ctx.fill();
  }
  
  if (strokeColor.a > 0 && strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
    ctx.stroke();
  }
}

function drawAxisAlignedRectCanvas(ctx, shape) {
  const { center, width, height, strokeWidth, strokeColor, fillColor } = shape;
  
  const centerX = Math.round(center.x);
  const centerY = Math.round(center.y);
  const roundedWidth = Math.round(width);
  const roundedHeight = Math.round(height);
  const roundedStrokeWidth = Math.round(strokeWidth);

  const halfWidth = Math.floor(roundedWidth / 2);
  const halfHeight = Math.floor(roundedHeight / 2);
  
  const pathLeft = centerX - halfWidth;
  const pathTop = centerY - halfHeight;

  if (fillColor.a > 0) {
    ctx.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillColor.a / 255})`;
    const inset = Math.ceil(roundedStrokeWidth / 2) - 1;
    ctx.fillRect(
      pathLeft + inset + 1,
      pathTop + inset + 1,
      roundedWidth - 2 * (inset + 1),
      roundedHeight - 2 * (inset + 1)
    );
  }

  if (strokeColor.a > 0 && roundedStrokeWidth > 0) {
    ctx.lineWidth = roundedStrokeWidth;
    ctx.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
    
    const strokeOffset = roundedStrokeWidth % 2 === 0 ? 0 : 0.5;
    ctx.strokeRect(
      pathLeft + strokeOffset,
      pathTop + strokeOffset,
      roundedWidth - 2 * strokeOffset,
      roundedHeight - 2 * strokeOffset
    );
  }
}
