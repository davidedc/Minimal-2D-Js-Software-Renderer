function drawCircleCanvas(ctx, shape) {
  const {
      center, radius,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  ctx.fillAndStrokeCircle(center.x, center.y, radius, fillR, fillG, fillB, fillA, strokeWidth, strokeR, strokeG, strokeB, strokeA);
}