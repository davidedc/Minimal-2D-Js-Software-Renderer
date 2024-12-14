# CrispSwCanvas specs v2

CrispSwCanvas is a basic, crisp (i.e. *not* anti-aliased), shapes-oriented, sw-rendered canvas in JS. Its API is a subset of the HTML5Canvas API, so they are interchangeable if one sticks to basic use.

## Purpose
The purpose of CrispSwCanvas is to provide a pixel-identical browser-and-platform-independent rendering engine specifically for UIs - where the rendered features are often fine-detailed (e.g. 1-px lines) simple shapes (lines, rectangles, arcs, circles, rounded rectangles).

So, the reasons we are making this crisp sw rendered canvas are:
 - it’s crisp (i.e. anti-aliasing *is not* supported) for simplicity
 - the renders are identical across browsers and platforms. While crisp drawings in Canvas (see examples below) are also identical across browsers and platforms, anti-aliased features (e.g. arcs) are not.
 - can be used outside of the browser environment e.g. node
 - renders can be saved losslessly with high compression (useful when storing a lot of reference screenshots for tests).

## Supported/unsupported features

CrispSwCanvas supports:
 - basic shapes filled / stroked with trasparency
 - transformations (translation, rotation, scaling) that affect both position and dimensions of shapes

CrispSwCanvas does *not* support:
 - anti-aliasing
 - fill/stroke styles beyond rgba color
 - clipping
 - arbitrary paths
 - stroke() and fill(). Shapes can be filled/stroked in the manner of fillRect/strokeRect (further such functions will be introduced and added to Canvas e.g. strokeLine, fillCircle etc.).

CrispSwCanvas leans on crisp sw-render routines, also added below for reference.

## Specs

### Coordinate system conventions
CrispSwCanvas uses the same coordinate system as Canvas - i.e. coordinates don't correspond to pixels but rather specify points in the grid delimiting pixels. In such coordinate system Canvas users have to use some tricks to draw crisp features e.g.
 - introduce a 0.5 coordinates offset to draw crisp horizontal/vertical lines
 - introduce a 0.5 inset of 1px borders around integer-coordinates rectangles

For compatibility with the Canvas mode, CrispSwCanvas will also expect users to manually specify such offsets like in regular Canvas.

I.e. the same Canvas coordinates that produce crisp features in Canvas will also produce crisp features in CrispSwCanvas. I.e. when Canvas is made to draw crisply, or have specific alignments (e.g. the precise horizontal extent of a circle) - CrispSwCanvas will also produce the same crisp output and the same alignments using the same (some times non-integer) coordinates.

These are some examples of drawings that are rendered crisply (at least in some of the mentioned features) in Canvas, and hence should be drawn crisply in CrispSwCanvas too.

*Example 1: a 1-px horizontal line and vertical line:*

    // Draw vertical line at x=100
    // function doesn't exist yet but will be implemented following
    // in spirit strokeRect.
    // x, y, deltaX, deltaY
    ctx.strokeLine(100.5,0,0, canvas.height);
    
    // Draw horizontal line at y=50
    ctx.strokeLine(0,50.5,canvas.width, 0);

*Example 2: a crisp filled rectangle:*

    ctx.fillRect(100, 50, 80, 40);

*Example 3: crisp filled rectangle with crisp 1px stroke on the inner side of the fill*

    ctx.fillRect(100,  50,  80,  40);
    ctx.strokeRect(100.5,  50.5,  79,  39);

*Example 4: crisp filled rectangle with crisp 2px stroke centred on the edge of the fill*

    ctx.lineWidth = 2;
    ctx.fillRect(100, 50, 80, 40);
    ctx.strokeRect(100, 50, 80, 40);

*Example 5: rounded rectangle with crisp 1-px sides (arcs have anti-aliasing)*

    // function don't exist yet but will be implemented following
    // in spirit fillRect/strokeRect, with an added radius parameter
    ctx.fillRoundedRect(100, 50, 80, 40, 4);
    ctx.strokeRoundedRect(100.5, 50.5, 79, 39, 4);
    
