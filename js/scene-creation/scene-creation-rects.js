function addAxisAlignedRectangles(shapes, log, count = 5) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'rect',
      center: getRandomPoint(),
      width: 30 + Math.random() * 100,
      height: 30 + Math.random() * 100,
      rotation: 0,
      strokeWidth: Math.random() * 10 + 1,
      strokeColor: getRandomColor(200, 255),
      fillColor: getRandomColor(100, 200)
    });
  }
}

function addRotatedRectangles(shapes, log, count = 5) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'rect',
      center: getRandomPoint(),
      width: 30 + Math.random() * 100,
      height: 30 + Math.random() * 100,
      rotation: Math.random() * Math.PI * 2,
      strokeWidth: Math.random() * 10 + 1,
      strokeColor: getRandomColor(200, 255),
      fillColor: getRandomColor(100, 200)
    });
  }
}

function add1PxStrokeCenteredRectAtGrid(shapes, log) {
  checkCanvasHasEvenDimensions();

  // TODO rectHeight and rectWidth should only
  // be odd numbers in order to have a 1-px stroke to be crisp
  // when the center is at the grid.
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  const centerX = Math.floor(renderComparisonWidth / 2);
  const centerY = Math.floor(renderComparisonHeight / 2);
  
  return add1PxStrokeCenteredRect(centerX, centerY, rectWidth, rectHeight, shapes, log);
}

function add1PxStrokeCenteredRectAtPixel(shapes, log) {
  checkCanvasHasEvenDimensions();

  // TODO rectHeight and rectWidth should only
  // be even numbers in order to have a 1-px stroke to be crisp
  // when the center is at a pixel.
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);
  
  const centerX = Math.floor(renderComparisonWidth / 2) + 0.5;
  const centerY = Math.floor(renderComparisonHeight / 2) + 0.5;
  
  return add1PxStrokeCenteredRect(centerX, centerY, rectWidth, rectHeight, shapes, log);
}

function add1PxStrokeCenteredRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth - 1;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight - 1;
  
  shapes.push({
    type: 'rect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }
  });
  
  return { leftX, rightX, topY, bottomY };
}
