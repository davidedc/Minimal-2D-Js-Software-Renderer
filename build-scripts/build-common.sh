#!/bin/bash
# Common build script functions and variables
# This script should be sourced by other build scripts, not executed directly

# Check if we're being executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "This script should be sourced by other build scripts, not executed directly."
    echo "Usage: source ./build-common.sh"
    exit 1
fi

# Function to get the project root directory
function get_project_root() {
    local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "$(cd "$SCRIPT_DIR/.." && pwd)"
}

# Function to extract version from CrispSwCanvas.js
function get_version() {
    local PROJECT_ROOT="$(get_project_root)"
    
    local version=$(grep "static version = '" "$PROJECT_ROOT/src/crisp-sw-canvas/CrispSwCanvas.js" | sed "s/.*version = '\([^']*\)'.*/\1/")
    if [ -z "$version" ]; then
        echo "Error: Could not extract version from CrispSwCanvas.js" >&2
        return 1
    fi
    echo "$version"
}

# Function to create build directory if it doesn't exist
function ensure_build_dir() {
    local PROJECT_ROOT="$(get_project_root)"
    mkdir -p "$PROJECT_ROOT/build"
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
function get_common_core_files() {
    local PROJECT_ROOT="$(get_project_root)"

    # Get primitive files from sibling directory
    get_primitive_files || return 1

    COMMON_CORE_FILES=(
        "$PROJECT_ROOT/src/crisp-sw-canvas/TransformationMatrix.js"
        "$PROJECT_ROOT/src/crisp-sw-canvas/transform-utils.js"
        # Color primitives from SWCanvas-primitives (replaces color-utils.js)
        "${PRIMITIVE_FILES[@]}"
        "$PROJECT_ROOT/src/crisp-sw-canvas/ContextState.js"
        "$PROJECT_ROOT/src/utils/geometry.js"
        "$PROJECT_ROOT/src/utils/PixelSet.js"
        "$PROJECT_ROOT/src/utils/ScanlineSpans.js"
        "$PROJECT_ROOT/src/renderers/renderer-utils.js"
        "$PROJECT_ROOT/src/renderers/sw-renderer/SWRendererPixel.js"
        "$PROJECT_ROOT/src/renderers/sw-renderer/SWRendererLine.js"
        "$PROJECT_ROOT/src/renderers/sw-renderer/SWRendererRect.js"
        "$PROJECT_ROOT/src/renderers/sw-renderer/SWRendererArc.js"
        "$PROJECT_ROOT/src/renderers/sw-renderer/SWRendererCircle.js"
        "$PROJECT_ROOT/src/renderers/sw-renderer/SWRendererRoundedRect.js"
        "$PROJECT_ROOT/src/crisp-sw-canvas/CrispSwCanvas.js"
        "$PROJECT_ROOT/src/crisp-sw-canvas/CrispSwContext.js"
    )
}

# Node-specific files
function get_node_specific_files() {
    local PROJECT_ROOT="$(get_project_root)"
    NODE_SPECIFIC_FILES=(
        "$PROJECT_ROOT/src/RenderChecks.js"
    )
}

# Browser-specific files (if any)
BROWSER_SPECIFIC_FILES=()

# Function to get SWCanvas-primitives directory path
function get_primitives_dir() {
    local PROJECT_ROOT="$(get_project_root)"
    # Check sibling directory (go up one level, then into SWCanvas-primitives)
    local PRIMITIVES_DIR="$(cd "$PROJECT_ROOT/.." && pwd)/SWCanvas-primitives"

    if [ ! -d "$PRIMITIVES_DIR" ]; then
        echo "Error: SWCanvas-primitives directory not found at $PRIMITIVES_DIR" >&2
        echo "Please ensure SWCanvas-primitives is a sibling directory of Minimal-2D-Js-Software-Renderer" >&2
        return 1
    fi
    echo "$PRIMITIVES_DIR"
}

# Function to get primitive color files from sibling directory
function get_primitive_files() {
    local PRIMITIVES_DIR
    PRIMITIVES_DIR="$(get_primitives_dir)" || return 1

    PRIMITIVE_FILES=(
        "$PRIMITIVES_DIR/Color.js"
        "$PRIMITIVES_DIR/ColorParser.js"
    )

    # Verify files exist
    for file in "${PRIMITIVE_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            echo "Error: Required file not found: $file" >&2
            return 1
        fi
    done
}

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
        local PROJECT_ROOT="$(get_project_root)"
        echo "'use strict';" >> "$output_file"
        echo "// Node.js environment setup" >> "$output_file"
        cat "$PROJECT_ROOT/src/crisp-sw-canvas/node-polyfills.js" >> "$output_file"
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
        echo "Error: Terser is not installed. To install it, run:"
        echo "npm install terser -g"
        echo "or"
        echo "pnpm install -g terser"
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