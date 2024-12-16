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
