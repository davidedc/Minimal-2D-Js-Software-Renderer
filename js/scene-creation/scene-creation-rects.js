function addAxisAlignedRectangles(shapes, log, count = 5) {

  for (let i = 0; i < count; i++) {
    const center = roundPoint(getRandomPoint());
    const strokeWidth = Math.floor(Math.random() * 10 + 5);
  
    const rectWidth = Math.floor(30 + Math.random() * 100);
    const rectHeight = Math.floor(30 + Math.random() * 100);

    // We pick a size and a stroke width, and then we adjust the center
    // of the rect so that the fill and stroke are both crisp.
    // That's all well and good, but note that in this way we can't always center the stroke
    // around the fill: in case the stroke is larger by an odd number of pixels, that is.

    const adjustedCenter = adjustCenterForCrispStrokeRendering(center.x, center.y, rectWidth, rectHeight, strokeWidth);

    shapes.push({
      type: 'rect',
      center: adjustedCenter,
      width: rectWidth,
      height: rectHeight,
      rotation: 0,
      strokeWidth: strokeWidth,
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

  const centerX = Math.floor(renderComparisonWidth / 2);
  const centerY = Math.floor(renderComparisonHeight / 2);

  let rectWidth = Math.floor(20 + Math.random() * 130);
  let rectHeight = Math.floor(20 + Math.random() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, {x:centerX, y:centerY});

  return add1PxStrokeCenteredRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRectAtPixel(shapes, log) {
  checkCanvasHasEvenDimensions();

  let centerX = Math.floor(renderComparisonWidth / 2);
  let centerY = Math.floor(renderComparisonHeight / 2);

  let rectWidth = Math.floor(20 + Math.random() * 130);
  let rectHeight = Math.floor(20 + Math.random() * 130);
  
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, {x:centerX, y:centerY});

  return add1PxStrokeCenteredRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight;
  
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
