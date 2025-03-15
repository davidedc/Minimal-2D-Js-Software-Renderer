#!/bin/bash
# Simple builder script that creates the node-test-runner.js file using direct concatenation
# This avoids complex import/export dependencies

# Ensure script is executable, even if something fails
set -e

# Function to get the project root directory
function get_project_root() {
    local SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "$(cd "$SCRIPT_DIR/.." && pwd)"
}

# Get the project root
PROJECT_ROOT="$(get_project_root)"

echo "Building node-test-runner.js using direct concatenation..."

# Ensure build directory exists
mkdir -p "$PROJECT_ROOT/build"

OUTPUT_FILE="$PROJECT_ROOT/build/node-test-runner.js"
rm -f "$OUTPUT_FILE"

# Node environment setup
cat "$PROJECT_ROOT/src/crisp-sw-canvas/node-polyfills.js" >> "$OUTPUT_FILE"

# Core utility files
UTIL_FILES=(
    "$PROJECT_ROOT/src/utils/geometry.js"
    "$PROJECT_ROOT/src/utils/random-utils.js" 
    "$PROJECT_ROOT/src/utils/PixelSet.js"
    "$PROJECT_ROOT/src/utils/ScanlineSpans.js"
)

for file in "${UTIL_FILES[@]}"; do
    cat "$file" >> "$OUTPUT_FILE"
done

# Renderer files
RENDERER_FILES=(
    "$PROJECT_ROOT/src/shared-renderer.js"
    "$PROJECT_ROOT/src/renderers/renderer-utils.js"
)

for file in "${RENDERER_FILES[@]}"; do
    cat "$file" >> "$OUTPUT_FILE"
done

cat "$PROJECT_ROOT/src/renderers/sw-renderer/"*.js >> "$OUTPUT_FILE"

cat "$PROJECT_ROOT/src/scene-creation/"*.js >> "$OUTPUT_FILE"

# Test framework files
TEST_FILES=(
    "$PROJECT_ROOT/src/RenderChecks.js"
    "$PROJECT_ROOT/src/RenderComparison.js"
    "$PROJECT_ROOT/src/RenderComparisonBuilder.js"
    "$PROJECT_ROOT/src/added-comparisons.js"
    "$PROJECT_ROOT/src/ui.js"
    "$PROJECT_ROOT/src/node-test-runner-base.js"
)

for file in "${TEST_FILES[@]}"; do
    cat "$file" >> "$OUTPUT_FILE"
done

echo "main();" >> "$OUTPUT_FILE"

# Make the script executable
chmod +x "$OUTPUT_FILE"

echo "$OUTPUT_FILE has been successfully built using direct concatenation!"
echo "You can now run it with commands like:"
echo "  node $OUTPUT_FILE --list"
echo "  node $OUTPUT_FILE --id=thin-black-lines-1 --example=1"