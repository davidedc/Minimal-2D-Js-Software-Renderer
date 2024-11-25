// Shape management and random generation
let shapes = [];

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

function addRandomLines(count = 15) {
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

function addAxisAlignedRectangles(count = 5) {
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

function addRotatedRectangles(count = 5) {
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

function addAxisAlignedRoundedRectangles(count = 10) {
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + Math.random() * 100);
    const height = Math.round(50 + Math.random() * 100);
    shapes.push({
      type: 'roundedRect',
      center: getRandomPoint(),
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

function addThinStrokeRoundedRectangles(count = 10) {
  for (let i = 0; i < count; i++) {
    const width = Math.round(50 + Math.random() * 100);
    const height = Math.round(50 + Math.random() * 100);
    shapes.push({
      type: 'roundedRect',
      center: getRandomPoint(),
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

function addLargeTransparentRoundedRectangles(count = 10) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'roundedRect',
      center: getRandomPoint(),
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

function addNoStrokeRoundedRectangles(count = 10) {
  for (let i = 0; i < count; i++) {
    shapes.push({
      type: 'roundedRect',
      center: getRandomPoint(),
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

function addRotatedRoundedRectangles(count = 3) {
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

function addNinetyDegreeArcs() {
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

function addRandomCircles(count = 5) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomCircle());
  }
}

function addRandomArcs(count = 3) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomArc());
  }
}

function buildScene() {
  shapes = [];
  
  addRandomLines();
  addAxisAlignedRectangles();
  addRotatedRectangles();
  addAxisAlignedRoundedRectangles();
  addLargeTransparentRoundedRectangles();
  addNoStrokeRoundedRectangles();
  // addRotatedRoundedRectangles();
  addNinetyDegreeArcs();
  addRandomArcs();
  addRandomCircles();
  addThinStrokeRoundedRectangles();
}