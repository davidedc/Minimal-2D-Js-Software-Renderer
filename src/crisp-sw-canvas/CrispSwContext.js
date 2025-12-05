// Check for Node.js environment and load polyfills if needed
const isNode = typeof window === 'undefined' && typeof process !== 'undefined';

// Global ColorParser instance for parsing CSS color strings
const _colorParser = new ColorParser();

/**
 * Software-based Canvas 2D rendering context
 * This provides a subset of the CanvasRenderingContext2D API that runs
 * entirely in JavaScript without requiring the HTML5 Canvas API.
 */
class CrispSwContext {
    constructor(canvas) {
        // Store reference to the canvas element
        this.canvas = canvas;
        
        // Ensure canvas has all required properties
        if (!canvas.title) {
            canvas.title = '';
        }
        
        // Create additional compatibility properties for RenderChecks
        // Different parts of the code base might access these properties in different ways
        this.displayCanvas = {
            width: canvas.width,
            height: canvas.height,
            title: canvas.title
        };
        
        // Add title directly to context for maximum compatibility
        // Some code might expect ctx.title instead of ctx.canvas.title
        this.title = canvas.title;
        
        // Initialize the context state
        this.stateStack = [new ContextState(canvas.width, canvas.height)];
        
        // Create the frameBuffer and two views for it
        this.frameBufferUint8ClampedView = new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(0);
        // this view show optimise for when we deal with pixel values all together rather than r,g,b,a separately
        this.frameBufferUint32View = new Uint32Array(this.frameBufferUint8ClampedView.buffer);
        
        // Temporary clip mask for path recording (starts clipped)
        this.tempClipMask = new ClipMask(canvas.width, canvas.height);
        this.tempClipMask.clipAll();
        this.tempClippingMask = this.tempClipMask.buffer;
        
        // Initialize renderers
        this.pixelRenderer = new SWRendererPixel(this.frameBufferUint8ClampedView, this.frameBufferUint32View, canvas.width, canvas.height, this);
        this.lineRenderer = new SWRendererLine(this.pixelRenderer);
        this.rectRenderer = new SWRendererRect(this.frameBufferUint8ClampedView, this.frameBufferUint32View, canvas.width, canvas.height, this.lineRenderer, this.pixelRenderer);
        this.roundedRectRenderer = new SWRendererRoundedRect(this.frameBufferUint8ClampedView, this.frameBufferUint32View, canvas.width, canvas.height, this.lineRenderer, this.pixelRenderer, this.rectRenderer);
        this.circleRenderer = new SWRendererCircle(this.pixelRenderer);
        this.arcRenderer = new SWRendererArc(this.pixelRenderer);
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
    
    /**
     * Resets the current transformation matrix to the identity matrix
     */
    resetTransform() {
        this.currentState.transform = new Transform2D();
    }

    // Style setters and getters
    set fillStyle(style) {
        this.currentState.fillColor = Color.fromCSS(style, _colorParser);
    }

    get fillStyle() {
        return this.currentState.fillColor.toCSS();
    }

    set strokeStyle(style) {
        this.currentState.strokeColor = Color.fromCSS(style, _colorParser);
    }

    get strokeStyle() {
        return this.currentState.strokeColor.toCSS();
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
        this.tempClipMask.clipAll();
    }

    fill() {
        throw new Error("fill() is not supported - use fillRect() instead");
    }

    stroke() {
        throw new Error("stroke() is not supported - use strokeRect() instead");
    }
    
    strokeLine(x1, y1, x2, y2) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);

        // Transform points according to current transformation matrix
        const start = state.transform.transformPoint({x: x1, y: y1});
        const end = state.transform.transformPoint({x: x2, y: y2});

