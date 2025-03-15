// Color parsing and normalization
function parseColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') {
        throw new Error("Invalid color format: must be a string");
    }
    
    colorStr = colorStr.trim().replace(/\s+/g, '');

    // Handle hex colors
    if (colorStr.startsWith('#')) {
        let r, g, b;
        
        if (colorStr.length === 4) {
            // #RGB format
            r = parseInt(colorStr[1] + colorStr[1], 16);
            g = parseInt(colorStr[2] + colorStr[2], 16);
            b = parseInt(colorStr[3] + colorStr[3], 16);
            return normalizeColor(r, g, b, 1);
        } else if (colorStr.length === 7) {
            // #RRGGBB format
            r = parseInt(colorStr.substring(1, 3), 16);
            g = parseInt(colorStr.substring(3, 5), 16);
            b = parseInt(colorStr.substring(5, 7), 16);
            return normalizeColor(r, g, b, 1);
        }
    }

    // Handle rgb/rgba formats
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
    
    throw new Error(`Invalid color format: ${colorStr}`);
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

function colorToString(colorOrR, g, b, a) {
    // if a color object is passed, convert it to a string
    // like `rgba(${color.r}, ${color.g}, ${color.b}, ${(color.a/255).toFixed(3)})`;
    // otherwise, if the four r,g,b,a parameters are passed, convert them to a string
    // like `rgba(${r}, ${g}, ${b}, ${(a/255).toFixed(3)})`;
    // Note that 3 decimal places should be enough, because the alpha is still 8 bits anyways
    // and 1/255 is the smallest increment for the alpha channel and that is 0.003921....
    // the .replace(/\.?0+$/, '') removes any trailing zeros so that we don't have things like "1.000"
    if (typeof colorOrR === 'object') {
        return `rgba(${colorOrR.r}, ${colorOrR.g}, ${colorOrR.b}, ${(colorOrR.a/255).toFixed(3).replace(/\.?0+$/, '')})`;
    } else {
        return `rgba(${colorOrR}, ${g}, ${b}, ${(a/255).toFixed(3).replace(/\.?0+$/, '')})`;
    }
}