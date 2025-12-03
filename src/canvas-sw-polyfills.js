/**
 * Canvas polyfills to provide a consistent API
 * as CrispSwCanvas / CrispSwContext.
 */

// Helper function to convert Color object to RGBA string
function colorObjToString(color) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}

// Add strokeLine to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.strokeLine) {
    CanvasRenderingContext2D.prototype.strokeLine = function(x1, y1, x2, y2) {
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.stroke();
    };
}

// Add fillCircle to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.fillCircle) {
    CanvasRenderingContext2D.prototype.fillCircle = function(centerX, centerY, radius, fillColor) {
        const originalFillStyle = this.fillStyle;

        this.beginPath();
        this.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.fillStyle = colorObjToString(fillColor);
        this.fill();

        this.fillStyle = originalFillStyle;
    };
}

// Add strokeCircle to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.strokeCircle) {
    CanvasRenderingContext2D.prototype.strokeCircle = function(centerX, centerY, radius, strokeWidth, strokeColor) {
        const originalStrokeStyle = this.strokeStyle;
        const originalLineWidth = this.lineWidth;

        this.beginPath();
        this.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.strokeStyle = colorObjToString(strokeColor);
        if (strokeWidth !== undefined) {
            this.lineWidth = strokeWidth;
        }
        this.stroke();

        this.strokeStyle = originalStrokeStyle;
        if (strokeWidth !== undefined) {
            this.lineWidth = originalLineWidth;
        }
    };
}

// Add fillAndStrokeCircle to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.fillAndStrokeCircle) {
    CanvasRenderingContext2D.prototype.fillAndStrokeCircle = function(centerX, centerY, radius, fillColor, strokeWidth, strokeColor) {
        const originalFillStyle = this.fillStyle;
        const originalStrokeStyle = this.strokeStyle;
        const originalLineWidth = this.lineWidth;

        this.beginPath();
        this.arc(centerX, centerY, radius, 0, Math.PI * 2);

        if (fillColor.a > 0) {
            this.fillStyle = colorObjToString(fillColor);
            this.fill();
        }

        if (strokeColor.a > 0 && (strokeWidth === undefined || strokeWidth > 0)) {
            this.strokeStyle = colorObjToString(strokeColor);
            if (strokeWidth !== undefined) {
                this.lineWidth = strokeWidth;
            }
            this.stroke();
        }

        this.fillStyle = originalFillStyle;
        this.strokeStyle = originalStrokeStyle;
        if (strokeWidth !== undefined) {
            this.lineWidth = originalLineWidth;
        }
    };
}

// --- Rounded Rectangle Polyfills/Overrides ---

if (typeof CanvasRenderingContext2D.prototype.roundRect === 'undefined') {
    /**
     * Polyfill for CanvasRenderingContext2D.roundRect()
     * Adds a rounded rectangle path to the current path.
     * Assumes a single radius value for all corners for simplicity in this polyfill.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius for all corners.
     */
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        // this.beginPath(); // IMPORTANT: roundRect ADDS to the current path. Do not beginPath here.
        this.moveTo(x + radius, y);
        this.arcTo(x + width, y, x + width, y + height, radius);
        this.arcTo(x + width, y + height, x, y + height, radius);
        this.arcTo(x, y + height, x, y + radius, radius);
        this.arcTo(x, y, x + radius, y, radius);
        this.closePath();
    };
}

