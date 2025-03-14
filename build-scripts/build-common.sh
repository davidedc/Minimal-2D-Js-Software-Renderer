#!/bin/bash
# Common build script functions and variables
# This script should be sourced by other build scripts, not executed directly

# Check if we're being executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script should be sourced by other build scripts, not executed directly."
    echo "Usage: source ./build-common.sh"
    exit 1
fi

# Function to extract version from CrispSwCanvas.js
function get_version() {
    local version=$(grep "static version = '" ../js/crisp-sw-canvas/CrispSwCanvas.js | sed "s/.*version = '\([^']*\)'.*/\1/")
    if [ -z "$version" ]; then
        echo "Error: Could not extract version from CrispSwCanvas.js" >&2
        return 1
    fi
    echo "$version"
}

# Function to create build directory if it doesn't exist
function ensure_build_dir() {
    mkdir -p ../build
}

# Function to create version comment
function create_version_comment() {
    local version="$1"
    local target="$2"
    
    if [ "$target" == "browser" ]; then
        echo "/* CrispSwCanvas v$version */"
    elif [ "$target" == "node" ]; then
        echo "/* CrispSwCanvas for Node.js v$version */"
    else
        echo "/* CrispSwCanvas v$version */"
    fi
}

# Common files for both browser and node builds
COMMON_CORE_FILES=(
    "../js/crisp-sw-canvas/TransformationMatrix.js"
    "../js/crisp-sw-canvas/transform-utils.js"
    "../js/crisp-sw-canvas/color-utils.js"
    "../js/crisp-sw-canvas/ContextState.js"
    "../js/utils/geometry.js"
    "../js/renderers/renderer-utils.js"
    "../js/renderers/sw-renderer/SWRendererPixel.js"
    "../js/renderers/sw-renderer/SWRendererLine.js"
    "../js/renderers/sw-renderer/SWRendererRect.js"
    "../js/crisp-sw-canvas/CrispSwCanvas.js"
    "../js/crisp-sw-canvas/CrispSwContext.js"
)

# Node-specific files
NODE_SPECIFIC_FILES=(
    "../js/RenderChecks.js"
)

# Browser-specific files (if any)
BROWSER_SPECIFIC_FILES=()

# Function to concatenate files
function concatenate_files() {
    local output_file="$1"
    local version="$2"
    local target="$3"
    local files=("${@:4}")  # All arguments from the 4th onwards are files
    
    # Create or empty the output file
    create_version_comment "$version" "$target" > "$output_file"
    
    # If this is a node.js build, add 'use strict' and node polyfills
    if [ "$target" == "node" ]; then
        echo "'use strict';" >> "$output_file"
        echo "// Node.js environment setup" >> "$output_file"
        cat ../js/crisp-sw-canvas/node-polyfills.js >> "$output_file"
    fi
    
    # Concatenate all files
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            cat "$file" >> "$output_file"
        else
            echo "Warning: File $file not found, skipping" >&2
        fi
    done
    
    echo "Created concatenated file: $output_file"
}

# Function to check if terser is installed (for browser build)
function check_terser() {
    if ! command -v terser &> /dev/null && [ "$1" != "--no-minify" ]; then
        echo "Terser is not installed. To install it, run:"
        echo "npm install terser -g"
        echo ""
        echo "Alternatively, run this script with --no-minify to skip minification"
        return 1
    fi
    return 0
}

# Function to add Node.js exports
function add_node_exports() {
    local output_file="$1"
    
    cat << EOF >> "$output_file"

// Node.js exports - make the essential classes available to importing scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CrispSwCanvas,
    RenderChecks,
  };
}
EOF
}

# Function to minify JavaScript file using terser
function minify_js() {
    local input_file="$1"
    local output_file="$2"
    local version="$3"
    
    # Add version comment to minified file and preserve it during minification
    create_version_comment "$version" "browser" > "$output_file"
    terser "$input_file" -o "$output_file" --comments "/CrispSwCanvas v/" -c -m
    echo "Created minified file: $output_file"
}