/**
 * Color Bridge - API compatibility layer using Color and ColorParser classes
 *
 * This file provides backward-compatible functions that use the new ColorParser
 * while returning Color instances for deep integration throughout the rendering pipeline.
 */

// Global ColorParser instance (singleton pattern for caching benefits)
const _colorParser = new ColorParser();

/**
 * Parse a CSS color string into a Color instance
 * @param {string} colorStr - CSS color string (hex, rgb, rgba, named colors)
 * @returns {Color} Color instance
 * @throws {Error} If colorStr is not a string
 */
function parseColor(colorStr) {
    if (!colorStr || typeof colorStr !== 'string') {
        throw new Error("Invalid color format: must be a string");
    }

    // ColorParser.parse() returns {r, g, b, a} with all values 0-255
    const parsed = _colorParser.parse(colorStr);
    return new Color(parsed.r, parsed.g, parsed.b, parsed.a, false);
}

/**
 * Convert a Color instance or RGBA components to CSS rgba() string
 * @param {Color|object|number} colorOrR - Color instance, color object, or red component
 * @param {number} [g] - Green component (if first arg is number)
 * @param {number} [b] - Blue component (if first arg is number)
 * @param {number} [a] - Alpha component 0-255 (if first arg is number)
 * @returns {string} CSS rgba() string
 */
function colorToString(colorOrR, g, b, a) {
    if (colorOrR instanceof Color) {
        const alpha = (colorOrR.a / 255).toFixed(3).replace(/\.?0+$/, '');
        return `rgba(${colorOrR.r}, ${colorOrR.g}, ${colorOrR.b}, ${alpha})`;
    } else if (typeof colorOrR === 'object') {
        // Support plain {r, g, b, a} objects for backwards compatibility
        const alpha = (colorOrR.a / 255).toFixed(3).replace(/\.?0+$/, '');
        return `rgba(${colorOrR.r}, ${colorOrR.g}, ${colorOrR.b}, ${alpha})`;
    } else {
        const alpha = (a / 255).toFixed(3).replace(/\.?0+$/, '');
        return `rgba(${colorOrR}, ${g}, ${b}, ${alpha})`;
    }
}

/**
 * Clear the color parser cache (useful for memory management in long-running apps)
 */
function clearColorCache() {
    _colorParser.clearCache();
}