Also 90-degree rotations and integer-scaling and integer-translations preserve crispness in Canvas (and hence in CrispSwCanvas). Note that for *arbitrary* transformations, Canvas won't preserve crispness, and CrispSwCanvas will do its best to approximate the Canvas drawing (position on screen) within its aliasing limitation.

Hence CrispSwCanvas accepts non-integer coordinates, and will pass them unchanged to the underlying sw-render routines. The low-level sw-render routines will handle the passed coordinates and will produce the same output of Canvas when that's expected to be crisp.

### Creation
At creation time, the width and height are given and a RGBA frame buffer is created, set as transparent black (i.e. filled with zeroes).

    var crispSwCanvas = new CrispSwCanvas(width, height);

You can get a context from the CrispSwCanvas. The context is used to issue commands. 

    // Only "2d" accepted, throws error otherwise.
    var crispSwCtx = crispSwCanvas.getContext("2d");

#### The context contains:
- stack (implemented via simple array with index) of *states* i.e. objects.

#### Each state object contains:
-  lineWidth (default: 1)
-  transformation matrix (default: identity)
-  stroke color (default: rgba(0,0,0,1) i.e. fully opaque black)
-  fill color (default: rgba(0,0,0,1) i.e. fully opaque black)

The top element of the states in the stack is the "current state" of the context, and is the one modified by the commands.

