#!/bin/sh
#
# This script automatically fixes registerHighLevelTest consistency issues
# in newly-named test files (ending with "-test.js").
#
# It updates the first parameter of registerHighLevelTest() calls to match
# the actual filename when discrepancies are found.
#
# Usage:
#   sh build-scripts/fix-register-consistency.sh
#
# Debug Mode:
#   Set the DEBUG environment variable to 'true' to see what would be changed without making changes.
#   DEBUG=true sh build-scripts/fix-register-consistency.sh
#

set -e

# --- Configuration ---
TEST_CASE_DIR="tests/browser-tests/test-cases"

# --- Helper Functions ---
run_cmd() {
  echo "Executing: $@"
  if [ "$DEBUG" != "true" ]; then
    eval "$@"
  else
    echo "  (DEBUG MODE: Not executed)"
  fi
}

# --- Script Logic ---
echo "Fixing registerHighLevelTest consistency for newly-named test files..."
echo ""

# Find all files that follow the new naming convention (ending with "-test.js")
NEW_FORMAT_FILES=$(find "$TEST_CASE_DIR" -type f -name '*-test.js')

if [ -z "$NEW_FORMAT_FILES" ]; then
  echo "No test files following the new naming convention (*-test.js) were found."
  exit 0
fi

fixes_applied=0
files_checked=0

for file_path in $NEW_FORMAT_FILES; do
  files_checked=$((files_checked + 1))
  actual_filename=$(basename "$file_path")
  
  # Extract the first parameter from registerHighLevelTest call
  registered_filename=""
  
  # Find line number of registerHighLevelTest
  register_line=$(grep -n "registerHighLevelTest" "$file_path" | head -n 1 | cut -d: -f1 || true)
  
  if [ -n "$register_line" ]; then
    # Look at the next few lines after registerHighLevelTest to find the first quoted string
    registered_filename=$(sed -n "${register_line},$(($register_line + 5))p" "$file_path" | grep -o "['\"][^'\"]*['\"]" | head -n 1 | sed "s/['\"]//g" || true)
  fi
  
  if [ -z "$registered_filename" ]; then
    echo "[SKIP]    $file_path"
    echo "  - Cannot find registerHighLevelTest call or extract filename parameter."
  elif [ "$registered_filename" = "$actual_filename" ]; then
    echo "[OK]      $file_path"
  else
    echo "[FIXING]  $file_path"
    echo "  - Actual filename:     '$actual_filename'"
    echo "  - Registered filename: '$registered_filename'"
    
    # Create a safe sed command to replace the old filename with the new one
    # We need to escape special characters for sed
    escaped_old_filename=$(echo "$registered_filename" | sed 's/[[\.*^$()+?{|]/\\&/g')
    escaped_new_filename=$(echo "$actual_filename" | sed 's/[[\.*^$()+?{|]/\\&/g')
    
    # Replace the filename in the registerHighLevelTest call
    # This handles both single and double quotes
    run_cmd "sed -i '' \"s/'$escaped_old_filename'/'$escaped_new_filename'/g; s/\\\"$escaped_old_filename\\\"/\\\"$escaped_new_filename\\\"/g\" \"$file_path\""
    
    fixes_applied=$((fixes_applied + 1))
    echo "  - Fixed!"
  fi
done

echo ""
echo "--------------------------------------------------"
echo "Process complete. Checked $files_checked file(s)."

if [ "$fixes_applied" -eq 0 ]; then
  echo "✅ No fixes were needed. All files are consistent."
else
  echo "🔧 Applied $fixes_applied fix(es) to registerHighLevelTest calls."
fi 