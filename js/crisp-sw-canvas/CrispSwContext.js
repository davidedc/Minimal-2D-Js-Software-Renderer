class CrispSwContext {
    constructor(canvas) {
        this.canvas = canvas;
        this.stateStack = [new ContextState()];
        this.frameBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(0);
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
        const center = transformPoint(x + width / 2, y + height / 2, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        this.rectRenderer.clearRect({
            center: { x: center.tx, y: center.ty },
            width: width,
            height: height,
            rotation: rotation
        });
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
