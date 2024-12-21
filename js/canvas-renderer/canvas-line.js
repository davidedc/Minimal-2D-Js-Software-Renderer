function drawLineCanvas(ctx, shape) {
  const {
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: strokeWidth,
    color: { r: strokeR, g: strokeG, b: strokeB, a: strokeA }
  } = shape;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
  ctx.stroke();
}