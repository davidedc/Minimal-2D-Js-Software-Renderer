#!/bin/bash
# Build script for Node.js High-Level Test Runner

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
OUTPUT_FILE="$BUILD_DIR/node-high-level-test-runner.js"

# --- Ensure Build Directory Exists ---
echo "[Build Script] Ensuring build directory exists: $BUILD_DIR"
mkdir -p "$BUILD_DIR"

# --- Start Build ---
echo "[Build Script] Starting build for Node.js High-Level Test Runner..."
rm -f "$OUTPUT_FILE"
echo "[Build Script] Cleared existing output file: $OUTPUT_FILE"

# +++ Add initial debug log +++
echo "console.log('[High-Level Runner Build] Script execution started (inside JS).');" >> "$OUTPUT_FILE"

# --- Concatenate Files (Order Matters!) ---
echo "[Build Script] Concatenating source files..."

# 1. Node Polyfills
echo "[Build Script] Adding Node Polyfills..."
cat "$PROJECT_ROOT/src/crisp-sw-canvas/node-polyfills.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/node-polyfills.js"

# 2. Core Utilities (Including geometry.js for TransformationMatrix)
echo "[Build Script] Adding Core Utilities..."

# ----- these are needed for the Scene: All Shape Types Combined test, which
# still uses scene creation stuff.

# add src/scene-creation/scene-creation-lines.js
cat "$PROJECT_ROOT/src/scene-creation/scene-creation-lines.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/scene-creation-lines.js"

# add src/scene-creation/scene-creation-rects.js
cat "$PROJECT_ROOT/src/scene-creation/scene-creation-rects.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/scene-creation-rects.js"

# add src/scene-creation/scene-creation-rounded-rects.js
cat "$PROJECT_ROOT/src/scene-creation/scene-creation-rounded-rects.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/scene-creation-rounded-rects.js"

# add src/scene-creation/scene-creation-arcs.js
cat "$PROJECT_ROOT/src/scene-creation/scene-creation-arcs.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/scene-creation-arcs.js"

# add src/scene-creation/scene-creation-circles.js
cat "$PROJECT_ROOT/src/scene-creation/scene-creation-circles.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/scene-creation-circles.js"

# end of scene creation stuff for Scene: All Shape Types Combined test --------


# add src/scene-creation/scene-creation-utils.js
# TODO: put this in a different folder as it's not just for scene creation, it's also
# used by the high-level tests to position rects so they draw crisply.
cat "$PROJECT_ROOT/src/scene-creation/scene-creation-utils.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/scene-creation-utils.js"

# add src/secene-creation/SeededRandom.js. This one normally gets
# added for the scene creation utils, but actually it's useful also
# beyond them.
# TODO: put this in a different folder as it's not just for scene creation
cat "$PROJECT_ROOT/src/scene-creation/SeededRandom.js" >> "$OUTPUT_FILE"
echo "  Added: src/scene-creation/SeededRandom.js"

CORE_UTILS=(
  "geometry.js"
  "random-utils.js"
  "PixelSet.js"
  "ScanlineSpans.js"
)
for util_file in "${CORE_UTILS[@]}"; do
  if [ -f "$PROJECT_ROOT/src/utils/$util_file" ]; then
    echo "    Concatenating: src/utils/$util_file" # Log before cat
    cat "$PROJECT_ROOT/src/utils/$util_file" >> "$OUTPUT_FILE"
    ## add a newline after the file
    echo "" >> "$OUTPUT_FILE"
    echo "    Added: src/utils/$util_file"
  else
      echo "    WARNING: Utility file not found: src/utils/$util_file"
  fi
done
echo "[Build Script] Finished Core Utilities."

