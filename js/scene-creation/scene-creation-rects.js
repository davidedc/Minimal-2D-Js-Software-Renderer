function addAxisAlignedRectangles(shapes, log, count = 5) {
  for (let i = 0; i < count; i++) {
    const center = roundPoint(getRandomPoint(1));
    const strokeWidth = Math.floor(Math.random() * 10 + 5);
    const rectWidth = Math.floor(30 + Math.random() * 100);
    const rectHeight = Math.floor(30 + Math.random() * 100);
    const adjustedCenter = adjustCenterForCrispStrokeRendering(center.x, center.y, rectWidth, rectHeight, strokeWidth);
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'rect',
      center: adjustedCenter,
      width: rectWidth,
      height: rectHeight,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A1; Axis-aligned rect at (${adjustedCenter.x}, ${adjustedCenter.y}) width: ${rectWidth} height: ${rectHeight} strokeWidth: ${strokeWidth} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}<br>`;
  }
}

function addRotatedRectangles(shapes, log, count = 5) {
  for (let i = 0; i < count; i++) {
    const center = getRandomPoint(1);
    const width = 30 + Math.random() * 100;
    const height = 30 + Math.random() * 100;
    const rotation = Math.random() * Math.PI * 2;
    const strokeWidth = Math.random() * 10 + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'rect',
      center,
      width,
      height,
      rotation,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A1; Rotated rect at (${center.x}, ${center.y}) width: ${width.toFixed(1)} height: ${height.toFixed(1)} rotation: ${(rotation * 180 / Math.PI).toFixed(1)}&deg; strokeWidth: ${strokeWidth.toFixed(1)} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}<br>`;
  }
}

function add1PxStrokeCenteredRectAtGrid(shapes, log) {
  checkCanvasHasEvenDimensions();

  const { centerX, centerY } = placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);

  let rectWidth = Math.floor(20 + Math.random() * 130);
  let rectHeight = Math.floor(20 + Math.random() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, {x:centerX, y:centerY});

  return add1PxStrokeCenteredRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRectAtPixel(shapes, log) {
  checkCanvasHasEvenDimensions();

  const { centerX, centerY } = placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);

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
  
  log.innerHTML += `&#x25A1; 1px stroke centered rect at (${centerX}, ${centerY}) width: ${rectWidth} height: ${rectHeight}<br>`;
  
  return { leftX, rightX, topY, bottomY };
}
