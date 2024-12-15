// TransformationMatrix class implementation
class TransformationMatrix {
    constructor() {
        this.elements = new Float64Array([
            1, 0, 0,  // first column
            0, 1, 0,  // second column
            0, 0, 1   // third column
        ]);
    }

    clone() {
        const clonedMatrix = new TransformationMatrix();
        clonedMatrix.elements.set(this.elements);
        return clonedMatrix;
    }

    get(row, col) {
        return this.elements[col * 3 + row];
    }

    set(row, col, value) {
        this.elements[col * 3 + row] = value;
    }

    multiply(other) {
        const result = new TransformationMatrix();
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                let sum = 0;
                for (let i = 0; i < 3; i++) {
                    sum += this.get(row, i) * other.get(i, col);
                }
                result.set(row, col, sum);
            }
        }
        return result;
    }

    translate(x, y) {
        const translationMatrix = new TransformationMatrix();
        translationMatrix.elements.set([
            1, 0, 0,
            0, 1, 0,
            x, y, 1
        ]);
        return this.multiply(translationMatrix);
    }

    scale(sx, sy) {
        const scaleMatrix = new TransformationMatrix();
        scaleMatrix.elements.set([
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        ]);
        return this.multiply(scaleMatrix);
    }

    rotate(angleInRadians) {
        const rotationMatrix = new TransformationMatrix();
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        rotationMatrix.elements.set([
            cos, sin, 0,
            -sin, cos, 0,
            0, 0, 1
        ]);
        return this.multiply(rotationMatrix);
    }
}

// Color parsing and normalization
function parseColor(colorStr) {
    colorStr = colorStr.replace(/\s+/g, '');
    
    const rgbMatch = colorStr.match(/^rgb\((\d+),(\d+),(\d+)\)$/i);
    const rgbaMatch = colorStr.match(/^rgba\((\d+),(\d+),(\d+),([0-9]*\.?[0-9]+)\)$/i);
    
    if (rgbMatch) {
        const [_, r, g, b] = rgbMatch;
        if (r > 255 || g > 255 || b > 255) {
            throw new Error("RGB values must be between 0-255");
        }
        return normalizeColor(+r, +g, +b, 1);
    } else if (rgbaMatch) {
        const [_, r, g, b, a] = rgbaMatch;
        if (r > 255 || g > 255 || b > 255) {
            throw new Error("RGB values must be between 0-255");
        }
        return normalizeColor(+r, +g, +b, +a);
    }
    throw new Error("Invalid color format");
}

function normalizeColor(r, g, b, a) {
    return {
        r: Math.round(Math.max(0, Math.min(255, r))),
        g: Math.round(Math.max(0, Math.min(255, g))),
        b: Math.round(Math.max(0, Math.min(255, b))),
        // the a must be now transformed to 0-255
        a: Math.max(0, Math.min(255, a * 255))
    };
}

// Helper function to get scaled line width
function getScaledLineWidth(matrix, baseWidth) {
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
    const scale = Math.max(Math.sqrt(scaleX * scaleY), 0.0001);
    return baseWidth * scale;
}

// Helper function to transform point
function transformPoint(x, y, matrix) {
    const tx = matrix[0] * x + matrix[3] * y + matrix[6];
    const ty = matrix[1] * x + matrix[4] * y + matrix[7];
    return { tx, ty };
}

// Add this helper function to extract rotation angle from transformation matrix
function getRotationAngle(matrix) {
    // For a 2D transformation matrix [a d 0, b e 0, c f 1],
    // the rotation angle can be extracted using atan2(-b, a)
    // matrix[3] is b, matrix[0] is a in column-major order
    return Math.atan2(-matrix[3], matrix[0]);
}

// Add this helper function to get scale factors from matrix
function getScaleFactors(matrix) {
    // For column-major [a d 0, b e 0, c f 1]
    // First column (x-axis): [a, d, 0]
    const scaleX = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    // Second column (y-axis): [b, e, 0]
    const scaleY = Math.sqrt(matrix[3] * matrix[3] + matrix[4] * matrix[4]);
    return { scaleX, scaleY };
}

// Main CrispSwCanvas class
class CrispSwCanvas {
    constructor(aWidth, aHeight) {
        this.width = aWidth;
        // set the global width to width too
        width = aWidth;
        this.height = aHeight;
        height = aHeight;
        frameBuffer = new Uint8ClampedArray(aWidth * aHeight * 4).fill(0);
        this.frameBuffer = frameBuffer;
    }

    getContext(contextType) {
        if (contextType !== "2d") {
            throw new Error("Only '2d' context is supported");
        }
        return new CrispSwContext(this);
    }

    blitToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(this.frameBuffer, this.width, this.height);
        ctx.putImageData(imageData, 0, 0);
    }
}

// Context state class
class ContextState {
    constructor() {
        this.lineWidth = 1;
        this.transform = new TransformationMatrix();
        this.strokeColor = { r: 0, g: 0, b: 0, a: 1 };
        this.fillColor = { r: 0, g: 0, b: 0, a: 1 };
    }

    clone() {
        const newState = new ContextState();
        newState.lineWidth = this.lineWidth;
        newState.transform = this.transform.clone();
        newState.strokeColor = { ...this.strokeColor };
        newState.fillColor = { ...this.fillColor };
        return newState;
    }
}

// Main context class
class CrispSwContext {
    constructor(canvas) {
        this.canvas = canvas;
        this.stateStack = [new ContextState()];
    }

    get currentState() {
        return this.stateStack[this.stateStack.length - 1];
    }

    save() {
        this.stateStack.push(this.currentState.clone());
    }

    restore() {
        if (this.stateStack.length <= 1) {
            throw new Error("Cannot restore() - stack is empty");
        }
        this.stateStack.pop();
    }

    // Transform methods
    scale(x, y) {
        this.currentState.transform = this.currentState.transform.scale(x, y);
    }

    rotate(angle) {
        this.currentState.transform = this.currentState.transform.rotate(angle);
    }

    translate(x, y) {
        this.currentState.transform = this.currentState.transform.translate(x, y);
    }

    // Style setters
    set fillStyle(style) {
        this.currentState.fillColor = parseColor(style);
    }

    set strokeStyle(style) {
        this.currentState.strokeColor = parseColor(style);
    }

    set lineWidth(width) {
        this.currentState.lineWidth = width;
    }

    // Drawing methods
    beginPath() {
        // Does nothing as per spec
    }

    fill() {
        throw new Error("fill() is not supported - use fillRect() instead");
    }

    stroke() {
        throw new Error("stroke() is not supported - use strokeRect() instead");
    }

    clearRect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width/2, y + height/2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        
        drawRectSW({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 },
            fillColor: { r: 255, g: 255, b: 255, a: 255 }  // TODO: this is not correct
        });
    }

    fillRect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width/2, y + height/2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        
        drawRectSW({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 },
            fillColor: state.fillColor
        });
    }

    strokeRect(x, y, width, height) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const center = transformPoint(x + width/2, y + height/2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        
        drawRectSW({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor,
            fillColor: { r: 0, g: 0, b: 0, a: 0 }
        });
    }
}