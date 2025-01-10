// THIS IS NOT USED SO FAR BECAUSE WE FILL (ROTATED) RECTANGLES SO FAR, FOR WHICH WE
// USE THE Edge Function Method (Half-Space Method), WHICH SHOULD BE FASTER.
// --------------------------------------------------------------------------
// Ray Casting algorithm (also known as the Even-Odd Rule algorithm) for
// determining if a point lies inside a polygon
// conceptually draws a ray from the test point (x,y) extending infinitely
// in one direction (in this case, horizontally to the right) and counts
// how many times this ray intersects the polygon's edges.
function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function extendLine(p1, p2, amount) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return { start: p1, end: p2 };
  
  const dirX = dx / len;
  const dirY = dy / len;
  
  return {
    start: {
      x: p1.x - dirX * amount,
      y: p1.y - dirY * amount
    },
    end: {
      x: p2.x + dirX * amount,
      y: p2.y + dirY * amount
    }
  };
}

function shortenLine(p1, p2, amount) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  if (len === 0) return { start: p1, end: p2 };
  
  const dirX = dx / len;
  const dirY = dy / len;
  
  return {
    start: {
      x: p1.x + dirX * amount,
      y: p1.y + dirY * amount
    },
    end: {
      x: p2.x - dirX * amount,
      y: p2.y - dirY * amount
    }
  };
}




// currently unused
function alignToPixelBoundary(point) {
  return {
    x: Math.round(point.x) + 0.5,
    y: Math.round(point.y) + 0.5
  };
}


function toIntegerPoint(point) {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y)
  };
}

function roundPoint({x, y}) {
  return {
    x: Math.round(x),
    y: Math.round(y)
  };
}

// The intent here is to draw a *crisp* shape.
// If the user knows what they are doing, they pass centerX and width such that
// they produce a whole origin x. If they don't, we fix it for them by snapping
// the origin x to the column to the left.
// (and same for y/height/row above).
function getCornerBasedRepresentation(centerX, centerY, width, height) {
  const x = Math.floor(centerX - width/2);
  const y = Math.floor(centerY - height/2);
  return { x, y, w: width, h: height };
}

// The intent here is to draw a *crisp* stroke that is aligned with the fill, with
// some overlap (at least half of the stroke width is made to overlap the fill).
// Given the center and width/height of a rectangle, not only we fix everything
// as we do in getCornerBasedRepresentation, but we also we tell where exactly the stroke
// should.
function getCrispStrokeGeometry(x, y, width, height, strokeWidth) {
  // if strokeWidth is odd, we need to align the stroke to the pixel grid i.e. inset it by 0.5
  const offset = strokeWidth % 2 ? 0.5 : 0;
  return { x: x + offset, y: y + offset, w: width - 2 * offset, h: height - 2 * offset};
}