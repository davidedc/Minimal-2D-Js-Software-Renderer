/**
 * Node.js Test Runner for Minimal-2D-Js-Software-Renderer
 * ======================================================
 * 
 * This script runs software renderer tests in Node.js without a browser.
 * It uses comparisons defined in added-comparisons.js to run tests via command line.
 */

const fs = require('fs');
const path = require('path');

// Create Node.js specific version of RenderComparison

const { exit } = require('process');

function printHelp() {
    console.log(`
  Node.js Test Runner for Minimal-2D-Js-Software-Renderer
  ======================================================
  
  Usage: node node-test-runner.js [options]
  
  Options:
    -i, --id <id>         Test ID to run
    -e, --example <num>   Specific example number to run
    -c, --count <num>     Number of examples to run
    -r, --range <s-e>     Range of examples to run (e.g., 1-10)
    -p, --progress        Show progress indicator
    -l, --list            List all available tests
    -o, --output <dir>    Directory to save output images (default: ./test-output)
    -t, --test            Run one frame for all comparisons in the registry
    -v, --verbose         Show detailed test output
    -h, --help            Display this help information
  
  Examples:
    node node-test-runner.js --list
    node node-test-runner.js --id=thin-black-lines-2 --example=5
    node node-test-runner.js --test --output=./test-output
    node node-test-runner.js --id=random-circles --count=100 --progress
    node node-test-runner.js --id=all-shapes --range=1-5 --output=./results
  `);
  }
  
  // Simple argument parser
  function parseArgs(args) {
    const options = {
      output: './test-output' // Default output directory
    };
    
    for (let i = 2; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--list' || arg === '-l') {
        options.list = true;
      } else if (arg === '--progress' || arg === '-p') {
        options.progress = true;
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--test' || arg === '-t') {
        options.test = true;
      } else if (arg.startsWith('--id=')) {
        options.id = arg.substring(5);
      } else if (arg.startsWith('--example=')) {
        options.example = parseInt(arg.substring(10));
      } else if (arg.startsWith('--count=')) {
        options.count = parseInt(arg.substring(8));
      } else if (arg.startsWith('--range=')) {
        options.range = arg.substring(8);
      } else if (arg.startsWith('--output=')) {
        options.output = arg.substring(9);
      } else if (arg === '--id' || arg === '-i') {
        if (i + 1 < args.length) options.id = args[++i];
      } else if (arg === '--example' || arg === '-e') {
        if (i + 1 < args.length) options.example = parseInt(args[++i]);
      } else if (arg === '--count' || arg === '-c') {
        if (i + 1 < args.length) options.count = parseInt(args[++i]);
      } else if (arg === '--range' || arg === '-r') {
        if (i + 1 < args.length) options.range = args[++i];
      } else if (arg === '--output' || arg === '-o') {
        if (i + 1 < args.length) options.output = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        printHelp();
        process.exit(0);
      }
    }
    
    return options;
  }
  
  // Parse command line arguments
  const options = parseArgs(process.argv);
  
  // Display help if no arguments provided
  if (process.argv.length <= 2) {
    printHelp();
    process.exit(0);
  }
  
  // Export image data for tests
  function saveOutputImage(test, exampleNum, outputDir) {
    try {
      console.log(`Saving image for test ${test.id}, example ${exampleNum} to ${outputDir}`);
      
      // Use the built-in exportBMP method
      const filePath = test.exportBMP(outputDir, exampleNum);
      
      if (filePath) {
        console.log(`  Saved BMP to ${filePath}`);
        return filePath;
      } else {
        console.error(`  Failed to save output image`);
        return null;
      }
    } catch (err) {
      console.error(`  Failed to save output image: ${err.message}`);
      console.error(err.stack);
      return null;
    }
  }
  
  // Save test results as text
  function saveTestResults(testId, exampleNum, test, outputDir) {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create result text
      let resultText = `Test: ${test.title}\n`;
      resultText += `ID: ${testId}\n`;
      resultText += `Example: ${exampleNum}\n`;
      resultText += `Errors: ${test.errorCount}\n\n`;
      
      if (test.errorCount > 0) {
        resultText += 'Error Messages:\n';
        test.errors.forEach((error, index) => {
          resultText += `${index + 1}. ${error}\n`;
        });
      }
      
      // Add metrics results if available
      if (test.metricsFunction) {
        resultText += '\nMetrics:\n';
        resultText += test.metricsFunction(test) || "No metrics available";
      }
      
      // Save to file
      const logFilename = `${testId}-example${exampleNum}-results.txt`;
      const logFilePath = path.join(outputDir, logFilename);
      fs.writeFileSync(logFilePath, resultText);
      
      console.log(`  Saved results to ${logFilePath}`);
      return logFilePath;
    } catch (err) {
      console.error(`  Failed to save test results: ${err.message}`);
      return null;
    }
  }
  
  // Main execution function
  function main() {
    // Handle --list option to show all tests
    if (options.list) {
      console.log('Available tests:');
      Object.keys(RenderComparison.registry).sort().forEach(id => {
        const test = RenderComparison.registry[id];
        console.log(`  ${id} - ${test.title}`);
      });
      process.exit(0);
    }
  
    // Handle --test option to run one frame for all registered comparisons
    if (options.test) {
      console.log('Running one frame for all registered comparisons...');
      
      const testIds = Object.keys(RenderComparison.registry).sort();
      console.log(`Found ${testIds.length} registered comparisons.`);
      
      // Create output directory if needed
      if (options.output) {
        if (!fs.existsSync(options.output)) {
          fs.mkdirSync(options.output, { recursive: true });
        }
      }
      
      let totalTests = testIds.length;
      let passedTests = 0;
      let failedTests = 0;
      
      // Show progress if requested
      const showProgress = options.progress;
      
      // Run all tests with example #1
      testIds.forEach((testId, index) => {
        const test = RenderComparison.registry[testId];
        const exampleNum = 1; // Always use example #1 for the --test option
        
        if (showProgress) {
          const percent = Math.floor((index / totalTests) * 100);
          process.stdout.write(`\rProgress: ${percent}% [${index}/${totalTests}] - Running ${testId}`);
        } else {
          console.log(`Running test ${index+1}/${totalTests}: ${testId} - ${test.title}`);
        }
        
        // Set verbosity on the test
        test.verbose = options.verbose;
        
        try {
          const success = test.render(test.buildShapesFn, test.canvasCodeFn, exampleNum);
          
          if (success) {
            passedTests++;
            if (options.verbose) {
              console.log(`\n${testId} passed`);
            }
          } else {
            failedTests++;
            console.log(`\n${testId} failed with ${test.errorCount} error(s)`);
          }
          
          // Save output regardless of success/failure
          if (options.output) {
            // Create test-specific subdirectory
            const testOutputDir = path.join(options.output, testId);
            if (!fs.existsSync(testOutputDir)) {
              fs.mkdirSync(testOutputDir, { recursive: true });
            }
            
            const imagePath = saveOutputImage(test, exampleNum, testOutputDir);
            const resultPath = saveTestResults(testId, exampleNum, test, testOutputDir);
          }
        } catch (err) {
          failedTests++;
          console.error(`\nError running test ${testId}: ${err.message}`);
          if (options.verbose) {
            console.error(err.stack);
          }
        }
      });
      
      if (showProgress) {
        process.stdout.write('\rProgress: 100% [Complete]                    \n');
      }
      
      // Print summary
      console.log(`\nTest execution complete`);
      console.log(`Total tests: ${totalTests}`);
      console.log(`Passed: ${passedTests}`);
      console.log(`Failed: ${failedTests}`);
      
      // Return appropriate exit code
      process.exit(failedTests > 0 ? 1 : 0);
    }
  
    // Standard single test run mode
    if (!options.id) {
      console.error('Error: Test ID is required. Use --list to see available tests, or use --test to run all tests.');
      process.exit(1);
    }
  
    const testId = options.id;
    const test = RenderComparison.registry[testId];
    if (!test) {
      console.error(`Error: Test with ID "${testId}" not found. Use --list to see available tests.`);
      process.exit(1);
    }
  
    // Set verbosity on the test
    test.verbose = options.verbose;
  
    // Determine which examples to run
    let exampleNumbers = [];
  
    if (options.example) {
      exampleNumbers = [parseInt(options.example)];
    } else if (options.count) {
      exampleNumbers = Array.from({length: parseInt(options.count)}, (_, i) => i + 1);
    } else if (options.range) {
      const [start, end] = options.range.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start > end) {
        console.error('Error: Range must be in format "start-end" with start <= end.');
        process.exit(1);
      }
      exampleNumbers = Array.from({length: end - start + 1}, (_, i) => i + start);
    } else {
      // Default to a single example
      exampleNumbers = [1];
    }
  
    // Run the test(s)
    console.log(`Running test: ${test.title}`);
    console.log(`Examples: ${exampleNumbers.length > 1 ? `${exampleNumbers.length} examples` : `example #${exampleNumbers[0]}`}`);
  
    // Show progress if requested
    const showProgress = options.progress && exampleNumbers.length > 1;
    let failedExamples = 0;
    let passedExamples = 0;
  
    // Run the examples
    exampleNumbers.forEach((exampleNum, index) => {
      if (showProgress) {
        const percent = Math.floor((index / exampleNumbers.length) * 100);
        process.stdout.write(`\rProgress: ${percent}% [${index}/${exampleNumbers.length}]`);
      }
  
      const success = test.render(test.buildShapesFn, test.canvasCodeFn, exampleNum);
      
      if (success) {
        passedExamples++;
        if (options.verbose) {
          console.log(`\nExample #${exampleNum} passed`);
        }
        
        // Save output for successful tests as well
        if (options.output) {
          const imagePath = saveOutputImage(test, exampleNum, options.output);
          const resultPath = saveTestResults(testId, exampleNum, test, options.output);
        }
      } else {
        failedExamples++;
        console.log(`\nExample #${exampleNum} failed`);
        
        // Save output for failed tests
        if (options.output) {
          const imagePath = saveOutputImage(test, exampleNum, options.output);
          const resultPath = saveTestResults(testId, exampleNum, test, options.output);
        }
      }
    });
  
    if (showProgress) {
      process.stdout.write('\rProgress: 100% [Complete]                    \n');
    }
  
    // Print summary
    console.log(`\nTest execution complete`);
    console.log(`Passed: ${passedExamples}`);
    console.log(`Failed: ${failedExamples}`);
    
    // Return appropriate exit code
    process.exit(failedExamples > 0 ? 1 : 0);
  }

  function initializeTestRegistry() {
    console.log("Initializing test registry with core tests...");
    addRenderComparisons();
  }
  
  // Call initialization function
  try {
    // Make sure the registry property is correctly set
    
    // Initialize with our core tests
    initializeTestRegistry();
    console.log(`Registered ${Object.keys(RenderComparison.registry).length} test comparisons.`);
  } catch (err) {
    console.error("Error registering test comparisons:", err);
  }
  
