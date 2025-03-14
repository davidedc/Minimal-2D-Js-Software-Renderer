#!/bin/bash

# Build script for Node.js environment
# This script combines all necessary files for running the software renderer in Node.js

# Source common build functions
source ./build-common.sh

# Get version
VERSION=$(get_version)
if [ $? -ne 0 ]; then
    exit 1
fi

# Create build directory
ensure_build_dir

# Define the output file
NODE_FILE="../build/crisp-sw-canvas-node-v$VERSION.js"

# Create combined file list
FILES=("${COMMON_CORE_FILES[@]}" "${NODE_SPECIFIC_FILES[@]}")

# Concatenate all files with version comment
concatenate_files "$NODE_FILE" "$VERSION" "node" "${FILES[@]}"

# Add Node.js exports at the end - custom exports for this script
cat << EOF >> "$NODE_FILE"

// Node.js exports - make the essential classes available to importing scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CrispSwCanvas,
    RenderChecks,
  };
}
EOF

echo "Created Node.js bundle: $NODE_FILE"
chmod +x "$NODE_FILE"

echo "Done! You can now use the software renderer in Node.js."