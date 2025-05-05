#!/bin/bash
# Run all build/test scripts


SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
# If this script is at the project root, SCRIPT_DIR is the project root.
PROJECT_ROOT="$SCRIPT_DIR"
BUILD_DIR="$PROJECT_ROOT/build" # Define build dir path

echo "============================================="
echo " Running All Scripts from Project Root: $PROJECT_ROOT"
echo "============================================="

# --- Clean Build Directory --- 
echo "
---> Cleaning previous build..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR" # Recreate build directory
echo "Build directory cleaned."

# --- Build Scripts ---
echo "
---> Running Build Scripts..."

echo "Running build-browser.sh..."
sh $PROJECT_ROOT/build-scripts/build-browser.sh

echo "Running build-node.sh..."
sh $PROJECT_ROOT/build-scripts/build-node.sh

echo "
[Build] Building node-test-runner.js (Low-Level Tests)..."
"$PROJECT_ROOT/build-scripts/build-node-test-runner-simple-concat.sh"

echo "
[Build] Building node-high-level-test-runner.js (High-Level Tests)..."
"$PROJECT_ROOT/build-scripts/build-node-high-level-test-runner-simple-concat.sh"

# Run examples
echo "Running simple-node-example.js..."
node examples/simple-node-example.js

# --- Test Scripts (Optional - uncomment to run) ---
echo "
---> Running Test Scripts..."

echo "
[Test] Running Low-Level Node Tests (All, 1 iteration, Verbose)..."
node "$PROJECT_ROOT/build/node-test-runner.js" --test --verbose --output="$PROJECT_ROOT/test-output-low-level-run-all" || true

echo "
[Test] Running node-test-runner.js with -i centered-rounded-rect -r 1-11 option..."
node "$PROJECT_ROOT/build/node-test-runner.js" -i centered-rounded-rect -r 1-11 --output="$PROJECT_ROOT/test-output-low-level-multiple-iterations"

echo "
[Test] Running High-Level Node Tests (All, 1 iteration)..."
node "$PROJECT_ROOT/build/node-high-level-test-runner.js" --test --output="$PROJECT_ROOT/test-output-high-level-run-all" || true


echo "
============================================="
echo " All Scripts Finished Successfully"
echo "============================================="
