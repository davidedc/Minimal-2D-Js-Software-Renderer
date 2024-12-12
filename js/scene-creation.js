// Shape management and random generation

function addBlackLines(count, lineWidth, shapes, log) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'line',
      start: getRandomPoint(),
      end: getRandomPoint(),
      thickness: lineWidth,
      color: { r: 0, g: 0, b: 0, a: 255 }
    });
  }
}

function getRandomCircle() {
  return {
      ...getRandomArc(),
      type: 'circle',
      startAngle: 0,
      endAngle: 360
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

function addRandomLines(count = 15, shapes, log) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'line',
      start: getRandomPoint(),
      end: getRandomPoint(),
      thickness: Math.floor(Math.random() * 10) + 1,
      color: getRandomColor(150, 255)
    });
  }
}

function addAxisAlignedRectangles(count = 5, shapes, log) {
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

function addRotatedRectangles(count = 5, shapes, log) {
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

function addAxisAlignedRoundedRectangles(count = 10, shapes, log) {
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

function addThinStrokeRoundedRectangles(count = 10, shapes, log) {
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

function addLargeTransparentRoundedRectangles(count = 10, shapes, log) {
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

function addNoStrokeRoundedRectangles(count = 10, shapes, log) {
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

function addRotatedRoundedRectangles(count = 3, shapes, log) {
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

function addNinetyDegreeArcs(shapes, log) {
  const strokeSizes = [1, 2, 3, 4];
  const radii = [20, 40, 60];
  let xOffset = 150;

  for (const strokeSize of strokeSizes) {
    let yOffset = 150;
    for (const radius of radii) {
      shapes.push({
        type: 'arc',
        center: { x: xOffset, y: yOffset },
        radius: radius,
        startAngle: 0,
        endAngle: 90,
        strokeWidth: strokeSize,
        strokeColor: { r: 200, g: 100, b: 100, a: 255 },
        fillColor: { r: 0, g: 0, b: 0, a: 0 }
      });
      yOffset += radius * 2 + 20;
    }
    xOffset += 120;
  }
}

function addRandomCircles(count = 5, shapes, log) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomCircle());
  }
}

function addRandomArcs(count = 3, shapes, log) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomArc());
  }
}

function addCenteredRoundedRect(shapes, log) {
  // Leave 20% margin from canvas edges
  const maxWidth = width * 0.6;
  const maxHeight = height * 0.6;
  
  const rectWidth = Math.round(50 + Math.random() * maxWidth);
  const rectHeight = Math.round(50 + Math.random() * maxHeight);
  
  shapes.push({
    type: 'roundedRect',
    center: { x: width/2, y: height/2 },
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
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define rectangle dimensions as random integers between 20 and 150
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  // Center of the grid
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  return add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log);
}

function add1PxStrokeCenteredRoundedRectAtPixel(shapes, log) {
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define rectangle dimensions as random integers between 20 and 150
  const rectWidth = Math.floor(20 + Math.random() * 130);
  const rectHeight = Math.floor(20 + Math.random() * 130);

  // Center at pixel
  const centerX = Math.floor(width / 2) + 0.5;
  const centerY = Math.floor(height / 2) + 0.5;
  
  return add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log);
}

function add1PxStrokeCenteredRoundedRect(centerX, centerY, rectWidth, rectHeight, shapes, log) {
  // Calculate edges for testing
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

function add2PxVerticalLine(centerX, centerY, height, shapes, log) {
  // the default lineCap is butt
  // see: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap#butt
  // ...which means that the top aligns
  // exactly with the top of the path i.e. topY, and the bottom aligns
  // exactly with the bottom of the path i.e. bottomY
  // So to get a 2px line of height "height" we need to move down from the topY
  // by height to get the bottomY.
  // To understand this better, try forcing the topY to be 5
  // and the height to be 5
  // to see a simple inspectable example:
  //    const topY = 5;
  //    const height = 5;

  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height;

  let startY = topY;
  let endY = bottomY;

  // half of the times swap the start and end
  // just in case it matters (it should not)
  if (Math.random() < 0.5) {
    startY = bottomY;
    endY = topY;
  }
  
  // For a 2px line, it will occupy two columns of pixels
  const leftX = Math.floor(centerX - 1);
  const rightX = leftX + 1;
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: startY },
    end: { x: centerX, y: endY },
    thickness: 2,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  // NOTE how you expect the Y of the bottom pixel to be bottomY - 1 !
  return { leftX, rightX, topY, bottomY: bottomY - 1};
}

function add2PxVerticalLineCenteredAtGrid(shapes, log) {
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define line height as random integer between 20 and 150
  const lineHeight = Math.floor(20 + Math.random() * 130);

  // Center of the grid
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  const result = add2PxVerticalLine(centerX, centerY, lineHeight, shapes, log);
  
  if (log) {
    log.push(`2px vertical line from (${centerX}, ${result.topY}) to (${centerX}, ${result.bottomY}) of height ${lineHeight}`);
  }
  
  return result;
}

function add1PxVerticalLine(centerX, centerY, height, shapes, log) {
  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height;

  let startY = topY;
  let endY = bottomY;

  // half of the times swap the start and end
  // just in case it matters (it should not)
  if (Math.random() < 0.5) {
    startY = bottomY;
    endY = topY;
  }
  
  // For a 1px line, it will occupy one column of pixels
  const pixelX = Math.floor(centerX);
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: startY },
    end: { x: centerX, y: endY },
    thickness: 1,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  // For 1px line, leftX and rightX are the same
  return { leftX: pixelX, rightX: pixelX, topY, bottomY: bottomY - 1};
}

