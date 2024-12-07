// Shape management and random generation

function addBlackLines(count = 20, shapes, strokeWidth) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'line',
      start: getRandomPoint(),
      end: getRandomPoint(),
      thickness: strokeWidth,
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

function addRandomLines(count = 15, shapes) {
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

function addAxisAlignedRectangles(count = 5, shapes) {
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

function addRotatedRectangles(count = 5, shapes) {
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

function addAxisAlignedRoundedRectangles(count = 10, shapes) {
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

function addThinStrokeRoundedRectangles(count = 10, shapes) {
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

function addLargeTransparentRoundedRectangles(count = 10, shapes) {
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

function addNoStrokeRoundedRectangles(count = 10, shapes) {
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

function addRotatedRoundedRectangles(count = 3, shapes) {
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

function addNinetyDegreeArcs(shapes) {
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

function addRandomCircles(count = 5, shapes) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomCircle());
  }
}

function addRandomArcs(count = 3, shapes) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomArc());
  }
}

function addCenteredRoundedRect(shapes) {
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

function add1PxStrokeCenteredRoundedRectAtGrid(shapes) {
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
  
  return add1PxStrokeCenteredRoundedRect(shapes, centerX, centerY, rectWidth, rectHeight);
}

function add1PxStrokeCenteredRoundedRectAtPixel(shapes) {
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
  
  return add1PxStrokeCenteredRoundedRect(shapes, centerX, centerY, rectWidth, rectHeight);
}

function add1PxStrokeCenteredRoundedRect(shapes, centerX, centerY, rectWidth, rectHeight) {
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

function add2PxVerticalLine(shapes, centerX, centerY, height) {
  // Calculate edges for testing
  const topY = Math.floor(centerY - height/2);
  const bottomY = topY + height - 1;
  
  shapes.push({
    type: 'line',
    start: { x: centerX, y: topY },
    end: { x: centerX, y: bottomY },
    thickness: 2,
    color: { r: 255, g: 0, b: 0, a: 255 }
  });
  
  return { centerX, topY, bottomY };
}

function add2PxVerticalLineCenteredAtGrid(shapes) {
  // if width and height of the canvas are not even, do a console error that they should be
  if (width % 2 !== 0 || height % 2 !== 0) {
    console.error('Width and height should be even numbers for this test');
  }

  // Define line height as random integer between 20 and 150
  const lineHeight = Math.floor(20 + Math.random() * 130);

  // Center of the grid
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  
  return add2PxVerticalLine(shapes, centerX, centerY, lineHeight);
}

function buildScene(shapes) {
  addRandomLines(15, shapes);
  addAxisAlignedRectangles(5, shapes);
  addRotatedRectangles(5, shapes);
  addAxisAlignedRoundedRectangles(10, shapes);
  addLargeTransparentRoundedRectangles(10, shapes);
  addNoStrokeRoundedRectangles(10, shapes);
  // addRotatedRoundedRectangles(3, shapes);
  addNinetyDegreeArcs(shapes);
  addRandomArcs(3, shapes);
  addRandomCircles(5, shapes);
  addThinStrokeRoundedRectangles(10, shapes);
}