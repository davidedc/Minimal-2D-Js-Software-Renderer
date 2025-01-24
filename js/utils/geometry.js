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

function roundCornerOfRectangularGeometry(rectGeometry) {
  const {x, y, w, h} = rectGeometry;
  // round x, y , while leaving w and h as they are
  return {
    x: Math.round(x),
    y: Math.round(y),
    w: w,
    h: h
  };
}

function roundCornerOfRectangularGeometryWithWarning(rectGeometry) {
  const rounded = roundCornerOfRectangularGeometry(rectGeometry);
  if (rounded.x !== rectGeometry.x || rounded.y !== rectGeometry.y) {
    console.warn('Rectangular geometry is not at a grid point, rounding to nearest grid point. When this happens, HTML5 Canvas would do a non-crisp fill, while the SW renderer will do a crisp fill.');
  }
  return rounded;
}

// The intent here is to draw a *crisp* shape.
// If the user knows what they are doing, they pass centerX and width such that
// they produce a whole origin x. If they don't, we fix it for them by snapping
// the origin x to the column to the left.
// (and same for y/height/row above).
function getRectangularFillGeometry(centerX, centerY, width, height) {
  const x = centerX - width/2;
  const y = centerY - height/2;
  return { x, y, w: width, h: height };
}

// The intent here is to draw a *crisp* stroke that is aligned with the fill, with
// some overlap (at least half of the stroke width is made to overlap the fill).
function getRectangularStrokeGeometry(centerX, centerY, width, height, strokeWidth) {
  const x = centerX - width/2;
  const y = centerY - height/2;
  return { x: x, y, w: width, h: height};
}

/**
 * Adjusts width and height to ensure crisp rendering based on stroke width and center position
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} strokeWidth - Width of the stroke
 * @param {Object} center - Center coordinates {x, y}
 * @returns {Object} Adjusted width and height
 */
function adjustDimensionsForCrispStrokeRendering(width, height, strokeWidth, center) {

  // Dimensions should be integers, because non-integer dimensions
  // always produce a non-crisp (i.e. non-grid-aligned) stroke/fill.
  let adjustedWidth = Math.floor(width);
  let adjustedHeight = Math.floor(height);

  // FIXING THE WIDTH /////////////////////////////////

  // For center's x coordinate at grid points (integer coordinates)
  if (Number.isInteger(center.x)) {
    // For odd strokeWidth, width should be odd
    if (strokeWidth % 2 !== 0) {
      if (adjustedWidth % 2 === 0) adjustedWidth++;
    }
    // For even strokeWidth, width should be even
    else {
      if (adjustedWidth % 2 !== 0) adjustedWidth++;
    }
  }
  // For center's x coordinate at pixels (i.e. *.5 coordinates)
  else if (center.x % 1 === 0.5) {
    // For odd strokeWidth, width should be even
    if (strokeWidth % 2 !== 0) {
      if (adjustedWidth % 2 !== 0) adjustedWidth++;
    }
    // For even strokeWidth, width should be odd
    else {
      if (adjustedWidth % 2 === 0) adjustedWidth++;
    }
  }

  // FIXING THE HEIGHT /////////////////////////////////

  // For center's y coordinate at grid points (integer coordinates)
  if (Number.isInteger(center.y)) {
    // For odd strokeWidth, height should be odd
    if (strokeWidth % 2 !== 0) {
      if (adjustedHeight % 2 === 0) adjustedHeight++;
    }
    // For even strokeWidth, height should be even
    else {
      if (adjustedHeight % 2 !== 0) adjustedHeight++;
    }
  }
  // For center's y coordinate at pixels (i.e. *.5 coordinates)
  else if (center.y % 1 === 0.5) {
    // For odd strokeWidth, height should be even
    if (strokeWidth % 2 !== 0) {
      if (adjustedHeight % 2 !== 0) adjustedHeight++;
    }
    // For even strokeWidth, height should be odd
    else {
      if (adjustedHeight % 2 === 0) adjustedHeight++;
    }
  }

  return {
    width: adjustedWidth,
    height: adjustedHeight
  };
}

/**
 * Adjusts center coordinates to ensure crisp rendering based on stroke width and dimensions
 * @param {number} centerX - Original center X coordinate
 * @param {number} centerY - Original center Y coordinate
 * @param {number} width - Shape width
 * @param {number} height - Shape height
 * @param {number} strokeWidth - Width of the stroke
 * @returns {Object} Adjusted center coordinates
 */
function adjustCenterForCrispStrokeRendering(centerX, centerY, width, height, strokeWidth) {
  
  let adjustedX = centerX;
  let adjustedY = centerY;

  // For odd strokeWidth
  //   if width/height are even, then the center x/y should be in the middle of the pixel i.e. *.5
  //   if width/height are odd, then the center x/y should be at the grid point i.e. integer

  // For even strokeWidth
  //   if width/height are even, then the center x/y should be at the grid point i.e. integer
  //   if width/height are odd, then the center x/y should be in the middle of the pixel i.e. *.5

  if (strokeWidth % 2 !== 0) {
    if (width % 2 === 0) {
      adjustedX = Math.floor(centerX) + 0.5;
    } else {
      adjustedX = Math.round(centerX);
    }

    if (height % 2 === 0) {
      adjustedY = Math.floor(centerY) + 0.5;
    } else {
      adjustedY = Math.round(centerY);
    }
  }
  else {
    if (width % 2 === 0) {
      adjustedX = Math.round(centerX);
    } else {
      adjustedX = Math.floor(centerX) + 0.5;
    }

    if (height % 2 === 0) {
      adjustedY = Math.round(centerY);
    } else {
      adjustedY = Math.floor(centerY) + 0.5;
    }
  }



  return {
    x: adjustedX,
    y: adjustedY
  };
}

// Not used anywhere yet.
function checkBasicConditionsForCrispRendering(centerX, centerY, width, height, strokeWidth) {
  // For *both* fill and stroke to have a chance to be crisp, there are a number of
  // things that must be true (necessary conditions, but not sufficient):
  //   1. width and height must be integers
  //   2. strokeWidth must be an integer
  //   3. centerX and centerY coordinates must be either integers or *.5

  // So here we check that the inputs satisfy those conditions and emit a warning
  // if they don't.

  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    console.warn("Width and height must be integers for crisp rendering");
  }
  if (!Number.isInteger(strokeWidth)) {
    console.warn("Stroke width must be an integer for crisp rendering");
  }
  if (!Number.isInteger(centerX) && centerX % 1 !== 0.5) {
    console.warn("Center X must be an integer or *.5 for crisp rendering");
  }
  if (!Number.isInteger(centerY) && centerY % 1 !== 0.5) {
    console.warn("Center Y must be an integer or *.5 for crisp rendering ");
  }
}