function add1PxVerticalLineCenteredAtPixel(shapes, log) {
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define line height as random integer between 20 and 150
  const lineHeight = Math.floor(20 + Math.random() * 130);

  // Center at pixel (add 0.5 to center on pixel)
  const centerX = Math.floor(width / 2) + 0.5;
  const centerY = Math.floor(height / 2);
  
  return add1PxVerticalLine(centerX, centerY, lineHeight, shapes, log);
}

function add1PxHorizontalLine(centerX, centerY, width, shapes, log) {
  const leftX = Math.floor(centerX - width/2);
  const rightX = leftX + width;

  let startX = leftX;
  let endX = rightX;

  // half of the times swap the start and end
  // just in case it matters (it should not)
  if (Math.random() < 0.5) {
    startX = rightX;
    endX = leftX;
  }
  
  // For a 1px line, it will occupy one row of pixels
  const pixelY = Math.floor(centerY);
  
  shapes.push({
    type: 'line',
    start: { x: startX, y: centerY },
    end: { x: endX, y: centerY },
    thickness: 1,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });

  // For 1px line, topY and bottomY are the same
  return { topY: pixelY, bottomY: pixelY, leftX, rightX: rightX - 1};
}

function add1PxHorizontalLineCenteredAtPixel(shapes, log) {
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define line width as random integer between 20 and 150
  const lineWidth = Math.floor(20 + Math.random() * 130);

  // Center at pixel (add 0.5 to center on pixel)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2) + 0.5;
  
  return add1PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
}

function add2PxHorizontalLine(centerX, centerY, width, shapes, log) {
  // For a 2px line, it will occupy two rows of pixels
  const topY = Math.floor(centerY - 1);
  const bottomY = topY + 1;

  const leftX = Math.floor(centerX - width/2);
  const rightX = leftX + width;

  let startX = leftX;
  let endX = rightX;

  // half of the times swap the start and end
  // just in case it matters (it should not)
  if (Math.random() < 0.5) {
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

  return { topY, bottomY, leftX, rightX: rightX - 1};
}

function add2PxHorizontalLineCenteredAtGrid(shapes, log) {
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define line width as random integer between 20 and 150
  const lineWidth = Math.floor(20 + Math.random() * 130);

  // Center of the grid
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  return add2PxHorizontalLine(centerX, centerY, lineWidth, shapes, log);
}

function buildScene(shapes, log) {
  addRandomLines(15, shapes, log);
  addAxisAlignedRectangles(5, shapes, log);
  addRotatedRectangles(5, shapes, log);
  addAxisAlignedRoundedRectangles(10, shapes, log);
  addLargeTransparentRoundedRectangles(10, shapes, log);
  addNoStrokeRoundedRectangles(10, shapes, log);
  // addRotatedRoundedRectangles(3, shapes, log);
  addNinetyDegreeArcs(shapes, log);
  addRandomArcs(3, shapes, log);
  addRandomCircles(5, shapes, log);
  addThinStrokeRoundedRectangles(10, shapes, log);
}