#!/usr/bin/env node
/**
 * This script checks all high-level test files for comprehensive metadata validation.
 *
 * For files that need renaming (old "--" format):
 * 1. Validates header comment has properly formatted "* Description:" lines
 * 2. Ensures descriptions are single-line only
 *
 * For all test files:
 * 3. Validates registerHighLevelTest metadata has title, description, and displayName properties
 * 4. Validates the filename parameter in registerHighLevelTest matches the actual file
 * 5. Validates filename is parsable according to the naming convention
 * 6. Validates drawTest function has the exact required signature: function drawTest(ctx, currentIterationNumber, instances = null) {
 *
 * This is a read-only script and does not modify any files.
 *
 * Usage:
 *   node build-scripts/check-test-metadata.js
 */

const fs = require('fs');
const path = require('path');

// Import the test name parser
const TestNameParserPath = path.join(__dirname, '../tests/browser-tests/test-utils/test-name-parser.js');
const TestNameParserCode = fs.readFileSync(TestNameParserPath, 'utf8');

// Create a safe environment to evaluate the parser
const vm = require('vm');
const context = vm.createContext({
  console: console // Add console for any potential logging
});

// Execute the code and extract the TestNameParser class
// Wrap the code to make the class available as a property
const wrappedCode = TestNameParserCode + '\nthis.TestNameParser = TestNameParser;';
vm.runInContext(wrappedCode, context);

// The class should now be available in the context
const TestNameParser = context.TestNameParser;

if (!TestNameParser) {
  console.error('TestNameParser not found in context. Available keys:', Object.keys(context));
  process.exit(1);
}

// Configuration
const TEST_CASE_DIR = path.join(__dirname, '../tests/browser-tests/test-cases');

/**
 * Find all test files in the test cases directory
 */
function findTestFiles() {
  try {
    const files = fs.readdirSync(TEST_CASE_DIR);
    return files
      .filter(file => file.endsWith('.js') && file.includes('test'))
      .map(file => path.join(TEST_CASE_DIR, file));
  } catch (error) {
    console.error(`Error reading test directory: ${error.message}`);
    return [];
  }
}

/**
 * Check if a file uses the old "--" format
 */
function isOldFormat(filename) {
  return filename.includes('--');
}

/**
 * Validate header comment description for old format files
 */
