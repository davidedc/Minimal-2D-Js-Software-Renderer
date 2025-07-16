function addAxisAlignedRectangles(shapes, log, currentIterationNumber, count = 5) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    var { center, adjustedDimensions, strokeWidth } = placeRoundedRectWithFillAndStrokeBothCrisp(10);
    
    const xOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
    const yOffset = Math.floor(SeededRandom.getRandom() * 100) - 50;
    
    center = {
      x: center.x + xOffset,
      y: center.y + yOffset
    };
    
    const strokeColor = getRandomColor("mixed");
    const fillColor = getRandomColor("semitransparent");

    shapes.push({
      type: 'rect',
      center: center,
      width: adjustedDimensions.width,
      height: adjustedDimensions.height,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A1; Axis-aligned rect at (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} strokeWidth: ${strokeWidth} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}<br>`;
  }
}

function addRotatedRectangles(shapes, log, currentIterationNumber, count = 5) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const center = getRandomPoint(1);
    const width = 30 + SeededRandom.getRandom() * 100;
    const height = 30 + SeededRandom.getRandom() * 100;
    const rotation = SeededRandom.getRandom() * Math.PI * 2;
    const strokeWidth = SeededRandom.getRandom() * 10 + 1;
    const strokeColor = getRandomColor("mixed");
    const fillColor = getRandomColor("semitransparent");

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

function add1PxStrokeCenteredRectAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, {x:centerX, y:centerY});

  return add1PxStrokeCenteredRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRectAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
  
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
