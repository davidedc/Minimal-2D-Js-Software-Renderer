#!/bin/sh
#
# This script checks all high-level test files for comprehensive metadata validation.
#
# For files that need renaming (old "--" format):
# 1. Validates header comment has properly formatted "* New Filename:" and "* Description:" lines
# 2. Ensures descriptions are single-line only
#
# For all test files:
# 3. Validates registerHighLevelTest metadata has title, description, and displayName properties
#
# This is a read-only script and does not modify any files.
#
# Usage:
#   sh build-scripts/check-test-metadata.sh
#

set -e

# --- Configuration ---
TEST_CASE_DIR="tests/browser-tests/test-cases"

# --- Script Logic ---
echo "Checking comprehensive metadata for all high-level test files..."
echo ""

# Find all test files (both old "--" format and new "-" format)
ALL_TEST_FILES=$(find "$TEST_CASE_DIR" -type f -name '*test.js')

if [ -z "$ALL_TEST_FILES" ]; then
  echo "No test files were found."
  exit 0
fi

errors_found=0
files_checked=0

for file_path in $ALL_TEST_FILES; do
  files_checked=$((files_checked + 1))
  filename=$(basename "$file_path")
  
  echo "📄 $filename"
  
  is_valid=1
  
  # Check if this is an old format file that needs renaming
  is_old_format=0
  if echo "$filename" | grep -q -- '--'; then
    is_old_format=1
    
    # === Header Comment Validation (from check-rename-candidates.sh) ===
    
    # Check that there is content on the same line after the tag.
    has_valid_description=$(grep -E -c '\* Description:\s+\S+' "$file_path" || true)
    
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
    
    if [ "$has_valid_description" -eq 0 ]; then
      echo "   ❌ Header 'Description': Missing or invalid format"
      is_valid=0
    elif [ "$is_multiline_desc" -eq 1 ]; then
      echo "   ❌ Header 'Description': Must be single-line"
      is_valid=0
    else
      echo "   ✅ Header 'Description': Valid"
    fi
  fi
  
  # === RegisterHighLevelTest Validation (for all files) ===
  
  # Check for registerHighLevelTest call
  has_register_call=$(grep -c "registerHighLevelTest" "$file_path" || true)
  
  if [ "$has_register_call" -eq 0 ]; then
    echo "   ❌ RegisterHighLevelTest: Call not found"
    is_valid=0
  else
    echo "   ✅ RegisterHighLevelTest: Call found"
    
    # Extract the metadata object section (look for the lines after registerHighLevelTest)
    # Find the line with registerHighLevelTest and extract several lines after it
    register_line=$(grep -n "registerHighLevelTest" "$file_path" | head -n 1 | cut -d: -f1 || true)
    
    if [ -z "$register_line" ]; then
      echo "   ❌ RegisterHighLevelTest: Cannot locate call"
      is_valid=0
    else
      # Extract about 20 lines after registerHighLevelTest to capture the metadata object
      metadata_section=$(sed -n "${register_line},$(($register_line + 20))p" "$file_path")
      
      # Check for required properties
      has_title=$(echo "$metadata_section" | grep -c "title:" || true)
      has_description=$(echo "$metadata_section" | grep -c "description:" || true)
      has_display_name=$(echo "$metadata_section" | grep -c "displayName:" || true)
      
      if [ "$has_title" -eq 0 ]; then
        echo "   ❌ Metadata 'title': Missing"
        is_valid=0
      else
        echo "   ✅ Metadata 'title': Present"
      fi
      
      if [ "$has_description" -eq 0 ]; then
        echo "   ❌ Metadata 'description': Missing"
        is_valid=0
      else
        echo "   ✅ Metadata 'description': Present"
      fi
      
      if [ "$has_display_name" -eq 0 ]; then
        echo "   ❌ Metadata 'displayName': Missing"
        is_valid=0
      else
        echo "   ✅ Metadata 'displayName': Present"
      fi
    fi
  fi
  
  # === Overall Result ===
  
  if [ "$is_valid" -eq 0 ]; then
    errors_found=$((errors_found + 1))
  fi
  
  echo ""
done

echo "--------------------------------------------------"
echo "Check complete. Scanned $files_checked file(s)."

if [ "$errors_found" -eq 0 ]; then
  echo "✅ All test files have valid metadata (header comments + registerHighLevelTest properties)."
else
  echo "❌ Found $errors_found file(s) with metadata issues."
  exit 1
fi 