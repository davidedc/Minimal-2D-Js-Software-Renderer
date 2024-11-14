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


function getRandomCircle() {
  return {
      ...getRandomArc(),
      type: 'circle',
      startAngle: 0,
      endAngle: 360
  };
}


function getRandomPoint() {
  const margin = 100;
  return {
    x: margin + Math.random() * (width - 2 * margin),
    y: margin + Math.random() * (height - 2 * margin)
  };
}


function getRandomArc() {
  const center = getRandomPoint();
  const radius = 15 + Math.random() * 50;
  const startAngle = Math.random() * 360;
  const endAngle = startAngle + Math.random() * 270 + 90; // At least 90 degrees
  const strokeWidth = Math.random() * 10 + 1;
  const strokeColor = getRandomColor(200, 255);
  const fillColor = getRandomColor(100, 200);
  
  return {
      type: 'arc',
      center,
      radius,
      startAngle,
      endAngle,
      strokeWidth,
      strokeColor,
      fillColor
  };
}

function alignToPixelBoundary(point) {
  return {
    x: Math.round(point.x) + 0.5,
    y: Math.round(point.y) + 0.5
  };
}


function toIntegerPoint(point) {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}

function roundPoint(x, y) {
  return {
    x: Math.round(x),
    y: Math.round(y)
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

// Update the main drawing functions to use these specialized versions
function drawRectCanvas(ctx, shape) {
  if (shape.rotation === 0) {
    // Use specialized axis-aligned version
    drawAxisAlignedRectCanvas(ctx, shape);
  } else {
    // Use original rotated rectangle code
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
  // Convert angles to radians
  const startRad = (startAngle % 360) * Math.PI / 180;
  const endRad = (endAngle % 360) * Math.PI / 180;
  
  // Draw the filled portion first
  if (fillColor.a > 0) {
      ctx.beginPath();
      // Start from the center
      ctx.moveTo(center.x, center.y);
      // Draw line to start of arc
      ctx.lineTo(
          center.x + radius * Math.cos(startRad),
          center.y + radius * Math.sin(startRad)
      );
      // Draw the arc
      ctx.arc(center.x, center.y, radius, startRad, endRad);
      // Draw line back to center
      ctx.lineTo(center.x, center.y);
      
      // Fill without stroke
      ctx.fillStyle = `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, ${fillColor.a / 255})`;
      ctx.fill();
  }
  
  // Draw the stroke separately
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
