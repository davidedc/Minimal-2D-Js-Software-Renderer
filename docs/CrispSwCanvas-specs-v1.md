# CrispSwCanvas specs

CrispSwCanvas is a basic, crisp (i.e. *not* anti-aliased), shapes-oriented, sw-rendered canvas in JS. Its API is a subset of the HTML5Canvas API, so they are interchangeable if one sticks to basic use.

**Purpose**
The purpose of CrispSwCanvas is to provide a pixel-identical browser-and-platform-independent rendering engine specifically for UIs - where the rendered features are often fine-detailed (e.g. 1-px lines) simple shapes (lines, rectangles, arcs, circles, rounded rectangles). CrispSwCanvas can also be used in JS environments where Canvas simply doesn't exist (node).

**Supported/unsupported features**
CrispSwCanvas supports basic shapes, clipping, transformations, fills/strokes with trasparency. CrispSwCanvas does *not* support anti-aliasing, nor it supports arbitrary paths, rather only basic shapes i.e. rectangles (and later on, lines, circles, ellipses and arcs). CrispSwCanvas leans on crisp sw-render routines, also added below for reference.
 
 **Coordinate system conventions**
CrispSwCanvas uses the same coordinate system as Canvas - i.e. coordinates don't correspond to pixels but rather specify points in the grid delimiting pixels. In such coordinate system Canvas has to use some tricks to draw crisp features e.g.
 - a 0.5 coordinates offset to draw crisp horizontal/vertical lines
 - a 0.5 inset of 1px borders around integer-coordinates rectangles

CrispSwCanvas will draw the same crisp features with the same Canvas commands. I.e. when Canvas is made to draw crisply, or have specific alignments (e.g. the precise horizontal extent of a circle) - CrispSwCanvas will also produce the same crisp output and the same alignments using the same (some times non-integer) coordinates.

These are some examples of drawings that are rendered crisply (at least in some of the mentioned features) in Canvas, and hence should be drawn crisply in CrispSwCanvas too.

*Example 1: a 1-px horizontal line and vertical line:*

    // Draw vertical line at x=100
    ctx.beginPath();
    ctx.moveTo(100.5, 0);
    ctx.lineTo(100.5, canvas.height);
    ctx.stroke();
    
    // Draw horizontal line at y=50
    ctx.beginPath();
    ctx.moveTo(0, 50.5);
    ctx.lineTo(canvas.width, 50.5);
    ctx.stroke();

*Example 2: a crisp filled rectangle:*

    ctx.fillRect(100, 50, 80, 40);

*Example 3: crisp filled rectangle with crisp 1px stroke on the inner side of the fill*

    ctx.fillRect(100.5,  50.5,  80,  40);
    ctx.strokeRect(100.5,  50.5,  79,  39);

*Example 4: crisp filled rectangle with crisp 2px stroke centred on the edge of the fill*

    ctx.lineWidth = 2;
    ctx.fillRect(100, 50, 80, 40);
    ctx.strokeRect(100, 50, 80, 40);

*Example 5: rounded rectangle with crisp 1-px sides (arcs have anti-aliasing)*

    ctx.beginPath();
    ctx.moveTo(x + radius +  0.5, y +  0.5);
    ctx.lineTo(x + width - radius +  0.5, y +  0.5);
    ctx.arcTo(x + width +  0.5, y +  0.5, x + width +  0.5, y + radius +  0.5, radius);
    ctx.lineTo(x + width +  0.5, y + height - radius +  0.5);
    ctx.arcTo(x + width +  0.5, y + height +  0.5, x + width - radius +  0.5, y + height +  0.5, radius);
    ctx.lineTo(x + radius +  0.5, y + height +  0.5);
    ctx.arcTo(x +  0.5, y + height +  0.5, x +  0.5, y + height - radius +  0.5, radius);
    ctx.lineTo(x +  0.5, y + radius +  0.5);
    ctx.arcTo(x +  0.5, y +  0.5, x + radius +  0.5, y +  0.5, radius);
    ctx.closePath();
    
Hence CrispSwCanvas accepts non-integer coordinates, and will pass them unchanged to the underlying sw-render routines. The low-level sw-render routines will handle the passed coordinates and will produce the same output of Canvas when that's expected to be crisp.

## API

**Creation**
At creation time, the width and height are given and a frame buffer is created, set as transparent black (i.e. filled with zeroes).

    var crispSwCanvas = new CrispSwCanvas(width, height);

You can get a context from the CrispSwCanvas. The context is used to issue commands. 

    // Only “2d” accepted, throws error otherwise.
    var crispSwCtx = crispSwCanvas.getContext("2d");

The context contains a stack (implemented via simple array with index) of *states* i.e. objects containing :

-  lineWidth (default: 1)
-  globalAlpha (default: 1 i.e. fully opaque)
-  clippingMask: a 1-bit bitmap/buffer with same size as the main buffer (default: all 1s).
-  transformation matrix (default: identity)
-  stroke color (default: rgba(0,0,0,1) i.e. fully opaque black)
-  fill color (default: rgba(0,0,0,1) i.e. fully opaque black)
-  shapes list (which includes each shape with transformed coordinates, see later)
-  "lastShapeInClippingMask" index: points to the last shape that has was included in the clippingMask. When clip() is invoked, this will be updated to point to the last element of the shapes list.

The top element of the states in the stack is the "current state" of the context, and is the one modified by the commands.

A “save” will do a full deep copy of the whole state and push it onto the stack, and the state will point to it. A restore will remove the last pushed element so the current state will be the element before it; restore on an empty stack throws an Error.

