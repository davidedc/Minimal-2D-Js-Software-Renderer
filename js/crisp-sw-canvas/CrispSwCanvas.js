// Main CrispSwCanvas class
class CrispSwCanvas {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // Create the context immediately and store it privately
        this._context = new CrispSwContext(this);
    }

    getContext(contextType) {
        if (contextType !== "2d") {
            throw new Error("Only '2d' context is supported");
        }
        return this._context;
    }
}
