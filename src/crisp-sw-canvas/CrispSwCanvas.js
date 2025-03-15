// Main CrispSwCanvas class
class CrispSwCanvas {
    static version = '1.0.2';

    constructor(width, height) {
        // Support both (width, height) and (canvas) constructor styles
        if (typeof width === 'object') {
            const canvas = width;
            this.width = canvas.width;
            this.height = canvas.height;
            this.title = canvas.title || '';
        } else {
            this.width = width;
            this.height = height;
            this.title = '';
        }
        
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