**beginPath()**
CrispSwCanvas doesn't actually support real paths, but this function is going to reset the queue of shapes and the lastShapeInClippingMask index. When we hit a fill() or a stroke(), we go through the pending queue of shapes and render them. Each shape in the queue stores its transformed coordinates (as passed in the command).

The queue of shapes will only consist of rectangles for now, and it will populate (with a RectShape) when the rect() command is called.

**Transformations**
Transformations are tracked via a 3x3 transformation matrix kept in the state. Transformations-related commands are scale, rotate, translate. Rotation uses radians. Transformations are like in Canvas i.e. new transforms multiply on left: Result = T3 * T2 * T1. The transformation matrix is immutable i.e. updates to the transformation matrix are not in-place: a new transformation matrix is created with each change, this is because shapes point at specific matrices.

Whenever a "shape" command is issued, the shape is added to the queue together with a pointer to the current transformation matrix, and at the time of either stroke() / fill() / strokeRect / fillRect, such transformation matrix will be used together to the coordinates of the shape as specified in the command to determine their screen position.

**Shape commands**
for now only rect, example:

    crispSwCtx.rect(20, 20, 150, 100);

**Color**
the color commands are fiillStyle, strokeStyle. The only accept rgb or rgba string formats without spaces and non-case-sensitive, with rgb values clamped to 255 and alpha between 0 and 1.  i.e. a) RGBA string i.e. crispSwCtx.fillStyle = "rgba(32, 45, 21, 0.3)"; or b) crispSwCtx.fillStyle = "rgb(32, 45, 21)”; . All other formats throw Error. Non-integer rgb values are accepted and will be rounded internally.
Stroke and fill color are kept in the state of the context.

    crispSwCtx.rect(20, 20, 150, 100);
    crispSwCtx.fillStyle = "rgba(32, 45, 21, 0.3)";
    crispSwCtx.fill();
  

**Painting commands**
fill() and stroke(). All shapes accumulated in the shapes queue so far will be drawn (fill-wise or stroke-wise) with the fill/stroke colors and the clippingMask as at the time the paint command is issued. 
  
**Combines shape + paint commands**
fillRect, strokeRect, clearRect. Those DO NOT add a shape to the shapes queue, they by-pass the shapes queue entirely and just immediately fill/stroke a rectangle given the current clippingMask, transformation matrix, fill/stroke style.

    crispSwCtx.fillRect(20, 20, 150, 100);  
    crispSwCtx.strokelRect(20, 20, 150, 100);

clearRect clears the contents of the specified area (subject to current transform and clippingMask).

    crispSwCtx.clearRect(40, 40, 50, 50);

**Clipping**
the clip() function
 1. makes a temporary copy of clippingMask, let's call that *tempMask*
 2. scans all the shapes _following_ the lastShapeInClippingMask index
 3. for each shape, it updates the *tempMask* by ORing it with the fills of the shape (drawn according to its coordinates and associated transformation matrix). Note that the bitmap mask is 1-bit, there is no transparency - so each shape will have to have a way to take the bitmap mask and OR it with its own fill.
 4. updates the clippingMask by ANDing it with the tempMask
 5. updates the lastShapeInClippingMask index to point to the last element in the shapes queue

The above allows for multiple shapes to be added as a union to the clippingMask, and for further clip() commands to narrow the clippingMask to the intersection of the new and old clipping. clippingMask and tempMask are both mutable i.e. will be updated in-place for efficiency, as there are no pointers to their specific states in time.
  
**Other functions**

    crispSwCtx.bitToCanvas(canvas)

...blits the contents of the frame buffer to the given canvas.
  
## Supporting code  

See below the graphic routines that CrispSwCanvas uses internally.

    const width = 600;
    const height = 600;
    const frameBuffer = new Uint8ClampedArray(width * height * 4);
    
    function setPixel(x, y, r, g, b, a) {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const index = (y * width + x) * 4;
      
      const alpha = a / 255;
      const oldAlpha = frameBuffer[index + 3] / 255;
      const newAlpha = alpha + oldAlpha * (1 - alpha);
      
      if (newAlpha > 0) {
        frameBuffer[index] = (r * alpha + frameBuffer[index] * oldAlpha * (1 - alpha)) / newAlpha;
        frameBuffer[index + 1] = (g * alpha + frameBuffer[index + 1] * oldAlpha * (1 - alpha)) / newAlpha;
        frameBuffer[index + 2] = (b * alpha + frameBuffer[index + 2] * oldAlpha * (1 - alpha)) / newAlpha;
        frameBuffer[index + 3] = newAlpha * 255;
      }
    }
    
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
    
    // rotation is in radians
    function drawRotatedRectSW(centerX, centerY, width, height, rotation, fillR, fillG, fillB, fillA) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        const points = [
            [-width / 2, -height / 2],
            [width / 2, -height / 2],
            [width / 2, height / 2],
            [-width / 2, height / 2]
        ].map(([x, y]) => ({
            x: centerX + x * cos - y * sin,
            y: centerY + x * sin + y * cos
        }));
    
        if (fillA > 0) {
            const minX = Math.floor(Math.min(...points.map(p => p.x)));
            const maxX = Math.ceil(Math.max(...points.map(p => p.x)));
            const minY = Math.floor(Math.min(...points.map(p => p.y)));
            const maxY = Math.ceil(Math.max(...points.map(p => p.y)));
    
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    if (pointInPolygon(x, y, points)) {
                        setPixel(x, y, fillR, fillG, fillB, fillA);
                    }
                }
            }
        }
    }

