#!/bin/bash

# Build script for Node.js environment
# This script combines all necessary files for running the software renderer in Node.js

# Create build directory if it doesn't exist
mkdir -p build

# Extract version from CrispSwCanvas.js
VERSION=$(grep "static version = '" js/crisp-sw-canvas/CrispSwCanvas.js | sed "s/.*version = '\([^']*\)'.*/\1/")
if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from CrispSwCanvas.js"
    exit 1
fi

# Define the output file
NODE_FILE="build/crisp-sw-canvas-node-v$VERSION.js"

# Create version comment
VERSION_COMMENT="/* CrispSwCanvas for Node.js v$VERSION */"

# Concatenate all required JavaScript files with version comment
echo "$VERSION_COMMENT" > "$NODE_FILE"
echo "'use strict';" >> "$NODE_FILE"
echo "// Node.js environment setup" >> "$NODE_FILE"
cat js/crisp-sw-canvas/node-polyfills.js >> "$NODE_FILE"
cat js/crisp-sw-canvas/TransformationMatrix.js \
    js/crisp-sw-canvas/transform-utils.js \
    js/crisp-sw-canvas/color-utils.js \
    js/crisp-sw-canvas/ContextState.js \
    js/utils/geometry.js \
    js/renderers/renderer-utils.js \
    js/renderers/sw-renderer/SWRendererPixel.js \
    js/renderers/sw-renderer/SWRendererLine.js \
    js/renderers/sw-renderer/SWRendererRect.js \
    js/crisp-sw-canvas/CrispSwCanvas.js \
    js/crisp-sw-canvas/CrispSwContext.js >> "$NODE_FILE"

# Add Node.js exports at the end
cat << EOF >> "$NODE_FILE"

// Node.js exports - make the essential classes available to importing scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CrispSwCanvas,
    CrispSwContext,
    ContextState,
    TransformationMatrix,
    ImageData
  };
}
EOF

echo "Created Node.js bundle: $NODE_FILE"
chmod +x "$NODE_FILE"

echo "Done! You can now use the software renderer in Node.js."