function getRandomArc() {
  const center = getRandomPoint(1);
  const radius = 15 + SeededRandom.getRandom() * 50;
  const startAngle = SeededRandom.getRandom() * 360;
  const endAngle = startAngle + SeededRandom.getRandom() * 270 + 90;
  const strokeWidth = SeededRandom.getRandom() * 10 + 1;
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

function addNinetyDegreeArcs(shapes, log, currentIterationNumber) {
  // Not strictly needed as there is nothing random here
  SeededRandom.seedWithInteger(currentIterationNumber);
  
  const strokeSizes = [1, 2, 3, 4];
  const radii = [20, 40, 60];
  let xOffset = 150;

  for (const strokeWidth of strokeSizes) {
    let yOffset = 150;
    for (const radius of radii) {
      shapes.push({
        type: 'arc',
        center: { x: xOffset, y: yOffset },
        radius,
        startAngle: 0,
        endAngle: 90,
        strokeWidth,
        strokeColor: { r: 200, g: 100, b: 100, a: 255 },
        fillColor: { r: 0, g: 0, b: 0, a: 0 }
      });
      log.innerHTML += `&#x25DC; 90&deg; arc at (${xOffset}, ${yOffset}) radius: ${radius} strokeWidth: ${strokeWidth}<br>`;
      yOffset += radius * 2 + 20;
    }
    xOffset += 120;
  }
}

function addRandomArcs(shapes, log, currentIterationNumber, count = 3) {
  SeededRandom.seedWithInteger(currentIterationNumber);
  for (let i = 0; i < count; i++) {
    const arc = getRandomArc();
    shapes.push(arc);
    log.innerHTML += `&#x25DC; Arc at (${arc.center.x}, ${arc.center.y}) radius: ${arc.radius} angles: ${arc.startAngle}&deg; to ${arc.endAngle}&deg; strokeWidth: ${arc.strokeWidth} strokeColor: ${colorToString(arc.strokeColor)} fillColor: ${colorToString(arc.fillColor)}<br>`;
  }
}
