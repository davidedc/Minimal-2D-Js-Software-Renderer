function addAxisAlignedRoundedRectangles(shapes, log, count = 10) {
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + Math.random() * 100);
    const height = Math.round(50 + Math.random() * 100);
    shapes.push({
      type: 'roundedRect',
      center: roundPoint(getRandomPoint()),
      width,
      height,
      radius: Math.round(Math.random() * Math.min(width, height) * 0.2),
      rotation: 0,
      strokeWidth: Math.round(Math.random() * 10 + 1),
      strokeColor: getRandomColor(200, 255),
      fillColor: getRandomColor(100, 200)
    });
  }
}

function addThinStrokeRoundedRectangles(shapes, log, count = 10) {
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + Math.random() * 100);
    const height = Math.round(50 + Math.random() * 100);
    shapes.push({
      type: 'roundedRect',
      center: roundPoint(getRandomPoint()),
      width,
      height,
      radius: Math.round(Math.random() * Math.min(width, height) * 0.2),
      rotation: 0,
      strokeWidth: 1,
      strokeColor: getRandomColor(200, 255),
      fillColor: getRandomColor(100, 200)
    });
  }
}

function addLargeTransparentRoundedRectangles(shapes, log, count = 10) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'roundedRect',
      center: roundPoint(getRandomPoint()),
      width: 200,
      height: 200,
      radius: 40,
      rotation: 0,
      strokeWidth: Math.round(10 + Math.random() * 30),
      strokeColor: { r: 0, g: 0, b: 0, a: 50 },
      fillColor: getRandomColor(100, 200)
    });
  }
}

function addNoStrokeRoundedRectangles(shapes, log, count = 10) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'roundedRect',
      center: roundPoint(getRandomPoint()),
      width: 200,
      height: 200,
      radius: 40,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: { r: 0, g: 0, b: 0, a: 0 },
      fillColor: getRandomColor(100, 200)
    });
  }
}

function addRotatedRoundedRectangles(shapes, log, count = 3) {
  for (let i = 0; i < count; i++) {
    const width = 50 + Math.random() * 100;
    const height = 50 + Math.random() * 100;
    shapes.push({
      type: 'roundedRect',
      center: getRandomPoint(),
      width,
      height,
      radius: Math.min(width, height) * 0.2,
      rotation: Math.random() * Math.PI * 2,
      strokeWidth: Math.random() * 10 + 1,
      strokeColor: getRandomColor(200, 255),
      fillColor: getRandomColor(100, 200)
    });
  }
}

function addCenteredRoundedRect(shapes, log) {
  const maxWidth = renderComparisonWidth * 0.6;
  const maxHeight = renderComparisonHeight * 0.6;
  
  const rectWidth = Math.round(50 + Math.random() * maxWidth);
  const rectHeight = Math.round(50 + Math.random() * maxHeight);
  
  shapes.push({
    type: 'roundedRect',
    center: { x: renderComparisonWidth/2, y: renderComparisonHeight/2 },
    width: rectWidth,
    height: rectHeight,
    radius: Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: Math.round(Math.random() * 10 + 1),
    strokeColor: getRandomColor(255, 255, 0, 2),
    fillColor: getRandomColor(100, 200, 1, 2)
  });
}

function add1PxStrokeCenteredRoundedRectAtGrid(shapes, log) {
  checkCanvasHasEvenDimensions();

  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);
  const centerX = Math.floor(renderComparisonWidth / 2);
  const centerY = Math.floor(renderComparisonHeight / 2);
  
  return add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log);
}

function add1PxStrokeCenteredRoundedRectAtPixel(shapes, log) {
  checkCanvasHasEvenDimensions();

  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);
  const centerX = Math.floor(renderComparisonWidth / 2) + 0.5;
  const centerY = Math.floor(renderComparisonHeight / 2) + 0.5;
  
  return add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log);
}

function add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth - 1;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight - 1;
  
  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    radius: Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }
  });
  
  return { leftX, rightX, topY, bottomY };
}
