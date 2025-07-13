function roundPoint({x, y}) {
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

function placeCloseToCenterAtPixel(width, height) {
  return {
    centerX: Math.floor(width / 2) + 0.5,
    centerY: Math.floor(height / 2) + 0.5
  };
}

function placeCloseToCenterAtGrid(width, height) {
  return {
    centerX: Math.floor(width / 2),
    centerY: Math.floor(height / 2)
  };
}