// Maps pretty directly to fillRect and strokeRect, which is important because
// we want the sw renderer routines to behave like the HTML5 Canvas routines
// as much as possible.
function drawAxisAlignedRectCanvas(ctx, centerX, centerY, width, height,
  strokeWidth, strokeR, strokeG, strokeB, strokeA,
  fillR, fillG, fillB, fillA) {
  
  // Get fill geometry
  let pos = getRectangularFillGeometry(centerX, centerY, width, height, strokeWidth);
  
  // Draw fill first (if needed)
  if (fillA > 0) {
    ctx.fillStyle = colorToString(fillR, fillG, fillB, fillA);
    ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
  }
  
  // Get stroke geometry
  pos = getRectangularStrokeGeometry(centerX, centerY, width, height, strokeWidth);
  
  // Draw stroke (if needed)
  if (strokeA > 0 && strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = colorToString(strokeR, strokeG, strokeB, strokeA);
    ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);
  }
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
          ctx.fillStyle = colorToString(fillR, fillG, fillB, fillA);
          ctx.fillRect(-width / 2, -height / 2, width, height);
      }
      if (strokeA > 0 && strokeWidth > 0) {
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = colorToString(strokeR, strokeG, strokeB, strokeA);
          ctx.strokeRect(-width / 2, -height / 2, width, height);
      }
      ctx.restore();
  }
}