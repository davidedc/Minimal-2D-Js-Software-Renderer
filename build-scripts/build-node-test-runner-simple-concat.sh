#!/bin/bash
# Simple builder script that creates the node-test-runner.js file using direct concatenation
# This avoids complex import/export dependencies

# Ensure script is executable, even if something fails
set -e

echo "Building node-test-runner.js using direct concatenation..."

# Ensure build directory exists
mkdir -p ../build

rm -f ../build/node-test-runner.js

# Node environment setup
cat ../js/crisp-sw-canvas/node-polyfills.js >> ../build/node-test-runner.js

# Core utility files
UTIL_FILES=(
    "../js/utils/geometry.js"
    "../js/utils/random-utils.js" 
    "../js/utils/PixelSet.js"
    "../js/utils/ScanlineSpans.js"
)

for file in "${UTIL_FILES[@]}"; do
    cat "$file" >> ../build/node-test-runner.js
done

# Renderer files
RENDERER_FILES=(
    "../js/shared-renderer.js"
    "../js/renderers/renderer-utils.js"
)

for file in "${RENDERER_FILES[@]}"; do
    cat "$file" >> ../build/node-test-runner.js
done

cat ../js/renderers/sw-renderer/*.js >> ../build/node-test-runner.js

cat ../js/scene-creation/*.js >> ../build/node-test-runner.js

# Test framework files
TEST_FILES=(
    "../js/RenderChecks.js"
    "../js/RenderComparison.js"
    "../js/RenderComparisonBuilder.js"
    "../js/added-comparisons.js"
    "../js/ui.js"
    "../js/node-test-runner-base.js"
)

for file in "${TEST_FILES[@]}"; do
    cat "$file" >> ../build/node-test-runner.js
done

echo "main();" >> ../build/node-test-runner.js

# Make the script executable
chmod +x ../build/node-test-runner.js

echo "../build/node-test-runner.js has been successfully built using direct concatenation!"
echo "You can now run it with commands like:"
echo "  node ../build/node-test-runner.js --list"
echo "  node ../build/node-test-runner.js --id=thin-black-lines-1 --example=1"