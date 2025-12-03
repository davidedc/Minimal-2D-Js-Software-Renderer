// Maps pretty directly to fillRect and strokeRect, which is important because
// we want the sw renderer routines to behave like the HTML5 Canvas routines
// as much as possible.
function drawAxisAlignedRectCanvas(ctx, centerX, centerY, width, height,
  strokeWidth, strokeColor, fillColor) {

  // Get fill geometry
  let pos = getRectangularFillGeometry(centerX, centerY, width, height);

  // Draw fill first (if needed)
  if (fillColor.a > 0) {
    ctx.fillStyle = fillColor.toCSS();
    ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
  }

  // Get stroke geometry
  pos = getRectangularStrokeGeometry(centerX, centerY, width, height);

  // Draw stroke (if needed)
  if (strokeColor.a > 0 && strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor.toCSS();
    ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
  }
}

function drawRectCanvas(ctx, shape) {
  const { center, width, height, rotation, strokeWidth, strokeColor, fillColor } = shape;

  if (isNearMultipleOf90Degrees(rotation)) {
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(width, height, rotation);
      drawAxisAlignedRectCanvas(ctx, center.x, center.y, adjustedWidth, adjustedHeight,
          strokeWidth, strokeColor, fillColor);
  } else {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(rotation);
      if (fillColor.a > 0) {
          ctx.fillStyle = fillColor.toCSS();
          ctx.fillRect(-width / 2, -height / 2, width, height);
      }
      if (strokeColor.a > 0 && strokeWidth > 0) {
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = strokeColor.toCSS();
          ctx.strokeRect(-width / 2, -height / 2, width, height);
      }
      ctx.restore();
  }
}