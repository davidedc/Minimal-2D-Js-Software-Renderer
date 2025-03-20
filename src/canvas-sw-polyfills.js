/**
 * Canvas polyfills to provide a consistent API
 * as CrispSwCanvas / CrispSwContext.
 */

// Helper function to convert color components to RGBA string
function colorToString(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
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
    CanvasRenderingContext2D.prototype.fillCircle = function(centerX, centerY, radius, fillR, fillG, fillB, fillA) {
        const originalFillStyle = this.fillStyle;
        
        this.beginPath();
        this.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.fillStyle = colorToString(fillR, fillG, fillB, fillA);
        this.fill();
        
        this.fillStyle = originalFillStyle;
    };
}

// Add strokeCircle to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.strokeCircle) {
    CanvasRenderingContext2D.prototype.strokeCircle = function(centerX, centerY, radius, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
        const originalStrokeStyle = this.strokeStyle;
        const originalLineWidth = this.lineWidth;
        
        this.beginPath();
        this.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.strokeStyle = colorToString(strokeR, strokeG, strokeB, strokeA);
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
    CanvasRenderingContext2D.prototype.fillAndStrokeCircle = function(
        centerX, centerY, radius,
        fillR, fillG, fillB, fillA,
        strokeWidth,
        strokeR, strokeG, strokeB, strokeA
    ) {
        const originalFillStyle = this.fillStyle;
        const originalStrokeStyle = this.strokeStyle;
        const originalLineWidth = this.lineWidth;
        
        this.beginPath();
        this.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        if (fillA > 0) {
            this.fillStyle = colorToString(fillR, fillG, fillB, fillA);
            this.fill();
        }
        
        if (strokeA > 0 && (strokeWidth === undefined || strokeWidth > 0)) {
            this.strokeStyle = colorToString(strokeR, strokeG, strokeB, strokeA);
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