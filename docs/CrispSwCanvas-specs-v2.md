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
 - clipping
 - transformations

CrispSwCanvas does *not* support:
 - anti-aliasing
 - fill/stroke styles beyond rgba color
 - arbitrary paths. Only a limited path system (only rect() for now) is supported and only for clipping.
 - stroke() and fill(). Shapes can be filled/stroked in the manner of fillRect/strokeRect (further such functions will be introduced and added to Canvas e.g. strokeLine, fillCircle etc.). Path commands (e.g. rect()) are only used for clipping and hence fill()/stroke() don't have any use

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

    // Only “2d” accepted, throws error otherwise.
    var crispSwCtx = crispSwCanvas.getContext("2d");

#### The context contains:
- a pointer to a tempClippingMask (initially null - only initialised to a 1-bit bitmap/buffer with same size as the main buffer defaulting to all 0s when needed)
- stack (implemented via simple array with index) of *states* i.e. objects.

#### Each state object contains:
-  lineWidth (default: 1)
-  globalAlpha (default: 1 i.e. fully opaque)
-  clippingMask: a 1-bit bitmap/buffer with same size as the main buffer (default: all 1s).
-  transformation matrix (default: identity)
-  stroke color (default: rgba(0,0,0,1) i.e. fully opaque black)
-  fill color (default: rgba(0,0,0,1) i.e. fully opaque black)

The top element of the states in the stack is the "current state" of the context, and is the one modified by the commands.

### save()/restore()
A “save” will do a full deep copy of the whole state (except the transformation matrix which can be referenced as it's immutable) and push it onto the stack, and the state will point to it. A restore will remove the last pushed element so the current state will be the element before it; restore on an empty stack throws an Error. In particular, in regards to the clippingMask - a save() will make a deep copy clone the clippingMask buffer, and a restore() will just discard the current state (including its clippingMask). In fact, just like in Canvas, a restore() is the only way to "widen" a clippingMask.

### beginPath()
CrispSwCanvas doesn't actually support real paths, but this function is going to reset the clippingShapes list. When we hit a clip(), we go through this list.

The queue of shapes will only consist of rectangles for now, and it will populate (with a RectShape) when the rect() command is called.

### Transformations
Transformations-related commands are: scale, rotate(radians), translate. For simplicity, `setTransform()` and `resetTransform()` are not implemented for now.

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

New transformations multiply on the left: T = T3 * T2 * T1.

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
        // Multiply: translation * current
        return translationMatrix.multiply(this);
    }
    
    scale(sx, sy) {
        // Create scale matrix
        const scaleMatrix = new TransformationMatrix();
        scaleMatrix.elements.set([
            sx, 0, 0,  // first column
            0, sy, 0,  // second column
            0, 0, 1    // third column
        ]);
        // Multiply: scale * current
        return scaleMatrix.multiply(this);
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
        // Multiply: rotation * current
        return rotationMatrix.multiply(this);
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

Whenever a "shape path" command (only used for clipping) is invoked, the current transformation matrix is used together with the coordinates in the command to determine the screen position of their fill used to update the tempClippingMask (see later).

strokeRect / fillRect also use the current transformation matrix to determine the screen position of the drawing, although these commands don't touch the clippingShapes list.

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
for now only rect, example:

    crispSwCtx.rect(20, 20, 150, 100);

These commands are only used for clip() as we don't support fill()/stroke(). I.e. if the user uses rect() for clipping, it will work as expected. If the user uses rect() with the intention of a following fill()/stroke() to fill/stroke the path, he/she will get an Error explaining the limitation at the time of invoking fill()/stroke(), and the workaround e.g. using fillRect/strokeRect.

These commands:
1. initialise the tempClippingMask if needed
2. add a 1-bit (i.e. no color, no transparency) screen-coordinate render of their fill on the tempClippingMask (i.e. OR the tempClippingMask with the 1-bit fill with the previous content)

Note that the clippingMask is not updated until the clip() command is invoked (see later).

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
fill() and stroke() throw an Error. This is because fill() stroke() on Canvas act on an arbitrary path overall, not on multiple shapes individually - for example multiple overlapping rectangles would be filled uniformly in the area of the union, and stroked as per the border of the union. While this could be implemented for fill() (using a 1-bit mask to represent the area of the union, similarly to what we do for the clippingMask), it would be rather hard to do for strokes, so we ditch the whole idea of generic paths and fill/stroke for simplicity/uniformity.
  
### Combined shape + paint commands
fillRect, strokeRect, clearRect. These are the only way to actually draw shapes. These DO NOT add a shape to the clippingShapes list, they by-pass it entirely and just immediately fill/stroke a shape (currently, a rectangle) in an aliased fashion (i.e. *not* anti-aliased) given the current clippingMask, transformation matrix, fill/stroke style and globalAlpha (which gets multiplied to the alphas specified in fill and stoke color).

    crispSwCtx.fillRect(20, 20, 150, 100); // crisp fill
    crispSwCtx.strokeRect(20.5, 20.5, 149, 99); // crisp stroke

clearRect clears the contents of the specified area (subject to current transform and clippingMask).

    crispSwCtx.clearRect(40, 40, 50, 50);

### Clipping

The clip() function
* takes the clippingMask and ANDs it with the tempClippingMask
* clears the tempClippingMask to all zeroes

The above allows the clip() commands to narrow the clippingMask. clippingMask is mutable i.e. will be updated in-place for efficiency, as there are no pointers to their specific states in time.

Just line the main buffer, the clippingMask and tempClippingMask don't handle anti-aliasing. In addition, they also don't handle alpha nor color and are unaffected by globalAlpha, so they can be implemented with a buffer of same width/height as the main buffer, but with 1-bit of depth, hence it's 32 times smaller than the main buffer.

#### ClippingMask basics

    class ClippingMask {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            // Each byte holds 8 pixels
            this.mask = new Uint8Array(Math.ceil((width * height) / 8));
        }
        
	    setPixel(x, y, value) {
	        const index = (y * this.width + x);
	        const byteIndex = Math.floor(index / 8);
	        const bitIndex = index % 8;
	        if (value) {
	            this.mask[byteIndex] |= (1 << bitIndex);
	        } else {
	            this.mask[byteIndex] &= ~(1 << bitIndex);
	        }
	    }

        clear(value) {
            this.mask.fill(value ? 0xFF  :  0x00);
        }
    }

