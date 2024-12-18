// Main CrispSwCanvas class
class CrispSwCanvas {
    constructor(aWidth, aHeight) {
        this.width = aWidth;
        // set the global width to width too
        width = aWidth;
        this.height = aHeight;
        height = aHeight;
        
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
