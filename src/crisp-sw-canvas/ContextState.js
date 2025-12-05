/**
 * Represents the state of a CrispSwContext at a point in time.
 * Used for save() and restore() operations.
 */
class ContextState {
    constructor(canvasWidth, canvasHeight, lineWidth, transform, strokeColor, fillColor, globalAlpha, clippingMask) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.lineWidth = lineWidth || 1;
        this.transform = transform || new Transform2D();
        // Store Color instances (default: opaque black)
        this.strokeColor = strokeColor || Color.black;
        this.fillColor = fillColor || Color.black;
        this.globalAlpha = globalAlpha || 1.0;
        // ClipMask (defaults to all visible)
        this.clipMask = clippingMask || new ClipMask(canvasWidth, canvasHeight);
        // Direct buffer access for hot loops
        this.clippingMask = this.clipMask.buffer;
    }

    clone() {
        return new ContextState(
            this.canvasWidth, this.canvasHeight,
            this.lineWidth,
            this.transform,  // Transform2D is immutable - safe to share reference
            // Color is immutable - can reuse same instance
            this.strokeColor, this.fillColor,
            this.globalAlpha,
            this.clipMask.clone()
        );
    }
}
