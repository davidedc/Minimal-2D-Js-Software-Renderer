function addAxisAlignedRoundedRectangles(shapes, log, currentExampleNumber, count = 10) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + SeededRandom.getRandom() * 100);
    const height = Math.round(50 + SeededRandom.getRandom() * 100);
    const strokeWidth = Math.round(SeededRandom.getRandom() * 10 + 1);
    let center = roundPoint(getRandomPoint(1));
    const adjustedCenter = adjustCenterForCrispStrokeRendering(center.x, center.y, width, height, strokeWidth);
    const radius = Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2);
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: adjustedCenter,
      width,
      height,
      radius,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A2; Axis-aligned rounded rect at: (${adjustedCenter.x}, ${adjustedCenter.y}) width: ${width} height: ${height} radius: ${radius} strokeWidth: ${strokeWidth} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}<br>`;
  }
}

function addThinOpaqueStrokeRoundedRectangles(shapes, log, currentExampleNumber, count = 10) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + SeededRandom.getRandom() * 100);
    const height = Math.round(50 + SeededRandom.getRandom() * 100);
    
    // the starting initialisation of center is a random point at a grid crossing
    const center = roundPoint(getRandomPoint(1));

    const adjustedCenter = adjustCenterForCrispStrokeRendering(center.x, center.y, width, height, 1);

    shapes.push({
      type: 'roundedRect',
      center: adjustedCenter,
      width,
      height,
      radius: Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2),
      rotation: 0,
      strokeWidth: 1,
      strokeColor: getRandomColor(255, 255),
      fillColor: getRandomColor(100, 200)
    });

    log.innerHTML += `&#x25A2; Thin opaque stroke rounded rect at: (${adjustedCenter.x}, ${adjustedCenter.y}) width: ${width} height: ${height} radius: ${Math.round(SeededRandom.getRandom() * Math.min(width, height) * 0.2)}<br>`;
  }
}

function addLargeTransparentRoundedRectangles(shapes, log, currentExampleNumber, count = 10) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  for (let i = 0; i < count; i++) {
    // the starting initialisation of center is a random point at a grid crossing
    const center = roundPoint(getRandomPoint(1));
    const strokeWidth = Math.round(10 + SeededRandom.getRandom() * 30);

    const adjustedCenter = adjustCenterForCrispStrokeRendering(center.x, center.y, 200, 200, strokeWidth);
    const strokeColor = { r: 0, g: 0, b: 0, a: 50 };
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: adjustedCenter,
      width: 200,
      height: 200,
      radius: 40,
      rotation: 0,
      strokeWidth,
      strokeColor,
      fillColor
    });

    log.innerHTML += `&#x25A2; Large transparent rounded rect at: (${adjustedCenter.x}, ${adjustedCenter.y}) width: 200 height: 200 radius: 40 strokeWidth: ${strokeWidth} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}<br>`;
  }
}

function addNoStrokeRoundedRectangles(shapes, log, currentExampleNumber, count = 10) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  for (let i = 0; i < count; i++) {
    const center = roundPoint(getRandomPoint(1));
    shapes.push({
      type: 'roundedRect',
      center,
      width: 200,
      height: 200,
      radius: 40,
      rotation: 0,
      strokeWidth: 0,
      strokeColor: { r: 0, g: 0, b: 0, a: 0 },
      fillColor: getRandomColor(100, 200)
    });

    log.innerHTML += `&#x25A2; No-stroke rounded rect at: (${center.x}, ${center.y}) width: 200 height: 200 radius: 40<br>`;
  }
}

function addRotatedRoundedRectangles(shapes, log, currentExampleNumber, count = 3) {
  SeededRandom.seedWithInteger(currentExampleNumber);
  for (let i = 0; i < count; i++) {
    const width = 50 + SeededRandom.getRandom() * 100;
    const height = 50 + SeededRandom.getRandom() * 100;
    const center = getRandomPoint(1);
    const radius = Math.min(width, height) * 0.2;
    const rotation = SeededRandom.getRandom() * Math.PI * 2;
    const strokeWidth = SeededRandom.getRandom() * 10 + 1;

    shapes.push({
      type: 'roundedRect',
      center,
      width,
      height,
      radius,
      rotation,
      strokeWidth,
      strokeColor: getRandomColor(200, 255),
      fillColor: getRandomColor(100, 200)
    });

    log.innerHTML += `&#x25A2; Rotated rounded rect at: (${center.x}, ${center.y}) width: ${width.toFixed(1)} height: ${height.toFixed(1)} radius: ${radius.toFixed(1)} rotation: ${(rotation * 180 / Math.PI).toFixed(1)}&deg; strokeWidth: ${strokeWidth.toFixed(1)}<br>`;
  }
}

