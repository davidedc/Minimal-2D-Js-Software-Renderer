/**
 * Represents the state of a CrispSwContext at a point in time.
 * Used for save() and restore() operations.
 */
class ContextState {
    constructor(canvasWidth, canvasHeight, lineWidth, transform, strokeColor, fillColor, globalAlpha, clippingMask) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.lineWidth = lineWidth || 1;
        this.transform = transform || new TransformationMatrix();
        this.strokeColor = strokeColor || { r: 0, g: 0, b: 0, a: 1 };
        this.fillColor = fillColor || { r: 0, g: 0, b: 0, a: 1 };
        this.globalAlpha = globalAlpha || 1.0;
        this.clippingMask = clippingMask || new Uint8Array(Math.ceil(canvasWidth * canvasHeight / 8)).fill(255);
    }

    clone() {
        const clippingMaskCopy = new Uint8Array(this.clippingMask);
        return new ContextState(
            this.canvasWidth, this.canvasHeight,
            this.lineWidth,
            this.transform.clone(),
            { ...this.strokeColor }, { ...this.fillColor },
            this.globalAlpha,
            clippingMaskCopy
        );

    }
}
