#!/bin/bash

# Build script for browser environment
# This script combines all necessary files for running the software renderer in browsers

# Source common build functions
source ./build-common.sh

# Check for terser
check_terser "$1" || exit 1

# Get version
VERSION=$(get_version)
if [ $? -ne 0 ]; then
    exit 1
fi

# Create build directory
ensure_build_dir

# Define the output files
CONCAT_FILE="build/crisp-sw-canvas-v$VERSION.js"
MIN_FILE="build/crisp-sw-canvas-v$VERSION.min.js"

# Create file list
FILES=("${COMMON_CORE_FILES[@]}" "${BROWSER_SPECIFIC_FILES[@]}")

# Concatenate all files with version comment
concatenate_files "$CONCAT_FILE" "$VERSION" "browser" "${FILES[@]}"

# Minify only if --no-minify is not specified
if [ "$1" != "--no-minify" ]; then
    minify_js "$CONCAT_FILE" "$MIN_FILE" "$VERSION"
fi
