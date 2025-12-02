#!/bin/sh
#
# This script checks all newly-named test files (ending with "-test.js")
# to ensure their registerHighLevelTest call has the correct filename
# as the first parameter.
#
# It verifies that the first parameter in the registerHighLevelTest() call
# matches the actual filename of the test.
#
# This is a read-only script and does not modify any files.
#
# Usage:
#   sh build-scripts/check-register-consistency.sh
#

set -e

# --- Configuration ---
TEST_CASE_DIR="tests/browser-tests/test-cases"

# --- Script Logic ---
echo "Checking registerHighLevelTest consistency for newly-named test files..."
echo ""

# Find all files that follow the new naming convention (ending with "-test.js")
NEW_FORMAT_FILES=$(find "$TEST_CASE_DIR" -type f -name '*-test.js')

if [ -z "$NEW_FORMAT_FILES" ]; then
  echo "No test files following the new naming convention (*-test.js) were found."
  exit 0
fi

errors_found=0
files_checked=0

for file_path in $NEW_FORMAT_FILES; do
  files_checked=$((files_checked + 1))
  actual_filename=$(basename "$file_path")
  
  # Extract the first parameter from registerHighLevelTest call
  # Use a more robust approach that can handle multi-line calls
  # First, find the line with registerHighLevelTest, then look for the quoted string in the following lines
  registered_filename=""
  
  # Find line number of registerHighLevelTest
  register_line=$(grep -n "registerHighLevelTest" "$file_path" | head -n 1 | cut -d: -f1 || true)
  
  if [ -n "$register_line" ]; then
    # Look at the next few lines after registerHighLevelTest to find the first quoted string
    registered_filename=$(sed -n "${register_line},$(($register_line + 5))p" "$file_path" | grep -o "['\"][^'\"]*['\"]" | head -n 1 | sed "s/['\"]//g" || true)
  fi
  
  if [ -z "$registered_filename" ]; then
    echo "[ERROR]   $file_path"
    echo "  - Cannot find registerHighLevelTest call or extract filename parameter."
    errors_found=$((errors_found + 1))
  elif [ "$registered_filename" = "$actual_filename" ]; then
    echo "[OK]      $file_path"
  else
    echo "[MISMATCH] $file_path"
    echo "  - Actual filename:     '$actual_filename'"
    echo "  - Registered filename: '$registered_filename'"
    errors_found=$((errors_found + 1))
  fi
done

echo ""
echo "--------------------------------------------------"
echo "Check complete. Scanned $files_checked file(s)."

if [ "$errors_found" -eq 0 ]; then
  echo "✅ All newly-named test files have consistent registerHighLevelTest parameters."
else
  echo "❌ Found $errors_found issue(s). Please fix the file(s) listed above."
  exit 1
fi 