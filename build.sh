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

# Extract version from CrispSwCanvas.js
VERSION=$(grep "static version = '" js/crisp-sw-canvas/CrispSwCanvas.js | sed "s/.*version = '\([^']*\)'.*/\1/")
if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from CrispSwCanvas.js"
    exit 1
fi

# Define the output files
CONCAT_FILE="build/crisp-sw-canvas-v$VERSION.js"
MIN_FILE="build/crisp-sw-canvas-v$VERSION.min.js"

# Create version comment
VERSION_COMMENT="/* CrispSwCanvas v$VERSION */"

# Concatenate all required JavaScript files with version comment
echo "$VERSION_COMMENT" > "$CONCAT_FILE"
cat js/sw-renderer/SWRendererPixel.js \
    js/sw-renderer/SWRendererLine.js \
    js/sw-renderer/SWRendererRect.js \
    js/crisp-sw-canvas/color-utils.js \
    js/crisp-sw-canvas/transform-utils.js \
    js/crisp-sw-canvas/ContextState.js \
    js/crisp-sw-canvas/CrispSwCanvas.js \
    js/crisp-sw-canvas/CrispSwContext.js \
    js/crisp-sw-canvas/TransformationMatrix.js \
    js/utils/geometry.js >> "$CONCAT_FILE"

echo "Created concatenated file: $CONCAT_FILE"

# Minify only if --no-minify is not specified
if [ "$1" != "--no-minify" ]; then
    # Add version comment to minified file and preserve it during minification
    echo "$VERSION_COMMENT" > "$MIN_FILE"
    terser "$CONCAT_FILE" -o "$MIN_FILE" --comments "/CrispSwCanvas v/" -c -m
    echo "Created minified file: $MIN_FILE"
fi
