/**
 * Canvas polyfills to provide a consistent API
 * as CrispSwCanvas / CrispSwContext.
 */

// Add strokeLine to CanvasRenderingContext2D
if (!CanvasRenderingContext2D.prototype.strokeLine) {
    CanvasRenderingContext2D.prototype.strokeLine = function(x1, y1, x2, y2) {
        this.beginPath();
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
        this.stroke();
    };
}