### save()/restore()
A “save” will do a full deep copy of the whole state (except the transformation matrix which can be referenced as it's immutable) and push it onto the stack, and the state will point to it. A restore will remove the last pushed element so the current state will be the element before it; restore on an empty stack throws an Error.

### beginPath()
does nothing

### Transformations
Transformations are applied in the same order as in the standard Canvas API. For example:
```javascript
ctx.translate(200, 200);  // Move to point (200,200)
ctx.rotate(Math.PI / 4);  // Then rotate around that point
ctx.scale(2, 2);         // Then scale from the rotated position
```

The transformations affect:
- The position of shapes (via transformed center point)
- The dimensions of shapes (via scale factors)
- The rotation of shapes
- The line width of strokes (scaled appropriately)

Available transformation commands are: scale, rotate(radians), translate. For simplicity, `setTransform()` and `resetTransform()` are not implemented for now.

#### Matrix Representation
Transformations are tracked via a 3x3 transformation matrix kept in the state. All transformation matrices in CrispSwCanvas are stored in column-major order for consistency with WebGL conventions. A transformation matrix is represented as a 3x3 matrix in homogeneous coordinates:

    |a b c|
    |d e f|
    |0 0 1|

stored as a Float64Array in column-major order: `[a, d, 0, b, e, 0, c, f, 1]` This representation ensures consistent behavior across all transformation operations and matches common graphics programming conventions.

    class TransformationMatrix {
        // Store in column-major order:
        // [a, d, 0, // first column (indices 0,1,2)
        // b, e, 0, // second column (indices 3,4,5)
        // c, f, 1] // third column (indices 6,7,8)
        // This represents the matrix:
        // |a b c|
        // |d e f|
        // |0 0 1|
        constructor() {
            this.elements = new Float64Array([
                1, 0, 0,  // first column
                0, 1, 0,  // second column
                0, 0, 1   // third column
            ]);
        }
        
        // deep copy of the transformation matrix
        clone()  {
            const clonedMatrix =  new  TransformationMatrix();
            // Copy all elements from the current matrix to the new one
            clonedMatrix.elements.set(this.elements);
            return clonedMatrix;
        }

        // Add helper methods to access elements in a clear way
        get(row, col) {
            return this.elements[col * 3 + row];
        }
        
        set(row, col, value) {
            this.elements[col * 3 + row] = value;
        }
    }

New transformations multiply on the right: T = T1 * T2 * T3. This ensures transformations are applied in the same order as they appear in the code:
```javascript
// For the sequence:
ctx.translate(200, 200);  // T1
ctx.rotate(Math.PI / 4);  // T2
ctx.scale(2, 2);         // T3

// The final transformation is:
Final = T1 * T2 * T3 = Translation * Rotation * Scale
```

    class TransformationMatrix {
    // ... previous code ...

        multiply(other)  {
            const result =  new  TransformationMatrix();
            for  (let col =  0; col <  3; col++)  {
                for  (let row =  0; row <  3;row++)  {
                    let sum =  0;
                    for  (let i =  0; i <  3; i++)  {
                        sum +=  this.get(row, i)  * other.get(i, col);
                    }
                    result.set(row, col, sum);
                }
            }
            return result;
        }
        
        translate(x, y) {
            // Create translation matrix
            const translationMatrix = new TransformationMatrix();
            translationMatrix.elements.set([
                1, 0, 0,  // first column
                0, 1, 0,  // second column
                x, y, 1   // third column
            ]);
            // Multiply: current * translation
            return this.multiply(translationMatrix);
        }
        
        scale(sx, sy) {
            // Create scale matrix
            const scaleMatrix = new TransformationMatrix();
            scaleMatrix.elements.set([
                sx, 0, 0,  // first column
                0, sy, 0,  // second column
                0, 0, 1    // third column
            ]);
            // Multiply: current * scale
            return this.multiply(scaleMatrix);
        }
        
        rotate(angleInRadians) {
            // Create rotation matrix
            const rotationMatrix = new TransformationMatrix();
            const cos = Math.cos(angleInRadians);
            const sin = Math.sin(angleInRadians);
            rotationMatrix.elements.set([
                cos, sin, 0,   // first column
                -sin, cos, 0,  // second column
                0, 0, 1        // third column
            ]);
            // Multiply: current * rotation
            return this.multiply(rotationMatrix);
        }
    }

**Example:**

    let matrix = new TransformationMatrix();
    // This will first rotate, then scale, then translate
    matrix = matrix.rotate(Math.PI/4)  // First apply rotation
                .scale(2, 2)           // Then scale
                .translate(10, 20);    // Finally translate

For applying transformations, points are represented as column vectors [x, y, 1]ᵀ in homogeneous coordinates. Transformations are applied as: p' = T * p

     p'       T       p
     ↓        ↓       ↓
    |x'|   |a b c|   |x|
    |y'| = |d e f| * |y|
    |1 |   |0 0 1|   |1|

where T is the current transformation matrix.

    function transformPoint(x, y, matrix) {
        // The matrix is stored in column-major order as:
        // [a, d, 0,
        //  b, e, 0,
        //  c, f, 1]

        // Which corresponds to the matrix:
        // | a b c |
        // | d e f |
        // | 0 0 1 |

        // From this, we have:
        // a = matrix[0], d = matrix[1]
        // b = matrix[3], e = matrix[4]
        // c = matrix[6], f = matrix[7]

        // Transforming a point (x,y):
        // |x'|   | a b c |   |x|   |ax + by + c|
        // |y'| = | d e f | * |y| = |dx + ey + f|
        // |1 |   | 0 0 1 |   |1|   | 1 |

        // i.e.
        // x' = a*x + b*y + c
        // y' = d*x + e*y + f

        const tx = matrix[0] * x + matrix[3]  * y + matrix[6];  // a*x + b*y + c
        const ty = matrix[1] * x + matrix[4]  * y + matrix[7];  // d*x + e*y + f
        return {tx, ty};
    }

Degenerate transformations (determinant = 0) throw an InvalidStateError. Transformation matrixes are immutable i.e. updates to the current transformation matrix are not in-place: a new transformation matrix is created with each change.

strokeRect / fillRect also use the current transformation matrix to determine the screen position of the drawing.

Note that transformations are not only used to determine the geometry of a shape, but also to pass to the low-level drawing routine the right line width parameter, as the line width changes with the scale:

    // shear ignored
    // might produce unexpected results for highly uneven scales
    function getScaledLineWidth(matrix, baseWidth) {
        // For column-major [a, d, 0, b, e, 0, c, f, 1]
        // First column (x-axis): [a, d, 0]
        const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
        // Second column (y-axis): [b, e, 0]
        const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
        // Use geometric mean and enforce minimum scale
        const scale = Math.max(Math.sqrt(scaleX * scaleY), 0.0001);
        return baseWidth * scale;
    }

### Shape commands
i.e. rect, arc, circle, line, etc. There are not implemented.

### Color
the color commands are fiillStyle, strokeStyle. The only accept rgb or rgba string formats without spaces and non-case-sensitive, with rgb values clamped to 255 and alpha between 0 and 1.  i.e. a) RGBA string i.e. crispSwCtx.fillStyle = "rgba(32, 45, 21, 0.3)"; or b) crispSwCtx.fillStyle = "rgb(32, 45, 21)”; . All non-parsed formats throw Error. Non-integer rgb values are accepted and will be rounded internally. These rgba values are in sRGB color space as in Canvas by default. Stroke and fill color are kept in the state of the context.

