function getRandomCircle() {
  return {
      ...getRandomArc(),
      type: 'circle',
      startAngle: 0,
      endAngle: 360
  };
}

function addRandomCircles(shapes, log, count = 5) {
  for (let i = 0; i < count; i++) {
    shapes.push(getRandomCircle());
  }
}