##### Clipping of shapes with non-integer coordinates and/or transformed arbitrarily
- All clipping mask edges are aliased (binary, no partial coverage)
- The shapes clipping mask is computed after transformation
- Determining the mask of a shape (given its coordinates and linked transformation matrix), is just like the shape filling routine, just without colors and transparency. Both *do not* support anti-aliasing, regardless of the coordinates or transformations, and that edge pixels will be fully resolved to be masked/drawn by the low-level rendering routine. So even if a transformed shape results in sub-pixel positioning, it will still produce a mask that is aliased and fully opaque.
  
### Other functions

    crispSwCtx.blitToCanvas(canvas)

...paints the contents of the frame buffer to the given canvas, in a similar fashion to:

    new ImageData(frameBuffer, width, height); // Put the image data onto the canvas
    ctx.putImageData(imageData,  0,  0);

  
## Error Handling

### Error Types

CrispSwCanvas defines a set of custom error classes that extend the base Error class:

```javascript
class CrispSwCanvasError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CrispSwCanvasError';
    }
}

class InvalidStateError extends CrispSwCanvasError {
    constructor(message) {
        super(message);
        this.name = 'InvalidStateError';
    }
}

class UnsupportedOperationError extends CrispSwCanvasError {
    constructor(message) {
        super(message);
        this.name = 'UnsupportedOperationError';
    }
}

class InvalidArgumentError extends CrispSwCanvasError {
    constructor(message) {
        super(message);
        this.name = 'InvalidArgumentError';
    }
}
```

### Error Conditions and Messages

#### Context Creation
- **Invalid Context Type**
  - Condition: `getContext()` called with any value other than "2d"
  - Throws: `UnsupportedOperationError`
  - Message: `"CrispSwCanvas only supports '2d' context"`

