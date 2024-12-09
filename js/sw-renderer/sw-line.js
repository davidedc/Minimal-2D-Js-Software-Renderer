function drawLineSW(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
  if (strokeWidth === 1) {
    drawLineSW1px(x1, y1, x2, y2, strokeR, strokeG, strokeB, strokeA);
  } else {
    drawLineSWThick(x1, y1, x2, y2, strokeWidth, strokeR, strokeG, strokeB, strokeA);
  }
}

function drawLineSW1px(x1, y1, x2, y2, r, g, b, a) {

  // Tweaks to make the sw render match more closely the canvas render.
  // -----------------------------------------------------------------
  // For an intuition about why this works, imagine a thin vertical line.
  // If the start point is at x1 = 0.5, y1 = 0.5, then it means that
  // in canvas we mean to draw it crisply (because the path line is centered in the
  // middle of the pixel and extends 0.5 pixels in each direction to perfectly cover
  // one column). In SW, we need to draw that case at x = 0, y = 0.
  // If the start point is at x1 = 1, y1 = 1, then it means that in canvas we
  // mean to draw it "blurry" (because the path line is centered in between
  // pixels and hence the line extends 0.5 pixels in each direction to cover half of two columns).
  // In SW, we still draw it crisply (this library doesn't support anti-aliasing / sub-pixel
  // rendering), so we have to pick one of the half-columns to be drawn fully.
  // We choose the right one, but in general the floor() means that
  // we pick the one that is closer to the center of the path (which should be the
  // darker one as it's the most covered by the path).
  x1 = Math.floor(x1);
  y1 = Math.floor(y1);
  x2 = Math.floor(x2);
  y2 = Math.floor(y2);
  
  // MOREOVER, in Canvas you reason in terms of grid lines, so
  // in case of a vertical line, where you want the two renders to be
  // identical, for example three grid lines actually cover the span
  // of 2 pixels.
  // However, in SW you reason in terms of pixels, so you can't cover
  // "three" as in Canvas, rather "two" because you actually want to
  // cover two pixels, not three.
  // Hence, in a nutshell, you have to tweak the received parameters
  // (which work in canvas) by shortening the line by 1 pixel if it's vertical.
  //
  // Note how always decreasing the bottom y coordinate is always correct:
  //
  //          Case y2 > y1            #          Case y1 > y2
  //       e.g. y1 = 1, y2 = 3        #       e.g. y1 = 3, y2 = 1
  //      (drawing going down)        #       (drawing going up)
  //  ------------------------------- # ---------------------------------
  //  Before adjustment:              #   Before adjustment:
  //    0                             #     0
  //    1 ● ↓                         #     1 ●
  //    2 ● ↓                         #     2 ● ↑
  //    3 ●                           #     3 ● ↑
  //  ------------------------------- # ---------------------------------
  //  After adjustment (i.e. y2--):   #   After adjustment (i.e. y1--):
  //    0                             #     0
  //    1 ● ↓                         #     1 ●
  //    2 ●                           #     2 ● ↑
  //    3                             #     3
  //
  // Note also that this "off by one" difference is always present also
  // in oblique lines, however a) you don't expect the renders to be
  // identical in those cases as sw render doesn't support anti-aliasing / sub-pixel
  // rendering anyways and b) the difference is barely noticeable in those cases.

  if (x1 === x2) y2 > y1 ? y2-- : y1--;

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    setPixel(x1, y1, r, g, b, a);
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x1 += sx; }
    if (e2 < dx) { err += dx; y1 += sy; }
  }
}

function drawLineSWThick(x1, y1, x2, y2, thickness, r, g, b, a) {

  // Tweaks to make the sw render more closely match the canvas render.
  x1 -= 0.5;
  y1 -= 0.5;
  x2 -= 0.5;
  y2 -= 0.5;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return;
  
  const perpX = -dy / length;
  const perpY = dx / length;
  
  const halfThickness = thickness / 2;
  const corners = [
    [x1 + perpX * halfThickness, y1 + perpY * halfThickness],
    [x1 - perpX * halfThickness, y1 - perpY * halfThickness],
    [x2 + perpX * halfThickness, y2 + perpY * halfThickness],
    [x2 - perpX * halfThickness, y2 - perpY * halfThickness]
  ];
  
  const minX = Math.floor(Math.min(...corners.map(c => c[0])));
  const maxX = Math.ceil(Math.max(...corners.map(c => c[0])));
  const minY = Math.floor(Math.min(...corners.map(c => c[1])));
  const maxY = Math.ceil(Math.max(...corners.map(c => c[1])));
  
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x - x1;
      const py = y - y1;
      const dot = (px * dx + py * dy) / length;
      const projX = (dx / length) * dot;
      const projY = (dy / length) * dot;
      const distX = px - projX;
      const distY = py - projY;
      const dist = Math.sqrt(distX * distX + distY * distY);
      
      if (dot >= 0 && dot <= length && dist <= halfThickness) {
        setPixel(x, y, r, g, b, a);
      }
    }
  }
}

