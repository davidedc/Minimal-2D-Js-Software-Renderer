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