# 3. Crisp SW Canvas Files
echo "[Build Script] Adding Crisp SW Canvas files..."
## TransformationMatrix
cat "$PROJECT_ROOT/src/crisp-sw-canvas/TransformationMatrix.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/TransformationMatrix.js"
## Now transform-utils.js
cat "$PROJECT_ROOT/src/crisp-sw-canvas/transform-utils.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/transform-utils.js"
## Now color-utils.js
cat "$PROJECT_ROOT/src/crisp-sw-canvas/color-utils.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/color-utils.js"
## now ContextState.js
cat "$PROJECT_ROOT/src/crisp-sw-canvas/ContextState.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/ContextState.js"
## now CrispSwCanvas.js
cat "$PROJECT_ROOT/src/crisp-sw-canvas/CrispSwCanvas.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/CrispSwCanvas.js"
## now CrispSwContext.js
cat "$PROJECT_ROOT/src/crisp-sw-canvas/CrispSwContext.js" >> "$OUTPUT_FILE"
echo "  Added: src/crisp-sw-canvas/CrispSwContext.js"
echo "[Build Script] Finished Crisp SW Canvas files."

# 4. Shared Renderer Files
echo "[Build Script] Adding Shared Renderer files..."
cat "$PROJECT_ROOT/src/shared-renderer.js" >> "$OUTPUT_FILE"
echo "  Added: src/shared-renderer.js"
cat "$PROJECT_ROOT/src/renderers/renderer-utils.js" >> "$OUTPUT_FILE"
echo "  Added: src/renderers/renderer-utils.js"
echo "[Build Script] Finished Shared Renderer files."

# 5. Software Renderer Implementations
echo "[Build Script] Adding SW Renderer Implementations..."
for file in "$PROJECT_ROOT/src/renderers/sw-renderer/"*.js; do
  echo "    Concatenating: src/renderers/sw-renderer/$(basename "$file")" # Log before cat
  cat "$file" >> "$OUTPUT_FILE"
  echo "    Added: src/renderers/sw-renderer/$(basename "$file")"
done
echo "[Build Script] Finished SW Renderer Implementations."

# 6. Test Framework Core (MUST come before test files that use it)
echo "[Build Script] Adding Test Framework Core..."
cat "$PROJECT_ROOT/src/RenderChecks.js" >> "$OUTPUT_FILE"
echo "  Added: src/RenderChecks.js"
cat "$PROJECT_ROOT/src/RenderTest.js" >> "$OUTPUT_FILE"
echo "  Added: src/RenderTest.js"
cat "$PROJECT_ROOT/src/RenderTestBuilder.js" >> "$OUTPUT_FILE"
echo "  Added: src/RenderTestBuilder.js"
echo "[Build Script] Finished Test Framework Core."

# 7. Individual High-Level Test Files (Define tests)
TEST_FILES_DIR="$PROJECT_ROOT/tests/browser-tests/test-cases"
echo "[Build Script] Adding High-Level Test Files from: $TEST_FILES_DIR"
for file in "$TEST_FILES_DIR/"*--test.js; do
  if [ -f "$file" ]; then # Check if it's a file
    echo "    Concatenating: tests/browser-tests/test-cases/$(basename "$file")" # Log before cat
    cat "$file" >> "$OUTPUT_FILE"
    echo "    Added: tests/browser-tests/test-cases/$(basename "$file")"
  fi
done
echo "[Build Script] Finished High-Level Test Files."

# 8. Node High-Level Test Runner Base Logic
echo "[Build Script] Adding Node High-Level Test Runner Base Logic..."
cat "$PROJECT_ROOT/src/node-high-level-test-runner-base.js" >> "$OUTPUT_FILE"
echo "  Added: src/node-high-level-test-runner-base.js"
echo "[Build Script] Finished Node High-Level Test Runner Base Logic."

# --- Finalize --- 
echo "[Build Script] Appending main() call..."
echo "console.log('[High-Level Runner Build] About to call main()...');" >> "$OUTPUT_FILE" # Log before call
echo "" >> "$OUTPUT_FILE"
echo "main();" >> "$OUTPUT_FILE"
echo "console.log('[High-Level Runner Build] main() should have been called.');" >> "$OUTPUT_FILE" # Log after call

echo "[Build Script] Setting execute permissions..."
chmod +x "$OUTPUT_FILE"

# --- Done ---
echo "---------------------------------------------------------"
echo "Build complete!"
echo "Node.js High-Level Test Runner created at: $OUTPUT_FILE"
echo "You can run it using: node $OUTPUT_FILE [options]"
echo "---------------------------------------------------------" 