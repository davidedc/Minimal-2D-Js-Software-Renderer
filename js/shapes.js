// Shape management and random generation
let shapes = [];

function getRandomColor(minAlpha = 100, maxAlpha = 255) {
  return {
    r: Math.random() * 255,
    g: Math.random() * 255,
    b: Math.random() * 255,
    a: Math.random() * (maxAlpha - minAlpha) + minAlpha
  };
}

function getRandomPoint() {
  const margin = 100;
  return {
    x: margin + Math.random() * (width - 2 * margin),
    y: margin + Math.random() * (height - 2 * margin)
  };
}

function toIntegerPoint(point) {
  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y)
  };
}

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
  let { center, width, height, rotation, strokeWidth, strokeColor, fillColor } = shape;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(rotation);

  if (fillColor.a > 0) {
    ctx.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillColor.a / 255})`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }

  if (strokeColor.a > 0 && strokeWidth > 0) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, ${strokeColor.a / 255})`;
    ctx.strokeRect(-width / 2, -height / 2, width, height);
  }

  ctx.restore();
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
