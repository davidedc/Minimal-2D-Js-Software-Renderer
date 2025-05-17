// TODO anyone calling drawRoundedRectCanvas should rather do some call to
// canvas.roundRect() instead !
function drawRoundedRectCanvas(ctx, shape) {
  const {
      center, width, height, radius, rotation,
      strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  if (isNearMultipleOf90Degrees(rotation)) {
      // Create a modified shape with adjusted width and height
      const { adjustedWidth, adjustedHeight } = getRotatedDimensionsIfTheCase(width, height, rotation);
      const modifiedShape = {
          ...shape,
          width: adjustedWidth,
          height: adjustedHeight
      };
      drawCrispAxisAlignedRoundedRectCanvas(ctx, modifiedShape);
  } else {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(rotation);

      ctx.beginPath();
      roundedRectPath(ctx, -width/2, -height/2, width, height, radius);

      if (fillA > 0) {
          ctx.fillStyle = colorToString(fillR, fillG, fillB, fillA);
          ctx.fill();
      }
      if (strokeA > 0 && strokeWidth > 0) {
          ctx.lineWidth = strokeWidth;
          ctx.strokeStyle = colorToString(strokeR, strokeG, strokeB, strokeA);
          ctx.stroke();
      }
      ctx.restore();
  }
}

// Note that this code draws the rounded rect in such a way that
// the stroke path and the fill always begin and end at the pixel boundary
// so that their borders are drawn crisply.
// Also note that this draws the fill and stroke *exactly* aligned
// with the sw renderer (not the arcs of the rounded corners, those are
// slightly different, but the borrders of the fill and stroke are the same apart
// from those arcs).

function drawCrispAxisAlignedRoundedRectCanvas(ctx, shape) {
  const { 
      center: {x: centerX, y: centerY}, 
      width: rectWidth, 
      height: rectHeight, 
      radius, 
      strokeWidth, 
      strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
      fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
  } = shape;

  // to drow a crisp rectangle-like shape, while centerX and centerY could be non-integer,
  // the width and height must be integers, so let's throw an error if they are not
  if (rectWidth % 1 !== 0 || rectHeight % 1 !== 0) {
    throw new Error('Width and height must be integers');
  }


  // Create path aligned strictly to whole pixels
  const createPath = (pos, r) => {
      ctx.beginPath();

      const fx = pos.x;
      const fy = pos.y;
      const fw = pos.w;
      const fh = pos.h;
      const fr = r;

      ctx.moveTo(fx + fr, fy);
      ctx.lineTo(fx + fw - fr, fy);
      ctx.arcTo(fx + fw, fy, fx + fw, fy + fr, fr);
      ctx.lineTo(fx + fw, fy + fh - fr);
      ctx.arcTo(fx + fw, fy + fh, fx + fw - fr, fy + fh, fr);
      ctx.lineTo(fx + fr, fy + fh);
      ctx.arcTo(fx, fy + fh, fx, fy + fh - fr, fr);
      ctx.lineTo(fx, fy + fr);
      ctx.arcTo(fx, fy, fx + fr, fy, fr);
      ctx.closePath();
  };

  // Draw fill first (if needed)
  if (fillA > 0) {
    let pos = getRectangularFillGeometry(centerX, centerY, rectWidth, rectHeight);
    let r = Math.round(Math.min(radius, Math.min(pos.w, pos.h) / 2));
    createPath(pos, r);
    ctx.fillStyle = colorToString(fillR, fillG, fillB, fillA);
    ctx.fill();
  }
  
  // Draw stroke (if needed)
  if (strokeWidth > 0 && strokeA > 0) {
    let pos = getRectangularStrokeGeometry(centerX, centerY, rectWidth, rectHeight);
    let r = Math.round(Math.min(radius, Math.min(pos.w, pos.h) / 2));
    createPath(pos, r);
    ctx.strokeStyle = colorToString(strokeR, strokeG, strokeB, strokeA);
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}