function validateHeaderDescription(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const errors = [];
  
  // Find the description line
  const descriptionLineIndex = lines.findIndex(line => 
    line.trim().match(/^\*\s+Description:\s+\S+/)
  );
  
  if (descriptionLineIndex === -1) {
    errors.push("Header 'Description': Missing or invalid format");
    return errors;
  }
  
  // Check if the description is multi-line
  if (descriptionLineIndex + 1 < lines.length) {
    const nextLine = lines[descriptionLineIndex + 1].trim();
    // Multi-line if next line is part of comment but not another tag, end of comment, or empty comment
    const isMultiLine = nextLine.startsWith('*') && 
                       !nextLine.match(/^\*\s+[A-Z][a-zA-Z]+:/) && 
                       !nextLine.match(/^\*\//) && 
                       !nextLine.match(/^\*\s*$/);
    
    if (isMultiLine) {
      errors.push("Header 'Description': Must be single-line");
    }
  }
  
  return errors;
}

/**
 * Validate registerHighLevelTest metadata
 */
function validateRegisterMetadata(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const actualFilename = path.basename(filePath);
  
  // Check for registerHighLevelTest call
  if (!content.includes('registerHighLevelTest')) {
    errors.push('RegisterHighLevelTest: Call not found');
    return errors;
  }
  
  // Find the registerHighLevelTest line and extract metadata section
  const lines = content.split('\n');
  const registerLineIndex = lines.findIndex(line => 
    line.includes('registerHighLevelTest')
  );
  
  if (registerLineIndex === -1) {
    errors.push('RegisterHighLevelTest: Cannot locate call');
    return errors;
  }
  
  // Extract about 20 lines after registerHighLevelTest to capture metadata
  const metadataSection = lines
    .slice(registerLineIndex, registerLineIndex + 20)
    .join('\n');
  
  // Check for required properties
  const requiredProps = ['title:', 'description:', 'displayName:'];
  requiredProps.forEach(prop => {
    if (!metadataSection.includes(prop)) {
      const propName = prop.replace(':', '');
      errors.push(`Metadata '${propName}': Missing`);
    }
  });
  
  // Extract and validate the filename parameter
  const filenameMatch = content.match(/registerHighLevelTest\s*\(\s*['"`]([^'"`]+)['"`]/);
  if (filenameMatch) {
    const declaredFilename = filenameMatch[1];
    const actualFilenameWithoutExt = actualFilename.replace(/\.js$/, '');
    if (declaredFilename !== actualFilename && declaredFilename !== actualFilenameWithoutExt) {
      errors.push(`Filename Mismatch: Declared '${declaredFilename}' but actual file is '${actualFilename}'`);
    }
  } else {
    errors.push('RegisterHighLevelTest: Cannot extract filename parameter');
  }
  
  return errors;
}

/**
 * Validate filename parsing
 */
function validateFilenameParsing(filename, parser) {
  const basename = path.basename(filename);
  const parseResult = parser.parseTestName(basename);
  
  return parseResult.errors || [];
}

/**
 * Validate drawTest function signature
 */
function validateDrawTestSignature(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  
  // The exact required signature
  const requiredSignature = 'function drawTest(ctx, currentIterationNumber, instances = null) {';
  
  // Check if the exact signature exists
  if (!content.includes(requiredSignature)) {
    errors.push("DrawTest Function: Missing or incorrect signature. Expected exactly 'function drawTest(ctx, currentIterationNumber, instances = null) {'");
    
    // Try to find any drawTest function for better error reporting
    const drawTestMatch = content.match(/function\s+drawTest\s*\([^)]*\)/);
    if (drawTestMatch) {
      errors.push(`DrawTest Function: Found '${drawTestMatch[0]}' but signature must be exactly '${requiredSignature.slice(0, -2)})'`);
    }
  }
  
  return errors;
}

/**
 * Main function
 */
function main() {
  console.log('Checking comprehensive metadata for all high-level test files...\n');
  
  const testFiles = findTestFiles();
  
  if (testFiles.length === 0) {
    console.log('No test files were found.');
    return;
  }
  
  const parser = new TestNameParser();
  let errorsFound = 0;
  let filesChecked = 0;
  
  testFiles.forEach(filePath => {
    filesChecked++;
    const filename = path.basename(filePath);
    
    console.log(`📄 ${filename}`);
    
    let fileErrors = [];
    
    // Check if this is an old format file
    if (isOldFormat(filename)) {
      const headerErrors = validateHeaderDescription(filePath);
      if (headerErrors.length > 0) {
        fileErrors.push(...headerErrors.map(err => `   ❌ ${err}`));
      } else {
        console.log('   ✅ Header \'Description\': Valid');
      }
    }
    
    // Validate registerHighLevelTest metadata (for all files)
    const metadataErrors = validateRegisterMetadata(filePath);
    if (metadataErrors.length > 0) {
      fileErrors.push(...metadataErrors.map(err => `   ❌ ${err}`));
    } else {
      console.log('   ✅ RegisterHighLevelTest: Call found');
      console.log('   ✅ Metadata \'title\': Present');
      console.log('   ✅ Metadata \'description\': Present');
      console.log('   ✅ Metadata \'displayName\': Present');
      console.log('   ✅ Filename Parameter: Matches actual filename');
    }
    
    // Validate drawTest function signature (for all files)
    const drawTestErrors = validateDrawTestSignature(filePath);
    if (drawTestErrors.length > 0) {
      fileErrors.push(...drawTestErrors.map(err => `   ❌ ${err}`));
    } else {
      console.log('   ✅ DrawTest Function: Correct signature found');
    }
    
    // Validate filename parsing (for all files)
    const parsingErrors = validateFilenameParsing(filename, parser);
    if (parsingErrors.length > 0) {
      fileErrors.push(`   ❌ Filename Parsing: ${parsingErrors.length} error(s)`);
      parsingErrors.forEach(error => {
        fileErrors.push(`      • ${error}`);
      });
    } else {
      console.log('   ✅ Filename Parsing: Valid according to naming convention');
    }
    
    // Display any errors
    if (fileErrors.length > 0) {
      fileErrors.forEach(error => console.log(error));
      errorsFound++;
    }
    
    console.log('');
  });
  
  // Summary
  console.log('--------------------------------------------------');
  console.log(`Check complete. Scanned ${filesChecked} file(s).`);
  
  if (errorsFound === 0) {
    console.log('✅ All test files have valid metadata (header comments + registerHighLevelTest properties + filename parameters + parsable filenames + drawTest function signature).');
    process.exit(0);
  } else {
    console.log(`❌ Found ${errorsFound} file(s) with metadata issues.`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  main, 
  validateFilenameParsing, 
  validateRegisterMetadata, // includes filename parameter validation
  validateHeaderDescription,
  validateDrawTestSignature
}; 