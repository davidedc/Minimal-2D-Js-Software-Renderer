function drawLineCanvas(ctx, shape) {
  const { start, end, thickness: strokeWidth, color } = shape;

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = color.toCSS();
  ctx.stroke();
}