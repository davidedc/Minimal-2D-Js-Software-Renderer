#!/bin/bash

# Check if terser is installed
if ! command -v terser &> /dev/null && [ "$1" != "--no-minify" ]; then
    echo "Terser is not installed. To install it, run:"
    echo "npm install terser -g"
    echo ""
    echo "Alternatively, run this script with --no-minify to skip minification"
    exit 1
fi

# Create build directory if it doesn't exist
mkdir -p build

# Define the output files
CONCAT_FILE="build/crisp-sw-canvas.js"
MIN_FILE="build/crisp-sw-canvas.min.js"

# Concatenate all required JavaScript files
cat js/sw-renderer/SWRendererPixel.js \
    js/sw-renderer/SWRendererLine.js \
    js/sw-renderer/SWRendererRect.js \
    js/crisp-sw-canvas/color-utils.js \
    js/crisp-sw-canvas/transform-utils.js \
    js/crisp-sw-canvas/ContextState.js \
    js/crisp-sw-canvas/CrispSwCanvas.js \
    js/crisp-sw-canvas/CrispSwContext.js \
    js/crisp-sw-canvas/TransformationMatrix.js \
    js/utils/geometry.js > "$CONCAT_FILE"

echo "Created concatenated file: $CONCAT_FILE"

# Minify only if --no-minify is not specified
if [ "$1" != "--no-minify" ]; then
    terser "$CONCAT_FILE" -o "$MIN_FILE" -c -m
    echo "Created minified file: $MIN_FILE"
fi