        this.lineRenderer.drawLine({
            start: { x: start.x, y: start.y },
            end: { x: end.x, y: end.y },
            thickness: scaledLineWidth,
            color: state.strokeColor
        });
    }

    clearRect(x, y, width, height) {
        const state = this.currentState;
        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        this.rectRenderer.clearRect({
            center: { x: center.x, y: center.y },
            width: width,
            height: height,
            rotation: rotation
        });
    }

    // as the CrispSwCanvas does not support paths and fill() annd stroke() are not supported,
    // rect() is used for clipping only.
    rect(x, y, width, height) {
        const state = this.currentState;
        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        this.rectRenderer.drawRect({
            center: { x: center.x, y: center.y },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: true
        });
    }

    // The clip() function ANDs the current clippingMask with the tempClippingMask
    clip() {
        this.currentState.clipMask.intersectWith(this.tempClipMask);
        // clip() does not close the path, so we cannot clear the tempClipMask
    }


    fillRect(x, y, width, height) {
        const state = this.currentState;
        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        this.rectRenderer.drawRect({
            center: { x: center.x, y: center.y },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: 0,
            strokeColor: Color.transparent,
            fillColor: state.fillColor
        });
    }

    strokeRect(x, y, width, height) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);

        const center = state.transform.transformPoint({x: x + width / 2, y: y + height / 2});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        this.rectRenderer.drawRect({
            center: { x: center.x, y: center.y },
            width: width * scaleX,
            height: height * scaleY,
            rotation: rotation,
            clippingOnly: false,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor,
            fillColor: Color.transparent
        });
    }

    blitToCanvas(canvas) {
        if (isNode) return;

        const imageData = new ImageData(this.frameBufferUint8ClampedView, this.canvas.width, this.canvas.height);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Fill a circle with the specified color
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {Color} fillColor - Fill color as a Color instance
     */
    fillCircle(centerX, centerY, radius, fillColor) {
        const state = this.currentState;

        // Transform center point according to current transformation matrix
        const center = state.transform.transformPoint({x: centerX, y: centerY});

        // Apply scale factor to radius
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.max(scaleX, scaleY);

        // Create shape object for the circle
        const circleShape = {
            center: { x: center.x, y: center.y },
            radius: scaledRadius,
            strokeWidth: 0,
            strokeColor: Color.transparent,
            fillColor: fillColor
        };

        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }
    
    /**
     * Stroke a circle with the specified color and width
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {number} strokeWidth - Width of the stroke
     * @param {Color} strokeColor - Stroke color as a Color instance
     */
    strokeCircle(centerX, centerY, radius, strokeWidth, strokeColor) {
        const state = this.currentState;

        // Transform center point according to current transformation matrix
        const center = state.transform.transformPoint({x: centerX, y: centerY});

        // Apply scale factor to radius and stroke width
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = state.transform.getScaledLineWidth(strokeWidth);

        // Create shape object for the circle
        const circleShape = {
            center: { x: center.x, y: center.y },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: strokeColor,
            fillColor: Color.transparent
        };

        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }
    
    /**
     * Fill and stroke a circle with specified colors and stroke width
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {Color} fillColor - Fill color as a Color instance
     * @param {number} strokeWidth - Width of the stroke
     * @param {Color} strokeColor - Stroke color as a Color instance
     */
    fillAndStrokeCircle(centerX, centerY, radius, fillColor, strokeWidth, strokeColor) {
        const state = this.currentState;

        // Transform center point according to current transformation matrix
        const center = state.transform.transformPoint({x: centerX, y: centerY});

        // Apply scale factor to radius and stroke width
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = state.transform.getScaledLineWidth(strokeWidth);

        // Create shape object for the circle
        const circleShape = {
            center: { x: center.x, y: center.y },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: strokeColor,
            fillColor: fillColor
        };

        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }

    /**
     * Returns an ImageData object representing the pixel data for the specified rectangle.
     * Compatible with HTML5 Canvas getImageData method.
     * @param {number} sx - The x-coordinate of the top-left corner of the rectangle from which the data will be extracted
     * @param {number} sy - The y-coordinate of the top-left corner of the rectangle from which the data will be extracted
     * @param {number} sw - The width of the rectangle from which the data will be extracted
     * @param {number} sh - The height of the rectangle from which the data will be extracted
     * @returns {ImageData} An ImageData object containing the image data for the specified rectangle
     */
    getImageData(sx, sy, sw, sh) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Ensure parameters are within bounds
        sx = Math.max(0, Math.min(Math.floor(sx), canvasWidth));
        sy = Math.max(0, Math.min(Math.floor(sy), canvasHeight));
        sw = Math.max(0, Math.min(Math.floor(sw), canvasWidth - sx));
        sh = Math.max(0, Math.min(Math.floor(sh), canvasHeight - sy));
        
        // Create a new buffer for the extracted data
        const extractedData = new Uint8ClampedArray(sw * sh * 4);
        
        // If the requested area is the entire canvas, we can just return a copy of the frameBufferUint8ClampedView
        if (sx === 0 && sy === 0 && sw === canvasWidth && sh === canvasHeight) {
            extractedData.set(this.frameBufferUint8ClampedView);
        } else {
            // Copy pixel data from the frameBufferUint8ClampedView to the new buffer
            for (let y = 0; y < sh; y++) {
                for (let x = 0; x < sw; x++) {
                    const srcIdx = ((sy + y) * canvasWidth + (sx + x)) * 4;
                    const destIdx = (y * sw + x) * 4;
                    
                    extractedData[destIdx] = this.frameBufferUint8ClampedView[srcIdx];         // R
                    extractedData[destIdx + 1] = this.frameBufferUint8ClampedView[srcIdx + 1]; // G
                    extractedData[destIdx + 2] = this.frameBufferUint8ClampedView[srcIdx + 2]; // B
                    extractedData[destIdx + 3] = this.frameBufferUint8ClampedView[srcIdx + 3]; // A
                }
            }
        }
        
        // Return a new ImageData object with canvas info for RenderChecks compatibility
        const imageData = new ImageData(extractedData, sw, sh);
        
        // Add extra properties that some check routines might expect
        if (typeof imageData.canvasTitle === 'undefined') {
            Object.defineProperty(imageData, 'canvasTitle', {
                get: () => this.canvas.title || this.title || '',
                configurable: true
            });
        }
        
        return imageData;
    }
    
    // --- Rounded Rectangle Methods ---

    /**
     * Defines a rounded rectangle path.
     * NOTE: In this software renderer, direct path definition for later fill/stroke is complex
     * due to current fill()/stroke() limitations. This method currently does not build a path
     * in the same way as native canvas. For drawing, use fillRoundRect or strokeRoundRect.
     * It could be used for clipping if the renderer supports it.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    roundRect(x, y, width, height, radius) {
        // TODO: Implement path definition for clipping or general path store if fill()/stroke() are enhanced.
        // For now, this method might not do much or could be used for clipping.
        // console.warn("CrispSwContext.roundRect() for path definition is not fully implemented for fill/stroke. Use fillRoundRect/strokeRoundRect for drawing.");
        // Placeholder for potential clipping path definition:
        const state = this.currentState;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = state.transform.transformPoint({x: cx, y: cy});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;

        // This is a guess, SWRendererRoundedRect might not support clippingOnly directly
        // or might need a different shape structure for it.
        /*
        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            width: width * scaleX,
            height: height * scaleY,
            radius: radius * Math.min(scaleX, scaleY), // Simplistic radius scaling
            rotation: rotation,
            clippingOnly: true, // Hypothetical
            strokeWidth: 0,
            fillColor: {r:0,g:0,b:0,a:0},
            strokeColor: {r:0,g:0,b:0,a:0}
        });
        */
        // As rect() is used for clipping, this could be an extension point if SWRendererRoundedRect supports it.
         throw new Error("CrispSwContext.roundRect() for path definition / clipping is not yet implemented.");
    }

    /**
     * Draws a filled rounded rectangle.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    fillRoundRect(x, y, width, height, radius) {
        const state = this.currentState;
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = state.transform.transformPoint({x: cx, y: cy});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: state.fillColor,
            strokeWidth: 0,
            strokeColor: Color.transparent
        });
    }

    /**
     * Draws the stroke of a rounded rectangle.
     * @param {number} x The x-axis coordinate of the rectangle's starting point.
     * @param {number} y The y-axis coordinate of the rectangle's starting point.
     * @param {number} width The rectangle's width.
     * @param {number} height The rectangle's height.
     * @param {number} radius The radius of the corners.
     */
    strokeRoundRect(x, y, width, height, radius) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = state.transform.transformPoint({x: cx, y: cy});
        const rotation = state.transform.rotationAngle;
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: Color.transparent,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    // --- End Rounded Rectangle Methods ---

    // --- Arc Methods ---

    /**
     * Adds an arc to the current path (for potential clipping or future path system).
     * Angles are in radians.
     * NOTE: Currently, this method is a stub and does not build a persistent path for fill/stroke
     * due to limitations in the generic fill()/stroke() methods of CrispSwContext.
     * For drawing, use fillArc, outerStrokeArc, or fillAndOuterStrokeArc.
     */
    arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        // TODO: Implement path definition for clipping if SWRendererArc supports it,
        // or for a general path store if fill()/stroke() are enhanced.
        // For now, only full circles are supported for clipping.
        const isFullCircle = Math.abs(Math.abs(endAngle - startAngle) - (2 * Math.PI)) < 1e-9; // Check for 2PI difference

        if (isFullCircle) {
            const state = this.currentState;
            const centerTransformed = state.transform.transformPoint({x, y});
            const scaleX = state.transform.scaleX;
            const scaleY = state.transform.scaleY;
            // For circles, radius is scaled by the max of scaleX and scaleY to maintain circularity
            // as we don't support ellipses yet.
            const scaledRadius = radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));

            this.circleRenderer.drawCircle({
                center: { x: centerTransformed.x, y: centerTransformed.y },
                radius: scaledRadius,
                clippingOnly: true,
                // These are not used for clippingOnly, but provided for shape consistency
                strokeWidth: 0,
                strokeColor: Color.transparent,
                fillColor: Color.transparent
            });
        } else {
            throw new Error("CrispSwContext.arc() for path definition/clipping is only implemented for full circles. Use fillArc/outerStrokeArc for drawing partial arcs.");
        }
    }

    /**
     * Draws a filled arc (pie slice).
     * Angles are in radians.
     */
    fillArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const centerTransformed = state.transform.transformPoint({x, y});
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        // SWRendererArc.drawArc expects a shape with fillColor and strokeColor (alpha 0-255)
        // It internally handles fill and/or stroke based on these colors and strokeWidth.
        this.arcRenderer.drawArc({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: state.fillColor,
            strokeWidth: 0,
            strokeColor: Color.transparent
        });
    }

    /**
     * Draws the stroke of an arc.
     * Angles are in radians.
     */
    outerStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);
        const centerTransformed = state.transform.transformPoint({x, y});
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        this.arcRenderer.drawArc({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: Color.transparent,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    /**
     * Draws a filled and stroked arc.
     * Angles are in radians.
     */
    fillAndOuterStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = state.transform.getScaledLineWidth(state.lineWidth);
        const centerTransformed = state.transform.transformPoint({x, y});
        const scaleX = state.transform.scaleX;
        const scaleY = state.transform.scaleY;
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        // SWRendererArc.drawArc handles both fill and stroke if both colors are opaque and strokeWidth > 0
        this.arcRenderer.drawArc({
            center: { x: centerTransformed.x, y: centerTransformed.y },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: state.fillColor,
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor
        });
    }

    // --- End Arc Methods ---
}
