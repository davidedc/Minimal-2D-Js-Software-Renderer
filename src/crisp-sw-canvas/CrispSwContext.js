// Check for Node.js environment and load polyfills if needed
const isNode = typeof window === 'undefined' && typeof process !== 'undefined';

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
        
        this.tempClippingMask = new Uint8Array(Math.ceil(canvas.width * canvas.height / 8)).fill(0);
        
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
        this.currentState.transform.reset();
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
    
    strokeLine(x1, y1, x2, y2) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        
        // Transform points according to current transformation matrix
        const start = transformPoint(x1, y1, state.transform.elements);
        const end = transformPoint(x2, y2, state.transform.elements);
        
        this.lineRenderer.drawLine({
            start: { x: start.tx, y: start.ty },
            end: { x: end.tx, y: end.ty },
            thickness: scaledLineWidth,
            color: state.strokeColor
        });
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
     * @param {number} fillR - Red component of fill color (0-255)
     * @param {number} fillG - Green component of fill color (0-255)
     * @param {number} fillB - Blue component of fill color (0-255)
     * @param {number} fillA - Alpha component of fill color (0-255)
     */
    fillCircle(centerX, centerY, radius, fillR, fillG, fillB, fillA) {
        const state = this.currentState;
        
        // Transform center point according to current transformation matrix
        const center = transformPoint(centerX, centerY, state.transform.elements);
        
        // Apply scale factor to radius
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        
        // Create shape object for the circle
        const circleShape = {
            center: { x: center.tx, y: center.ty },
            radius: scaledRadius,
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 }, // No stroke
            fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
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
     * @param {number} strokeR - Red component of stroke color (0-255)
     * @param {number} strokeG - Green component of stroke color (0-255)
     * @param {number} strokeB - Blue component of stroke color (0-255)
     * @param {number} strokeA - Alpha component of stroke color (0-255)
     */
    strokeCircle(centerX, centerY, radius, strokeWidth, strokeR, strokeG, strokeB, strokeA) {
        const state = this.currentState;
        
        // Transform center point according to current transformation matrix
        const center = transformPoint(centerX, centerY, state.transform.elements);
        
        // Apply scale factor to radius and stroke width
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = getScaledLineWidth(state.transform.elements, strokeWidth);
        
        // Create shape object for the circle
        const circleShape = {
            center: { x: center.tx, y: center.ty },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
            fillColor: { r: 0, g: 0, b: 0, a: 0 } // No fill
        };
        
        // Call the circle renderer with our shape
        this.circleRenderer.drawCircle(circleShape);
    }
    
    /**
     * Fill and stroke a circle with specified colors and stroke width
     * @param {number} centerX - X coordinate of the circle center
     * @param {number} centerY - Y coordinate of the circle center
     * @param {number} radius - Radius of the circle
     * @param {number} fillR - Red component of fill color (0-255)
     * @param {number} fillG - Green component of fill color (0-255)
     * @param {number} fillB - Blue component of fill color (0-255)
     * @param {number} fillA - Alpha component of fill color (0-255)
     * @param {number} strokeWidth - Width of the stroke
     * @param {number} strokeR - Red component of stroke color (0-255)
     * @param {number} strokeG - Green component of stroke color (0-255)
     * @param {number} strokeB - Blue component of stroke color (0-255)
     * @param {number} strokeA - Alpha component of stroke color (0-255)
     */
    fillAndStrokeCircle(
        centerX, centerY, radius,
        fillR, fillG, fillB, fillA,
        strokeWidth,
        strokeR, strokeG, strokeB, strokeA
    ) {
        const state = this.currentState;
        
        // Transform center point according to current transformation matrix
        const center = transformPoint(centerX, centerY, state.transform.elements);
        
        // Apply scale factor to radius and stroke width
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.max(scaleX, scaleY);
        const scaledStrokeWidth = getScaledLineWidth(state.transform.elements, strokeWidth);
        
        // Create shape object for the circle
        const circleShape = {
            center: { x: center.tx, y: center.ty },
            radius: scaledRadius,
            strokeWidth: scaledStrokeWidth,
            strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
            fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
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
        const centerTransformed = transformPoint(cx, cy, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);

        // This is a guess, SWRendererRoundedRect might not support clippingOnly directly
        // or might need a different shape structure for it.
        /*
        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
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
        const centerTransformed = transformPoint(cx, cy, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: state.fillColor, // Use state.fillColor directly
            strokeWidth: 0,
            strokeColor: { r: 0, g: 0, b: 0, a: 0 }
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
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const cx = x + width / 2;
        const cy = y + height / 2;
        const centerTransformed = transformPoint(cx, cy, state.transform.elements);
        const rotation = getRotationAngle(state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        this.roundedRectRenderer.drawRoundedRect({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            width: width * scaleX,
            height: height * scaleY,
            radius: scaledRadius,
            rotation: rotation,
            fillColor: { r: 0, g: 0, b: 0, a: 0 },
            strokeWidth: scaledLineWidth,
            strokeColor: state.strokeColor // Use state.strokeColor directly
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
            const centerTransformed = transformPoint(x, y, state.transform.elements);
            const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
            // For circles, radius is scaled by the max of scaleX and scaleY to maintain circularity
            // as we don't support ellipses yet.
            const scaledRadius = radius * Math.max(Math.abs(scaleX), Math.abs(scaleY));

            this.circleRenderer.drawCircle({
                center: { x: centerTransformed.tx, y: centerTransformed.ty },
                radius: scaledRadius,
                clippingOnly: true,
                // These are not used for clippingOnly, but provided for shape consistency
                // TODO: can these be omitted?
                strokeWidth: 0,
                strokeColor: { r: 0, g: 0, b: 0, a: 0 },
                fillColor: { r: 0, g: 0, b: 0, a: 0 }
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
        const centerTransformed = transformPoint(x, y, state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY)); 

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;
        
        // SWRendererArc.drawArc expects a shape with fillColor and strokeColor (alpha 0-255)
        // It internally handles fill and/or stroke based on these colors and strokeWidth.
        this.arcRenderer.drawArc({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise, // Pass to shape, SWRendererArc might use it or infer
            fillColor: state.fillColor, 
            strokeWidth: 0, // Explicitly no stroke for fillArc
            strokeColor: { r: 0, g: 0, b: 0, a: 0 }
        });
    }

    /**
     * Draws the stroke of an arc.
     * Angles are in radians.
     */
    outerStrokeArc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
        const state = this.currentState;
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const centerTransformed = transformPoint(x, y, state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));
        
        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        this.arcRenderer.drawArc({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
            radius: scaledRadius,
            startAngle: startAngleDeg,
            endAngle: endAngleDeg,
            anticlockwise: anticlockwise,
            fillColor: { r: 0, g: 0, b: 0, a: 0 }, // Explicitly no fill for outerStrokeArc
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
        const scaledLineWidth = getScaledLineWidth(state.transform.elements, state.lineWidth);
        const centerTransformed = transformPoint(x, y, state.transform.elements);
        const { scaleX, scaleY } = getScaleFactors(state.transform.elements);
        const scaledRadius = radius * Math.min(Math.abs(scaleX), Math.abs(scaleY));

        const startAngleDeg = startAngle * 180 / Math.PI;
        const endAngleDeg = endAngle * 180 / Math.PI;

        // SWRendererArc.drawArc handles both fill and stroke if both colors are opaque and strokeWidth > 0
        this.arcRenderer.drawArc({
            center: { x: centerTransformed.tx, y: centerTransformed.ty },
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
