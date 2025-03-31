class SWRendererPixel {
  constructor(frameBuffer, width, height, context) {
    this.frameBuffer = frameBuffer;
    this.width = width;
    this.height = height;
    // if context is null, then it means we are just using the primitives without the
    // whole context apparatus, so we create a placeholder object with the globalAlpha property
    // that we need for the blending calculations
    if (context) {
      this.context = context;
      this.tempClippingMask = context.tempClippingMask;
    } else {
      this.context = { globalAlpha: 1.0 };
    }
  }

  clipPixel(x, y) {
    // Convert to integer with bitwise OR
    x = x | 0;
    y = y | 0;
    
    // Cache width for performance
    const width = this.width;
    
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position
    const pixelPos = y * width + x;
    
    // Use bit shifting for division and modulo
    const byteIndex = pixelPos >> 3; // Faster than Math.floor(pixelPos / 8)
    const bitIndex = pixelPos & 7;   // Faster than pixelPos % 8
    
    // OR the bit in the tempClippingMask
    this.tempClippingMask[byteIndex] |= (1 << (7 - bitIndex));
  }

  // Blending happens in sRGB space for performance reasons
  setPixel(x, y, r, g, b, a) {
    // emit a warning if x or y are not integers
    if (false) {
      if (!Number.isInteger(x) || !Number.isInteger(y)) {
        console.warn(`setPixel called with non-integer coordinates: x=${x}, y=${y}`);
      }
    }
    // fix x and y to be integers using bitwise OR (faster than Math.round)
    x = x | 0;
    y = y | 0;
    
    // Cache frequently used constants
    const width = this.width;
    const globalAlpha = this.context.globalAlpha;
    
    // Early bounds check
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position (used multiple times)
    const pixelPos = y * width + x;
    const index = pixelPos * 4;
    
    // Check for clipping with optimized path
    if (this.context.currentState) {
      const clippingMask = this.context.currentState.clippingMask;
      const clippingMaskByteIndex = pixelPos >> 3; // Faster than Math.floor(pixelPos / 8)
      const bitIndex = pixelPos & 7; // Faster than pixelPos % 8
      
      // Quick check for common case (fully clipped byte)
      if (clippingMask[clippingMaskByteIndex] === 0) return;
      
      // Bit-level check only if needed
      if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) return;
    }
    
    // Batch alpha calculations to reduce divisions
    const incomingAlpha = (a / 255) * globalAlpha;
    const oldAlpha = this.frameBuffer[index + 3] / 255;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
    const newAlpha = incomingAlpha + oldAlphaScaled;
    
    // Avoid division if possible
    if (newAlpha <= 0) return;
    
    // Pre-calculate division factor once
    const blendFactor = 1 / newAlpha;
    
    // Apply color blending
    this.frameBuffer[index] = (r * incomingAlpha + this.frameBuffer[index] * oldAlphaScaled) * blendFactor;
    this.frameBuffer[index + 1] = (g * incomingAlpha + this.frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
    this.frameBuffer[index + 2] = (b * incomingAlpha + this.frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
    this.frameBuffer[index + 3] = newAlpha * 255;
  }

  clearPixel(x, y) {
    // Convert to integer with bitwise OR
    x = x | 0;
    y = y | 0;
    
    // Cache width for performance
    const width = this.width;
    
    if (x < 0 || x >= width || y < 0 || y >= this.height) return;
    
    // Pre-calculate pixel position
    const index = (y * width + x) * 4;
    
    // Set all pixel values to 0 
    this.frameBuffer[index] = 0;
    this.frameBuffer[index + 1] = 0;
    this.frameBuffer[index + 2] = 0;
    this.frameBuffer[index + 3] = 0;
  }

  /**
   * Set multiple horizontal pixel runs with the same color
   * @param {Array} runs - Array of [x, y, length] triplets
   * @param {Number} r - Red component (0-255)
   * @param {Number} g - Green component (0-255)
   * @param {Number} b - Blue component (0-255)
   * @param {Number} a - Alpha component (0-255)
   */
  setPixelRuns(runs, r, g, b, a) {
    // Cache frequently used constants
    const width = this.width;
    const height = this.height;
    const globalAlpha = this.context.globalAlpha;
    const hasClipping = this.context.currentState;
    const clippingMask = hasClipping ? this.context.currentState.clippingMask : null;
    
    // Batch alpha calculations 
    const incomingAlpha = (a / 255) * globalAlpha;
    const inverseIncomingAlpha = 1 - incomingAlpha;
    
    // Skip processing if fully transparent
    if (incomingAlpha <= 0) return;

    for (let i = 0; i < runs.length; i += 3) {
      // Get run parameters and convert to integers
      let x = runs[i] | 0;
      const y = runs[i+1] | 0;
      let length = runs[i+2] | 0;
      
      // Skip if y is out of bounds
      if (y < 0 || y >= height) continue;
      
      // Handle horizontal clipping
      if (x < 0) {
        length += x; // Reduce length by the amount x is negative
        x = 0;       // Start at left edge
        if (length <= 0) continue; // Skip if nothing to draw
      }
      
      // Clip to right edge
      if (x + length > width) {
        length = width - x;
        if (length <= 0) continue; // Skip if nothing to draw
      }
      
      // Calculate base position for this scanline
      let pixelPos = y * width + x;
      let index = pixelPos * 4;
      
      // Draw the run
      for (let j = 0; j < length; j++, pixelPos++, index += 4) {
        // Check clipping if needed
        if (hasClipping) {
          const clippingMaskByteIndex = pixelPos >> 3;
          
          // Quick check for fully clipped byte
          if (clippingMask[clippingMaskByteIndex] === 0) {
            // Skip to the end of this byte boundary
            const pixelsInThisByte = 8 - (pixelPos & 7);
            const pixelsToSkip = Math.min(pixelsInThisByte, length - j);
            j += pixelsToSkip - 1; // -1 because loop also increments j
            pixelPos += pixelsToSkip - 1;
            index += (pixelsToSkip - 1) * 4;
            continue;
          }
          
          // Bit-level check
          const bitIndex = pixelPos & 7;
          if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
            continue;
          }
        }
        
        // Get existing pixel alpha
        const oldAlpha = this.frameBuffer[index + 3] / 255;
        const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
        const newAlpha = incomingAlpha + oldAlphaScaled;
        
        // Skip fully transparent pixels
        if (newAlpha <= 0) continue;
        
        // Pre-calculate division factor once for this pixel
        const blendFactor = 1 / newAlpha;
        
        // Apply color blending
        this.frameBuffer[index] = (r * incomingAlpha + this.frameBuffer[index] * oldAlphaScaled) * blendFactor;
        this.frameBuffer[index + 1] = (g * incomingAlpha + this.frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
        this.frameBuffer[index + 2] = (b * incomingAlpha + this.frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
        this.frameBuffer[index + 3] = newAlpha * 255;
      }
    }
  }

  /**
   * Set pixel runs with fill and stroke colors in a single pass
   * @param {Number} startY - Starting Y coordinate
   * @param {Array} runs - Array of [xFill, fillLen, xStroke1, stroke1Len, xStroke2, stroke2Len] sextuplets
   * @param {Number} fillR - Fill red component (0-255)
   * @param {Number} fillG - Fill green component (0-255)
   * @param {Number} fillB - Fill blue component (0-255)
   * @param {Number} fillA - Fill alpha component (0-255)
   * @param {Number} strokeR - Stroke red component (0-255)
   * @param {Number} strokeG - Stroke green component (0-255)
   * @param {Number} strokeB - Stroke blue component (0-255)
   * @param {Number} strokeA - Stroke alpha component (0-255)
   */
  // Called by SWRendererCircle.drawFullCircleFastest
  // Not used. The idea was that in tha case we have both a stroke and a fill,
  // we could collect the runs for both, and then render them in a single batch operation that
  // scans the rows from top to bottom only once, for each line drawing the fill and then stroke
  // The hope was that although the number of set pixels doesn't change, this would be more cache-friendly
  // as it scans the lines sequentially only once (instead of twice), and therefore faster.
  // However, this was not faster than the other approach of doing first a pass for the fill,

  setPixelFillAndStrokeRuns(startY, runs, fillR, fillG, fillB, fillA, strokeR, strokeG, strokeB, strokeA) {
    // Cache frequently used constants
    startY += 2; // This offset seems specific to the caller (Circle) and shouldn't be here
    const width = this.width;
    const height = this.height;
    const frameBuffer = this.frameBuffer; // Cache framebuffer reference
    const globalAlpha = this.context.globalAlpha;
    const hasClipping = this.context.currentState;
    const clippingMask = hasClipping ? this.context.currentState.clippingMask : null;

    // Batch alpha calculations for fill
    const fillIncomingAlpha = (fillA / 255) * globalAlpha;
    const fillInverseIncomingAlpha = 1 - fillIncomingAlpha;
    // *** Opaque Optimization: Pre-calculate fill opacity flag ***
    const fillIsOpaque = fillIncomingAlpha >= 1.0;

    // Batch alpha calculations for stroke
    const strokeIncomingAlpha = (strokeA / 255) * globalAlpha;
    const strokeInverseIncomingAlpha = 1 - strokeIncomingAlpha;
    // *** Opaque Optimization: Pre-calculate stroke opacity flag ***
    const strokeIsOpaque = strokeIncomingAlpha >= 1.0;

    // Skip processing if both are fully transparent
    // Note: Even if opaque, alpha can be 0 if globalAlpha or base alpha is 0
    if (fillIncomingAlpha <= 0 && strokeIncomingAlpha <= 0) return;

    let y = startY; // Use original startY

    for (let i = 0; i < runs.length; i += 6) {
      // Skip if y is out of bounds
      if (y < 0 || y >= height) {
        y++;
        continue;
      }

      // Extract segment data
      // Use | 0 for potential float to integer conversion, though input should be int
      let xFill = runs[i] !== -1 ? runs[i] | 0 : -1;
      let fillLen = runs[i+1] !== -1 ? runs[i+1] | 0 : -1;
      let xStroke1 = runs[i+2] !== -1 ? runs[i+2] | 0 : -1;
      let stroke1Len = runs[i+3] !== -1 ? runs[i+3] | 0 : -1;
      let xStroke2 = runs[i+4] !== -1 ? runs[i+4] | 0 : -1;
      let stroke2Len = runs[i+5] !== -1 ? runs[i+5] | 0 : -1;

      // Process segments for this scanline
      const hasFill = xFill !== -1 && fillLen > 0 && fillIncomingAlpha > 0;
      const hasStroke1 = xStroke1 !== -1 && stroke1Len > 0 && strokeIncomingAlpha > 0;
      const hasStroke2 = xStroke2 !== -1 && stroke2Len > 0 && strokeIncomingAlpha > 0;

      // Skip if nothing to draw on this line
      if (!hasFill && !hasStroke1 && !hasStroke2) {
        y++;
        continue;
      }

      // Prepare for fill segment
      if (hasFill) {
        // Handle horizontal clipping for fill
        if (xFill < 0) {
          fillLen += xFill;
          xFill = 0;
        }
        // Clip to right edge
        if (xFill + fillLen > width) {
          fillLen = width - xFill;
        }
        // Skip if invalid after clipping
        if (fillLen <= 0) {
          // Ensure state reflects no fill for this line
          xFill = -1;
          fillLen = 0;
          // hasFill = false; // Not strictly needed as we re-check later, but cleaner
        }
      }

      // Prepare for stroke1 segment
      if (hasStroke1) {
        // Handle horizontal clipping for stroke1
        if (xStroke1 < 0) {
          stroke1Len += xStroke1;
          xStroke1 = 0;
        }
        // Clip to right edge
        if (xStroke1 + stroke1Len > width) {
          stroke1Len = width - xStroke1;
        }
        // Skip if invalid after clipping
        if (stroke1Len <= 0) {
          xStroke1 = -1;
          stroke1Len = 0;
          // hasStroke1 = false; // Cleaner
        }
      }

      // Prepare for stroke2 segment
      if (hasStroke2) {
        // Handle horizontal clipping for stroke2
        if (xStroke2 < 0) {
          stroke2Len += xStroke2;
          xStroke2 = 0;
        }
        // Clip to right edge
        if (xStroke2 + stroke2Len > width) {
          stroke2Len = width - xStroke2;
        }
        // Skip if invalid after clipping
        if (stroke2Len <= 0) {
          xStroke2 = -1;
          stroke2Len = 0;
          // hasStroke2 = false; // Cleaner
        }
      }

      // Process segments in order: fill, then stroke1, then stroke2
      for (let segmentType = 0; segmentType < 3; segmentType++) {
        // Select segment parameters based on type
        let x, length, r, g, b, incomingAlpha, inverseIncomingAlpha, isOpaque;

        // Segment type: 0 = fill, 1 = stroke1, 2 = stroke2
        if (segmentType === 0) {
           // Re-check hasFill and validity after clipping
          if (!hasFill || xFill === -1 || fillLen <= 0) continue;
          x = xFill;
          length = fillLen;
          r = fillR;
          g = fillG;
          b = fillB;
          incomingAlpha = fillIncomingAlpha;
          inverseIncomingAlpha = fillInverseIncomingAlpha;
          isOpaque = fillIsOpaque; // *** Use pre-calculated fill opacity flag ***
        } else if (segmentType === 1) {
          // Re-check hasStroke1 and validity after clipping
          if (!hasStroke1 || xStroke1 === -1 || stroke1Len <= 0) continue;
          x = xStroke1;
          length = stroke1Len;
          r = strokeR;
          g = strokeG;
          b = strokeB;
          incomingAlpha = strokeIncomingAlpha;
          inverseIncomingAlpha = strokeInverseIncomingAlpha;
          isOpaque = strokeIsOpaque; // *** Use pre-calculated stroke opacity flag ***
        } else { // segmentType === 2
          // Re-check hasStroke2 and validity after clipping
          if (!hasStroke2 || xStroke2 === -1 || stroke2Len <= 0) continue;
          x = xStroke2;
          length = stroke2Len;
          r = strokeR;
          g = strokeG;
          b = strokeB;
          incomingAlpha = strokeIncomingAlpha;
          inverseIncomingAlpha = strokeInverseIncomingAlpha;
          isOpaque = strokeIsOpaque; // *** Use pre-calculated stroke opacity flag ***
        }

        // Calculate base position for this segment
        let pixelPos = y * width + x;
        let index = pixelPos * 4;

        // Draw the run
        for (let j = 0; j < length; j++, pixelPos++, index += 4) {
          // Check clipping if needed
          if (hasClipping) {
            const clippingMaskByteIndex = pixelPos >> 3; // Calculate byte index

            // Check if byte index is potentially outside the mask bounds (shouldn't happen with y/x clipping)
            // Though adding a check might be safer depending on mask generation guarantees.
             if (clippingMaskByteIndex >= clippingMask.length) {
                 // This pixel is outside the drawable area defined by the mask dimensions
                 continue;
             }

            // Quick check for fully clipped byte
            if (clippingMask[clippingMaskByteIndex] === 0) {
              // Skip to the end of this byte boundary
              const pixelsInThisByte = 8 - (pixelPos & 7); // Pixels remaining in this byte
              const pixelsToSkip = Math.min(pixelsInThisByte, length - j); // Don't skip past the end of the run
              // Advance counters
              j += pixelsToSkip - 1; // -1 because loop also increments j
              pixelPos += pixelsToSkip - 1;
              index += (pixelsToSkip - 1) * 4;
              continue; // Continue to next iteration of inner loop
            }

            // Bit-level check if the byte wasn't fully clipped
            const bitIndex = pixelPos & 7; // 0-7
            // Check if the specific bit for this pixel is 0 (clipped)
            if ((clippingMask[clippingMaskByteIndex] & (1 << (7 - bitIndex))) === 0) {
              continue; // Skip this pixel
            }
          }

          // *** Opaque Optimization ***
          if (isOpaque) {
            // --- Opaque Path ---
            // No need to read destination, just write directly
            frameBuffer[index] = r;
            frameBuffer[index + 1] = g;
            frameBuffer[index + 2] = b;
            frameBuffer[index + 3] = 255; // Fully opaque destination alpha
          } else {
            // --- Blending Path (Original Logic) ---
            // Get existing pixel alpha
            const oldAlpha = frameBuffer[index + 3] / 255;
            const oldAlphaScaled = oldAlpha * inverseIncomingAlpha;
            const newAlpha = incomingAlpha + oldAlphaScaled;

            // Skip blending if resulting alpha is negligible (or zero)
            // Using a small epsilon might be slightly more robust than == 0 for floats
            if (newAlpha <= 0.00001) continue;

            // Pre-calculate division factor once for this pixel
            const blendFactor = 1 / newAlpha;

            // Apply color blending (Porter-Duff "source-over")
            frameBuffer[index] = (r * incomingAlpha + frameBuffer[index] * oldAlphaScaled) * blendFactor;
            frameBuffer[index + 1] = (g * incomingAlpha + frameBuffer[index + 1] * oldAlphaScaled) * blendFactor;
            frameBuffer[index + 2] = (b * incomingAlpha + frameBuffer[index + 2] * oldAlphaScaled) * blendFactor;
            frameBuffer[index + 3] = newAlpha * 255;
          }
        } // End inner pixel loop (j)
      } // End segment type loop

      y++; // Move to the next scanline
    } // End runs loop (i)
  } // End setPixelFillAndStrokeRuns

}