#### Parsing
    function parseColor(colorStr) {
        // Remove all whitespace first
        colorStr = colorStr.replace(/\s+/g, '');
        
        const rgbMatch = colorStr.match(/^rgb\((\d+),(\d+),(\d+)\)$/i);
        const rgbaMatch = colorStr.match(/^rgba\((\d+),(\d+),(\d+),([0-9]*\.?[0-9]+)\)$/i);
        
        if (rgbMatch) {
            const [_, r, g, b] = rgbMatch;
            // Validate before normalization
            if (r > 255 || g > 255 || b > 255) {
                throw new InvalidArgumentError("RGB values must be between 0-255");
            }
            return normalizeColor(+r, +g, +b, 1);
        }
        // Similar handling for rgba...
    }

#### Normalizing
    function normalizeColor(r, g, b, a) {
        return {
            r: Math.round(Math.max(0, Math.min(255, r))),
            g: Math.round(Math.max(0, Math.min(255, g))),
            b: Math.round(Math.max(0, Math.min(255, b))),
            a: Math.max(0, Math.min(1, a))
        };
    }

#### Example of usage

    crispSwCtx.rect(20, 20, 150, 100);
    crispSwCtx.fillStyle = "rgba(32, 45, 21, 0.3)";
    crispSwCtx.fill();
  

### Paint commands
fill() and stroke() throw an Error. This is because fill() stroke() on Canvas act on an arbitrary path overall, not on multiple shapes individually - for example multiple overlapping rectangles would be filled uniformly in the area of the union, and stroked as per the border of the union. While this could be implemented for fill() , it would be rather hard to do for strokes, so we ditch the whole idea of generic paths and fill/stroke for simplicity/uniformity.
  
### Combined shape + paint commands
fillRect, strokeRect, clearRect. These are the only way to actually draw shapes. These just immediately fill/stroke a shape (currently, a rectangle) in an aliased fashion (i.e. *not* anti-aliased) given the currenttransformation matrix, fill/stroke style.

    crispSwCtx.fillRect(20, 20, 150, 100); // crisp fill
    crispSwCtx.strokeRect(20.5, 20.5, 149, 99); // crisp stroke

clearRect clears the contents of the specified area (subject to current transform).

    crispSwCtx.clearRect(40, 40, 50, 50);

### Other functions

    crispSwCtx.blitToCanvas(canvas)

...paints the contents of the frame buffer to the given canvas, in a similar fashion to:

    new ImageData(frameBuffer, width, height); // Put the image data onto the canvas
    ctx.putImageData(imageData,  0,  0);

### Clearing operations
The `clearRect` operation sets all pixels in the specified rectangle to transparent (rgba(0,0,0,0)), 
respecting the current transformation matrix. This matches the behavior of the standard Canvas API.
