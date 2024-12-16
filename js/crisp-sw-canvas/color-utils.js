// Color parsing and normalization
function parseColor(colorStr) {
    colorStr = colorStr.replace(/\s+/g, '');

    const rgbMatch = colorStr.match(/^rgb\((\d+),(\d+),(\d+)\)$/i);
    const rgbaMatch = colorStr.match(/^rgba\((\d+),(\d+),(\d+),([0-9]*\.?[0-9]+)\)$/i);

    if (rgbMatch) {
        const [_, r, g, b] = rgbMatch;
        if (r > 255 || g > 255 || b > 255) {
            throw new Error("RGB values must be between 0-255");
        }
        return normalizeColor(+r, +g, +b, 1);
    } else if (rgbaMatch) {
        const [_, r, g, b, a] = rgbaMatch;
        if (r > 255 || g > 255 || b > 255) {
            throw new Error("RGB values must be between 0-255");
        }
        return normalizeColor(+r, +g, +b, +a);
    }
    throw new Error("Invalid color format");
}
function normalizeColor(r, g, b, a) {
    return {
        r: Math.round(Math.max(0, Math.min(255, r))),
        g: Math.round(Math.max(0, Math.min(255, g))),
        b: Math.round(Math.max(0, Math.min(255, b))),
        // the a must be now transformed to 0-255
        a: Math.max(0, Math.min(255, a * 255))
    };
}