#### State Operations
- **Invalid Restore**
  - Condition: `restore()` called with empty state stack
  - Throws: `InvalidStateError`
  - Message: `"Cannot restore() - state stack is empty"`

#### Color Handling
- **Invalid Color Format**
  - Condition: Color string doesn't match required format
  - Throws: `InvalidArgumentError`
  - Messages:
    - For invalid RGB: `"Invalid RGB format. Use 'rgb(r,g,b)' with values 0-255"`
    - For invalid RGBA: `"Invalid RGBA format. Use 'rgba(r,g,b,a)' with RGB 0-255 and alpha 0-1"`
    - For other formats: `"Unsupported color format. Use 'rgb(r,g,b)' or 'rgba(r,g,b,a)'"`

#### Path Operations
- **Unsupported Path Commands**
  - Condition: Using unsupported path commands
  - Throws: `UnsupportedOperationError`
  - Message: `"Path command '{command}' is not supported. Use rect() for clipping or dedicated fill/stroke methods"`

- **Invalid Path Usage**
  - Condition: Calling `fill()` or `stroke()`
  - Throws: `UnsupportedOperationError`
  - Messages:
    - For fill: `"fill() is not supported. Use fillRect() instead"`
    - For stroke: `"stroke() is not supported. Use strokeRect() instead"`

#### Transformation Operations
- **Invalid Transform Parameters**
  - Condition: Non-finite or NaN values in transformation methods
  - Throws: `InvalidArgumentError`
  - Message: `"Invalid transformation parameters: values must be finite numbers"`

#### Drawing Operations
- **Invalid Dimensions**
  - Condition: Negative or zero width/height in shape drawing methods
  - Throws: `InvalidArgumentError`
  - Message: `"Invalid dimensions: width and height must be positive numbers"`

- **Invalid Line Width**
  - Condition: Non-positive or non-finite lineWidth value
  - Throws: `InvalidArgumentError`
  - Message: `"Invalid lineWidth: must be a positive finite number"`

#### Canvas Operations
- **Invalid Canvas Parameter**
  - Condition: Invalid canvas passed to `blitToCanvas()`
  - Throws: `InvalidArgumentError`
  - Message: `"Invalid canvas element provided to blitToCanvas()"`

### Error Handling Guidelines

1. **Early Validation**
   - All parameters should be validated before any state changes occur
   - Type checking should be performed before any operations begin

2. **State Consistency**
   - If an error occurs during an operation, the canvas state should remain unchanged
   - Complex operations should validate all parameters before beginning execution

3. **Error Recovery**
   ```javascript
   try {
       // Backup relevant state
       const backupState = this._cloneCurrentState();
       
       // Perform operation
       this._performOperation();
   } catch (e) {
       // Restore state on error
       this._restoreState(backupState);
       throw e;
   }
   ```

4. **Error Information**
   - All errors should include:
     - Clear description of what went wrong
     - Expected format/range of values
     - Actual value that caused the error (when appropriate)
     - Suggested fix or alternative approach

### Example Usage

```javascript
// Example implementation of parameter validation
function validateRect(x, y, width, height) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        throw new InvalidArgumentError(
            `Invalid coordinates: (${x}, ${y}). Must be finite numbers`
        );
    }
    if (!Number.isFinite(width) || width <= 0) {
        throw new InvalidArgumentError(
            `Invalid width: ${width}. Must be a positive number`
        );
    }
    if (!Number.isFinite(height) || height <= 0) {
        throw new InvalidArgumentError(
            `Invalid height: ${height}. Must be a positive number`
        );
    }
}

// Example of color validation
function validateColor(color) {
    const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
    const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]\.?\d*)\s*\)$/i;
    
    if (!rgbRegex.test(color) && !rgbaRegex.test(color)) {
        throw new InvalidArgumentError(
            `Invalid color format: ${color}. Use 'rgb(r,g,b)' or 'rgba(r,g,b,a)'`
        );
    }
}
```

## Supporting code  

See below the graphic routines that CrispSwCanvas uses internally.

    const width = 600;
    const height = 600;
    const frameBuffer = new Uint8ClampedArray(width * height * 4);
    
    // Blending happens in sRGB space for performance reasons
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