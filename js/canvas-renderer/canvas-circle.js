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