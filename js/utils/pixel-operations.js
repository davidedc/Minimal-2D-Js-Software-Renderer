const width = 600;
const height = 600;
const frameBuffer = new Uint8ClampedArray(width * height * 4);

// Blending happens in sRGB space for performance reasons
function setPixel(x, y, r, g, b, a) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = (y * width + x) * 4;
  
  const alpha = a / 255;
  const oldAlpha = frameBuffer[index + 3] / 255;
  const newAlpha = alpha + oldAlpha * (1 - alpha);
  
  if (newAlpha > 0) {
    frameBuffer[index] = (r * alpha + frameBuffer[index] * oldAlpha * (1 - alpha)) / newAlpha;
    frameBuffer[index + 1] = (g * alpha + frameBuffer[index + 1] * oldAlpha * (1 - alpha)) / newAlpha;
    frameBuffer[index + 2] = (b * alpha + frameBuffer[index + 2] * oldAlpha * (1 - alpha)) / newAlpha;
    frameBuffer[index + 3] = newAlpha * 255;
  }
}