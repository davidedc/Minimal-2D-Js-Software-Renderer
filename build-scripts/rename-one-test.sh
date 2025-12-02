#!/bin/sh
#
# This script automates the renaming of a single high-level test file according to the project's conventions.
# See tests/High-Level-SW-Renderer-Tests-How-To-Rename.md for the manual steps.
#
# It performs the following actions:
# 1. Finds one test file that has not been renamed yet (identified by '--' in its name).
# 2. Extracts the new filename and description from its header comment.
# 3. Renames the file.
# 4. Updates the internal `registerHighLevelTest` call with the new filename and description.
# 5. Updates the script references in the HTML test harnesses.
# 6. Removes the "New Filename:" line from the test file's header comment.
#
# Usage:
#   sh build-scripts/rename-one-test.sh
#
# Debug Mode:
#   Set the DEBUG environment variable to 'true' to see the commands that would be executed without running them.
#   DEBUG=true sh build-scripts/rename-one-test.sh
#

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
TEST_CASE_DIR="tests/browser-tests/test-cases"
HIGH_LEVEL_TEST_HTML="tests/browser-tests/high-level-tests.html"
PERF_TEST_HTML="tests/browser-tests/performance-tests.html"

# --- Helper Functions ---
# A wrapper for commands to respect DEBUG mode.
run_cmd() {
  echo "Executing: $@"
  if [ "$DEBUG" != "true" ]; then
    eval "$@"
  else
    echo "  (DEBUG MODE: Not executed)"
  fi
}

# --- Script Logic ---
echo "Starting test file rename process..."

# 1. Find the first valid test file to rename.
TARGET_FILE_PATH=""
CANDIDATE_FILES=$(find "$TEST_CASE_DIR" -type f -name '*--*test.js')

for file in $CANDIDATE_FILES; do
  # Use 'grep -q' for a silent check, now with a stricter regex
  # to ensure the content is on the same line.
  if grep -q -E '\* New Filename:\s+\S+' "$file" && grep -q -E '\* Description:\s+\S+' "$file"; then
    TARGET_FILE_PATH="$file"
    echo "Found valid file to rename: $TARGET_FILE_PATH"
    break # Found a valid file, exit the loop
  else
    echo "Skipping malformed file: $file"
  fi
done

if [ -z "$TARGET_FILE_PATH" ]; then
  echo "No valid test files to rename were found. All candidates are missing required metadata."
  exit 0
fi

# 2. Extract metadata from the file's header comment.
OLD_FILENAME=$(basename "$TARGET_FILE_PATH")

# Extract the new filename. It must be on a line like: " * New Filename: <name>"
NEW_FILENAME=$(grep '\* New Filename:' "$TARGET_FILE_PATH" | sed -e 's/.*\* New Filename: //' -e 's/ *$//')

if [ -z "$NEW_FILENAME" ]; then
  echo "ERROR: Could not find 'New Filename:' in the header of $TARGET_FILE_PATH. Cannot proceed."
  exit 1
fi
echo "New filename will be: $NEW_FILENAME"

# Extract the description. It must be on a line like: " * Description: <desc>"
NEW_DESCRIPTION=$(grep '\* Description:' "$TARGET_FILE_PATH" | sed -e 's/.*\* Description: //' -e 's/ *$//')

if [ -z "$NEW_DESCRIPTION" ]; then
  echo "ERROR: Could not find 'Description:' in the header of $TARGET_FILE_PATH. Cannot proceed."
  exit 1
fi
echo "New description will be: \"$NEW_DESCRIPTION\""

NEW_FILE_PATH="$TEST_CASE_DIR/$NEW_FILENAME"

# 3. Rename the test file.
run_cmd "mv \"$TARGET_FILE_PATH\" \"$NEW_FILE_PATH\""

# 4. Update the contents of the newly renamed file.
echo "Updating contents of $NEW_FILE_PATH..."

# 4a. Update the `registerHighLevelTest` call's first argument (the filename).
# This command finds the `registerHighLevelTest` line and replaces the first quoted string.
# It's designed to be robust against different quoting styles (' or ").
run_cmd "sed -i '' -E \"s/(registerHighLevelTest\\()('[^']+'|\\\"[^\\\"]+\\\")/\\1'$NEW_FILENAME'/\" \"$NEW_FILE_PATH\""

# 4b. Update the description in the `performanceTest` metadata object.
# This uses awk to find the `performanceTest` block and replace the `description` value.
# It is more robust than sed for multi-line contexts.
run_cmd "awk -v new_desc=\"$NEW_DESCRIPTION\" '
  BEGIN { in_perf_block=0 }
  /performanceTest:/ { in_perf_block=1 }
  /description:/ && in_perf_block {
    sub(/description: .*/, \"description: '\" new_desc \"',_PLACEHOLDER_\");
    gsub(/_PLACEHOLDER_/, \"\");
  }
  in_perf_block && /}/ { in_perf_block=0 }
  { print }
' \"$NEW_FILE_PATH\" > \"${NEW_FILE_PATH}.tmp\" && mv \"${NEW_FILE_PATH}.tmp\" \"$NEW_FILE_PATH\""


# 4c. Remove the "New Filename:" line from the header comment.
run_cmd "sed -i '' '/\* New Filename:/d' \"$NEW_FILE_PATH\""


# 5. Update the HTML test harnesses.
echo "Updating HTML harnesses..."
for html_file in "$HIGH_LEVEL_TEST_HTML" "$PERF_TEST_HTML"; do
  if [ -f "$html_file" ]; then
    echo "  Processing $html_file..."
    run_cmd "sed -i '' 's#src=\"test-cases/$OLD_FILENAME\"#src=\"test-cases/$NEW_FILENAME\"#' \"$html_file\""
  else
    echo "  WARNING: HTML file not found: $html_file"
  fi
done

echo ""
echo "Successfully renamed and updated '$OLD_FILENAME' to '$NEW_FILENAME'."
echo "Process complete." 