function drawLineCanvas(ctx, x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
  ctx.stroke();
}