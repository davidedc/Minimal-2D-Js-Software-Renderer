#!/bin/sh
#
# This script checks all test files that are candidates for renaming
# to ensure they have the required metadata in their header comments.
#
# It verifies that each candidate file contains:
# 1. A "* New Filename:" line.
# 2. A "* Description:" line.
#
# It will report the status ([OK] or [INVALID]) for every candidate file.
# This is a read-only script and does not modify any files.
#
# Usage:
#   sh build-scripts/check-rename-candidates.sh
#

set -e

# --- Configuration ---
TEST_CASE_DIR="tests/browser-tests/test-cases"

# --- Script Logic ---
echo "Checking all test rename candidates for required metadata..."
echo ""

# Find all files that look like they need renaming.
CANDIDATE_FILES=$(find "$TEST_CASE_DIR" -type f -name '*--*test.js')

if [ -z "$CANDIDATE_FILES" ]; then
  echo "No test files matching the 'old' naming convention (*--*test.js) were found."
  exit 0
fi

errors_found=0
files_checked=0

for file_path in $CANDIDATE_FILES; do
  files_checked=$((files_checked + 1))
  # Check that there is content on the same line after the tag.
  has_valid_new_filename=$(grep -E -c '\* New Filename:\s+\S+' "$file_path" || true)
  has_valid_description=$(grep -E -c '\* Description:\s+\S+' "$file_path" || true)
  
  is_valid=1
  error_message=""
  is_multiline_desc=0

  # Check for multi-line description
  if [ "$has_valid_description" -gt 0 ]; then
    # Get the line after '* Description:'
    NEXT_LINE=$(grep -A 1 '\* Description:' "$file_path" | tail -n 1)
    # A multi-line description exists if the next line is part of the comment
    # but is not another tag, not the end of the comment, and not an empty comment line.
    if ! echo "$NEXT_LINE" | grep -q -E '(\*\s+[A-Z][a-zA-Z]+:|\*\/|^\s*\*\s*$)'; then
      is_multiline_desc=1
    fi
  fi

  if [ "$has_valid_new_filename" -eq 0 ]; then
    error_message="$error_message\n  - Invalid format: '* New Filename:' must be followed by the filename on the same line."
    is_valid=0
  fi

  if [ "$has_valid_description" -eq 0 ]; then
    error_message="$error_message\n  - Invalid format: '* Description:' must be followed by the description on the same line."
    is_valid=0
  elif [ "$is_multiline_desc" -eq 1 ]; then
    error_message="$error_message\n  - Invalid format: Description must be on a single line."
    is_valid=0
  fi

  if [ "$is_valid" -eq 1 ]; then
    echo "[OK]      $file_path"
  else
    errors_found=$((errors_found + 1))
    echo "[INVALID] $file_path"
    echo "$error_message"
  fi
done

echo ""
echo "--------------------------------------------------"
echo "Check complete. Scanned $files_checked file(s)."

if [ "$errors_found" -eq 0 ]; then
  echo "✅ All candidate test files are correctly formatted for renaming."
else
  echo "❌ Found $errors_found issue(s). Please fix the file(s) listed as [INVALID] above."
  exit 1
fi 