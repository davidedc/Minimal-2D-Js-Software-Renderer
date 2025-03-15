function addBlackLines(shapes, log, currentIterationNumber, lineWidth, count) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const start = getRandomPoint(1);
    const end = getRandomPoint(1);
    shapes.push({
      type: 'line',
      start,
      end,
      thickness: lineWidth,
      color: { r: 0, g: 0, b: 0, a: 255 }
    });
    log.innerHTML += `&#x2500; Black line from (${start.x}, ${start.y}) to (${end.x}, ${end.y}) thickness: ${lineWidth}<br>`;
  }
}

function addRandomLines(shapes, log, currentIterationNumber, count = 15) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const start = getRandomPoint(1);
    const end = getRandomPoint(1);
    const thickness = Math.floor(SeededRandom.getRandom() * 10) + 1;
    const color = getRandomColor(150, 255);
    shapes.push({
      type: 'line',
      start,
      end,
      thickness,
      color
    });
    log.innerHTML += `&#x2500; Random line from (${start.x}, ${start.y}) to (${end.x}, ${end.y}) thickness: ${thickness} color: ${colorToString(color)}<br>`;
  }
}

function add2PxVerticalLine(centerX, centerY, height, shapes, log) {
  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height;

  let startY = topY;
  let endY = bottomY;

  if (SeededRandom.getRandom() < 0.5) {
    startY = bottomY;
    endY = topY;
  }
  
  const leftX = Math.floor(centerX - 1);
  const rightX = leftX + 1;
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: startY },
    end: { x: centerX, y: endY },
    thickness: 2,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  log.innerHTML += `&#x2500; 2px vertical line from (${centerX}, ${startY}) to (${centerX}, ${endY}) height: ${height}<br>`;

  return { leftX, rightX, topY, bottomY: bottomY - 1};
}

function add2PxVerticalLineCenteredAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);
  
  const result = add2PxVerticalLine(centerX, centerY, lineHeight, shapes, log);
  
  log.innerHTML += (`2px vertical line from (${centerX}, ${result.topY}) to (${centerX}, ${result.bottomY}) of height ${lineHeight}`);
  
  return result;
}

function add1PxVerticalLine(centerX, centerY, height, shapes, log) {
  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height;

  let startY = topY;
  let endY = bottomY;

  if (SeededRandom.getRandom() < 0.5) {
    startY = bottomY;
    endY = topY;
  }
  
  const pixelX = Math.floor(centerX);
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: startY },
    end: { x: centerX, y: endY },
    thickness: 1,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  log.innerHTML += `&#x2500; 1px vertical line from (${centerX}, ${startY}) to (${centerX}, ${endY}) height: ${height}<br>`;

  return { leftX: pixelX, rightX: pixelX, topY, bottomY: bottomY - 1};
}

function add1PxVerticalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineHeight = Math.floor(20 + SeededRandom.getRandom() * 130);
  const centerX = Math.floor(renderTestWidth / 2) + 0.5;
  const centerY = Math.floor(renderTestHeight / 2);
  
  return add1PxVerticalLine(centerX, centerY, lineHeight, shapes, log);
}

function add1PxHorizontalLine(centerX, centerY, width, shapes, log) {
  const leftX = Math.floor(centerX - width/2);
  const rightX = leftX + width;

  let startX = leftX;
  let endX = rightX;

  if (SeededRandom.getRandom() < 0.5) {
    startX = rightX;
    endX = leftX;
  }
  
  const pixelY = Math.floor(centerY);
  
  shapes.push({
    type: 'line',
    start: { x: startX, y: centerY },
    end: { x: endX, y: centerY },
    thickness: 1,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  log.innerHTML += `&#x2500; 1px horizontal line from (${startX}, ${centerY}) to (${endX}, ${centerY}) width: ${width}<br>`;

  return { topY: pixelY, bottomY: pixelY, leftX, rightX: rightX - 1};
}

function add1PxHorizontalLineCenteredAtPixel(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  const centerX = Math.floor(renderTestWidth / 2);
  const centerY = Math.floor(renderTestHeight / 2) + 0.5;
  
  return add1PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
}

function add2PxHorizontalLine(centerX, centerY, width, shapes, log) {
  const topY = Math.floor(centerY - 1);
  const bottomY = topY + 1;

  const leftX = Math.floor(centerX - width/2);
  const rightX = leftX + width;

  let startX = leftX;
  let endX = rightX;

  if (SeededRandom.getRandom() < 0.5) {
    startX = rightX;
    endX = leftX;
  }
  
  shapes.push({
    type: 'line',
    start: { x: startX, y: centerY },
    end: { x: endX, y: centerY },
    thickness: 2,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  log.innerHTML += `&#x2500; 2px horizontal line from (${startX}, ${centerY}) to (${endX}, ${centerY}) width: ${width}<br>`;

  return { topY, bottomY, leftX, rightX: rightX - 1};
}

function add2PxHorizontalLineCenteredAtGrid(shapes, log, currentIterationNumber) {
  checkCanvasHasEvenDimensions();
  SeededRandom.seedWithInteger(currentIterationNumber);
  const lineWidth = Math.floor(20 + SeededRandom.getRandom() * 130);
  const { centerX, centerY } = placeCloseToCenterAtGrid(renderTestWidth, renderTestHeight);
  
  return add2PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
}
