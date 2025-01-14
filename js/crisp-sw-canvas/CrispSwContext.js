class CrispSwContext {
    constructor(canvas) {
        this.canvas = canvas;
        this.stateStack = [new ContextState(canvas.width, canvas.height)];
        this.frameBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(0);
        this.tempClippingMask = new Uint8Array(Math.ceil(canvas.width * canvas.height / 8)).fill(0);
        this.pixelRenderer = new SWRendererPixel(this.frameBuffer, canvas.width, canvas.height, this);
        this.lineRenderer = new SWRendererLine(this.pixelRenderer);
        this.rectRenderer = new SWRendererRect(this.frameBuffer, canvas.width, canvas.height, this.lineRenderer, this.pixelRenderer);
        //this.roundedRectRenderer = new SWRendererRoundedRect(this.frameBuffer, canvas.width, canvas.height, this.lineRenderer, this.pixelRenderer);
        //this.circleRenderer = new SWRendererCircle(this.pixelRenderer);
        //this.arcRenderer = new SWRendererArc(this.pixelRenderer);
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

    // Add globalAlpha property
    set globalAlpha(value) {
        this.currentState.globalAlpha = Math.max(0, Math.min(1, value)); // Clamp between 0 and 1
    }

    get globalAlpha() {
        return this.currentState.globalAlpha;
    }

    // Drawing methods
    beginPath() {
        this.tempClippingMask.fill(0);
    }

    fill() {
        throw new Error("fill() is not supported - use fillRect() instead");
    }

    stroke() {
        throw new Error("stroke() is not supported - use strokeRect() instead");
    }

    clearRect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        this.rectRenderer.clearRect({
            center: { x: center.tx, y: center.ty },
            width: width,
            height: height,
            rotation: rotation
        });
    }

    // as the CrispSwCanvas does not support paths and fill() annd stroke() are not supported,
    // rect() is used for clipping only.
    rect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        this.rectRenderer.drawRect({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: true
        });
    }

    // The clip() function
    // * takes the clippingMask and ANDs it with the tempClippingMask
    // * clears the tempClippingMask to all zeroes
    clip() {
        // to a logical and of the current clippingMask and the tempClippingMask
        // a little bit of bitwise magic like this:
        // this.currentState.clippingMask = this.currentState.clippingMask && this.tempClippingMask;
        // but we need to do it for each byte
        for (let i = 0; i < this.currentState.clippingMask.length; i++) {
            this.currentState.clippingMask[i] = this.currentState.clippingMask[i] & this.tempClippingMask[i];
        }
        // clip() does not close the path, so since we might add more rects to the paths, we cannot clear the tempClippingMask
        // can't do this: this.tempClippingMask.fill(0);
    }


    fillRect(x, y, width, height) {
        const state = this.currentState;
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        this.rectRenderer.drawRect({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 },
            fillColor: state.fillColor
        });
    }

    strokeRect(x, y, width, height) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        this.rectRenderer.drawRect({
            center: { x: center.tx, y: center.ty },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor,
            fillColor: { r: 0, g: 0, b: 0, a: 0 }
        });
    }

    blitToCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(this.frameBuffer, this.canvas.width, this.canvas.height);
        ctx.putImageData(imageData, 0, 0);
    }
}
