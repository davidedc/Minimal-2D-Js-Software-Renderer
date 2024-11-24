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

function buildScene() {
  shapes = [];

  // Draw random lines
  for (let i = 0; i < 15; i++) {
    const start = getRandomPoint();
    const end = getRandomPoint();
    const thickness = Math.floor(Math.random() * 10) + 1;
    const color = getRandomColor(150, 255);

    shapes.push({
      type: 'line',
      start: start,
      end: end,
      thickness: thickness,
      color: color
    });
  }

  // Draw axis-aligned rectangles
  for (let i = 0; i < 5; i++) {
    const center = getRandomPoint();
    const rectWidth = 30 + Math.random() * 100;
    const rectHeight = 30 + Math.random() * 100;
    const strokeWidth = Math.random() * 10 + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'rect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }

  // Draw rotated rectangles
  for (let i = 0; i < 5; i++) {
    const center = getRandomPoint();
    const rectWidth = 30 + Math.random() * 100;
    const rectHeight = 30 + Math.random() * 100;
    const rotation = Math.random() * Math.PI * 2;
    const strokeWidth = Math.random() * 10 + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'rect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      rotation: rotation,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }

  // Draw axis-aligned rounded rectangles
  for (let i = 0; i < 10; i++) {
    const center = getRandomPoint();
    const rectWidth = Math.round(50 + Math.random() * 100);
    const rectHeight = Math.round(50 + Math.random() * 100);
    const radius = Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2);
    const strokeWidth = Math.round(Math.random() * 10 + 1);
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      radius: radius,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }
  
  // Draw axis-aligned rounded rectangles of stroke size 1
  for (let i = 0; i < 10; i++) {
    const center = getRandomPoint();
    const rectWidth = Math.round(50 + Math.random() * 100);
    const rectHeight = Math.round(50 + Math.random() * 100);
    const radius = Math.round(Math.random() * Math.min(rectWidth, rectHeight) * 0.2);
    const strokeWidth = 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      radius: radius,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }

  // Draw two big axis-aligned rounded rectangles with a very thick border with high transparency
  for (let i = 0; i < 10; i++) {
    const center = getRandomPoint();
    const rectWidth = 200;
    const rectHeight = 200;
    const radius = Math.round(Math.min(rectWidth, rectHeight) * 0.2);
    const strokeWidth =  Math.round(10 + Math.random() * 30);
    const strokeColor = { r: 0, g: 0, b: 0, a: 50 };
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      radius: radius,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }

  // Draw two big axis-aligned rounded rectangles with no stroke
  for (let i = 0; i < 10; i++) {
    const center = getRandomPoint();
    const rectWidth = 200;
    const rectHeight = 200;
    const radius = Math.round(Math.min(rectWidth, rectHeight) * 0.2);
    const strokeWidth =  0;
    const strokeColor = { r: 0, g: 0, b: 0, a: 0 };
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      radius: radius,
      rotation: 0,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }

  /*
  // Draw rotated rounded rectangles
  for (let i = 0; i < 3; i++) {
    const center = getRandomPoint();
    const rectWidth = 50 + Math.random() * 100;
    const rectHeight = 50 + Math.random() * 100;
    const radius = Math.min(rectWidth, rectHeight) * 0.2;
    const rotation = Math.random() * Math.PI * 2;
    const strokeWidth = Math.random() * 10 + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'roundedRect',
      center: center,
      width: rectWidth,
      height: rectHeight,
      radius: radius,
      rotation: rotation,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }
  */

  // Draw 90-degree arcs with different stroke sizes and radii
  const strokeSizes = [1, 2, 3, 4];
  const radii = [20, 40, 60];
  let xOffset = 150;

  for (const strokeSize of strokeSizes) {
    let yOffset = 150;
    for (const radius of radii) {
      const shape = {
        type: 'arc',
        center: { x: xOffset, y: yOffset },
        radius: radius,
        startAngle: 0,
        endAngle: 90,
        strokeWidth: strokeSize,
        strokeColor: { r: 200, g: 100, b: 100, a: 255 },
        fillColor: { r: 0, g: 0, b: 0, a: 0 }
      };

      shapes.push(shape);

      yOffset += radius * 2 + 20;
    }
    xOffset += 120;
  }

  // Add some random filled arcs
  for (let i = 0; i < 3; i++) {
    const arc = getRandomArc();
    shapes.push(arc);
  }

  // Draw circles
  for (let i = 0; i < 5; i++) {
    const center = getRandomPoint();
    const radius = 15 + Math.random() * 50;
    const strokeWidth = Math.random() * 10 + 1;
    const strokeColor = getRandomColor(200, 255);
    const fillColor = getRandomColor(100, 200);

    shapes.push({
      type: 'circle',
      center: center,
      radius: radius,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      fillColor: fillColor
    });
  }
}