function addCenteredRoundedRectOpaqueStrokesRandomStrokeWidth(shapes, log, currentExampleNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentExampleNumber);

  const maxWidth = renderComparisonWidth * 0.6;
  const maxHeight = renderComparisonHeight * 0.6;

  const strokeWidth = Math.round(SeededRandom.getRandom() * 10 + 1);

  // center is an even number divided by 2, so it's an integer,
  // so the center is at a grid crossing.
  const center = { x: renderComparisonWidth/2, y: renderComparisonHeight/2 };

  
  let rectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
  let rectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, center);
  const radius = Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2);
  const strokeColor = getRandomColor(255, 255, 0, 2);
  const fillColor = getRandomColor(100, 200, 1, 2);
  
  shapes.push({
    type: 'roundedRect',
    center,
    width: adjustedDimensions.width,
    height: adjustedDimensions.height,
    radius,
    rotation: 0,
    strokeWidth,
    strokeColor,
    fillColor
  });

  log.innerHTML += `&#x25A2; Centered rounded rect with opaque stroke at: (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} radius: ${radius} strokeWidth: ${strokeWidth} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}`;
}

// TODO to work out exactly when the main features of the rounded rect
// are identical in the sw renderer and the canvas renderer. 
function addCenteredRoundedRectTransparentStrokesRandomStrokeWidth(shapes, log, currentExampleNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentExampleNumber);

  const maxWidth = renderComparisonWidth * 0.6;
  const maxHeight = renderComparisonHeight * 0.6;

  let strokeWidth = Math.round(SeededRandom.getRandom() * 10 + 1);

  // the only way to make both the fill and the stroke crisp with the same path
  // is if the fill path runs all around grid lines, and the stroke falls half on one side
  // of the path and the other half on the other side. I.e. the strokeWidth must be even.
  strokeWidth = strokeWidth % 2 === 0 ? strokeWidth : strokeWidth + 1;

  // center is an even number divided by 2, so it's an integer,
  // so the center is at a grid crossing.
  let center = { x: renderComparisonWidth/2, y: renderComparisonHeight/2 };

  // 50% of the times, move the center by half pixel so we also test the case where the
  // center is not at a grid crossing.
  if (SeededRandom.getRandom() < 0.5) {
    center = { x: center.x + 0.5, y: center.y + 0.5 };
  }

  // get a random starting dimension, we'll adjust it soon after
  let rectWidth = Math.round(50 + SeededRandom.getRandom() * maxWidth);
  let rectHeight = Math.round(50 + SeededRandom.getRandom() * maxHeight);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, strokeWidth, center);
  const strokeColor = getRandomColor(50, 150);
  const fillColor = getRandomColor(50, 150);
  const radius = Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2);
  
  shapes.push({
    type: 'roundedRect',
    center,
    width: adjustedDimensions.width,
    height: adjustedDimensions.height,
    radius,
    rotation: 0,
    strokeWidth,
    strokeColor,
    fillColor
  });

  log.innerHTML += `&#x25A2; Centered rounded rect with transparent stroke at: (${center.x}, ${center.y}) width: ${adjustedDimensions.width} height: ${adjustedDimensions.height} radius: ${radius} strokeWidth: ${strokeWidth} strokeColor: ${colorToString(strokeColor)} fillColor: ${colorToString(fillColor)}`;
}


function add1PxStrokeCenteredRoundedRectAtGrid(shapes, log, currentExampleNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentExampleNumber);

  const { centerX, centerY } = placeCloseToCenterAtGrid(renderComparisonWidth, renderComparisonHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);

  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, {x:centerX, y:centerY});

  return add1PxStrokeCenteredRoundedRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRoundedRectAtPixel(shapes, log, currentExampleNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentExampleNumber);

  const { centerX, centerY } = placeCloseToCenterAtPixel(renderComparisonWidth, renderComparisonHeight);

  let rectWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  let rectHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
  
  const adjustedDimensions = adjustDimensionsForCrispStrokeRendering(rectWidth, rectHeight, 1, {x:centerX, y:centerY});

  return add1PxStrokeCenteredRoundedRect(centerX, centerY, adjustedDimensions.width, adjustedDimensions.height, shapes, log);
}

function add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  const leftX = Math.floor(centerX - rectWidth/2);
  const rightX = leftX + rectWidth;
  const topY = Math.floor(centerY - rectHeight/2);
  const bottomY = topY + rectHeight;
  
  shapes.push({
    type: 'roundedRect',
    center: { x: centerX, y: centerY },
    width: rectWidth,
    height: rectHeight,
    radius: Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2),
    rotation: 0,
    strokeWidth: 1,
    strokeColor: { r: 255, g: 0, b: 0, a: 255 },
    fillColor: { r: 0, g: 0, b: 0, a: 0 }
  });

  log.innerHTML += `&#x25A2; 1px stroke centered rounded rect at: (${centerX}, ${centerY}) width: ${rectWidth} height: ${rectHeight} radius: ${Math.round(SeededRandom.getRandom() * Math.min(rectWidth, rectHeight) * 0.2)}`;
  
  return { leftX, rightX, topY, bottomY };
}
