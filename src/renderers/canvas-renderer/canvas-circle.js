function drawCircleCanvas(ctx, shape) {
  const { center, radius, strokeWidth, strokeColor, fillColor } = shape;

  ctx.fillAndStrokeCircle(center.x, center.y, radius, fillColor, strokeWidth, strokeColor);
}