if (typeof CanvasRenderingContext2D.prototype.fillRoundRect === 'undefined') {
    /**
     * Draws a filled rounded rectangle directly.
     * This polyfill uses drawRoundedRectCanvas (assumed to be globally available).
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    CanvasRenderingContext2D.prototype.fillRoundRect = function(x, y, width, height, radius) {
        const shape = {
            center: { x: x + width / 2, y: y + height / 2 },
            width: width,
            height: height,
            radius: radius,
            rotation: 0, // Assuming no rotation for this direct method
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 },
            fillColor: parseColor(this.fillStyle) // parseColor needs to be available
        };
        // Assumes drawRoundedRectCanvas is loaded and available globally
        // TODO this should use some call to canvas.roundRect() instead of drawRoundedRectCanvas
        drawRoundedRectCanvas(this, shape); 
    };
}

if (typeof CanvasRenderingContext2D.prototype.strokeRoundRect === 'undefined') {
    /**
     * Draws the stroke of a rounded rectangle directly.
     * This polyfill uses drawRoundedRectCanvas (assumed to be globally available).
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    CanvasRenderingContext2D.prototype.strokeRoundRect = function(x, y, width, height, radius) {
        const shape = {
            center: { x: x + width / 2, y: y + height / 2 },
            width: width,
            height: height,
            radius: radius,
            rotation: 0, // Assuming no rotation for this direct method
            strokeWidth: this.lineWidth,
            strokeColor: parseColor(this.strokeStyle), // parseColor needs to be available
            fillColor: { r: 0, g: 0, b: 0, a: 0 }
        };
        // Assumes drawRoundedRectCanvas is loaded and available globally
        // TODO this should use some call to canvas.roundRect() instead of drawRoundedRectCanvas
        drawRoundedRectCanvas(this, shape); 
    };
}

// --- End Rounded Rectangle Polyfills/Overrides ---

// --- Arc Polyfills ---

if (typeof CanvasRenderingContext2D.prototype.fillArc === 'undefined') {
    /**
     * Polyfill to draw a filled arc (pie slice).
     * Angles are in radians, matching native ctx.arc().
     * @param {number} x The x-axis coordinate of the arc's center.
     * @param {number} y The y-axis coordinate of the arc's center.
     * @param {number} radius The arc's radius.
     * @param {number} startAngle The angle at which the arc starts, in radians.
     * @param {number} endAngle The angle at which the arc ends, in radians.
     * @param {boolean} [anticlockwise=false] Specifies whether the arc is drawn counter-clockwise.
     */
    CanvasRenderingContext2D.prototype.fillArc = function(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        this.beginPath();
        this.moveTo(x, y); // Center of the pie slice
        this.arc(x, y, radius, startAngle, endAngle, anticlockwise);
        this.closePath(); // Connects to center, forming the slice
        this.fill();
    };
}

if (typeof CanvasRenderingContext2D.prototype.outerStrokeArc === 'undefined') {
    /**
     * Polyfill to draw the stroke of an arc (outline only on the curved part).
     * Angles are in radians, matching native ctx.arc().
     * @param {number} x The x-axis coordinate of the arc's center.
     * @param {number} y The y-axis coordinate of the arc's center.
     * @param {number} radius The arc's radius.
     * @param {number} startAngle The angle at which the arc starts, in radians.
     * @param {number} endAngle The angle at which the arc ends, in radians.
     * @param {boolean} [anticlockwise=false] Specifies whether the arc is drawn counter-clockwise.
     */
    CanvasRenderingContext2D.prototype.outerStrokeArc = function(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        // For a normal arc stroke, we would do:
        //  this.beginPath();
        //  this.arc(x, y, radius, startAngle, endAngle, anticlockwise);
        //  this.stroke();

        this.beginPath();
        this.arc(x, y, radius, startAngle, endAngle, anticlockwise);
        this.lineWidth = this.lineWidth;
        this.strokeStyle = this.strokeStyle;
        this.stroke();
    };
}

if (typeof CanvasRenderingContext2D.prototype.fillAndOuterStrokeArc === 'undefined') {
    /**
     * Polyfill to draw a filled and partially stroked arc (pie slice with outline only on the curved part).
     * Angles are in radians, matching native ctx.arc().
     * @param {number} x The x-axis coordinate of the arc's center.
     * @param {number} y The y-axis coordinate of the arc's center.
     * @param {number} radius The arc's radius.
     * @param {number} startAngle The angle at which the arc starts, in radians.
     * @param {number} endAngle The angle at which the arc ends, in radians.
     * @param {boolean} [anticlockwise=false] Specifies whether the arc is drawn counter-clockwise.
     */
    CanvasRenderingContext2D.prototype.fillAndOuterStrokeArc = function(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        // For a normal arc stroke, we would do:
        //  this.beginPath();
        //  this.moveTo(x, y);
        //  this.arc(x, y, radius, startAngle, endAngle, anticlockwise);
        //  this.closePath();
        //  this.fill();
        //  this.stroke(); // Stroke after fill to ensure stroke is on top and not occluded by fill

        this.fillArc(x, y, radius, startAngle, endAngle, anticlockwise);
        this.outerStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise);
    };
}

// --- End Arc Polyfills ---