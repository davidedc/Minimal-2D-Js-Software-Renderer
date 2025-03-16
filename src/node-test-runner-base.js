/**
 * Node.js Test Runner for Minimal-2D-Js-Software-Renderer
 * ======================================================
 * 
 * This script runs software renderer tests in Node.js without a browser.
 * It uses tests defined in add-tests.js to run tests via command line.
 */

const fs = require('fs');
const path = require('path');

// Create Node.js specific version of RenderTest

const { exit } = require('process');

function printHelp() {
    console.log(`
  Node.js Test Runner for Minimal-2D-Js-Software-Renderer
  ======================================================
  
  Usage: node node-test-runner.js [options]
  
  Options:
    -i, --id <id>         Test ID to run
    -i, --iteration <num>   Specific iteration number to run
    -c, --count <num>     Number of iterations to run
    -r, --range <s-e>     Range of iterations to run (e.g., 1-10)
    -p, --progress        Show progress indicator
    -l, --list            List all available tests
    -o, --output <dir>    Directory to save output images (default: ./test-output)
    -t, --test            Run one iteration for all tests in the registry
    -v, --verbose         Show detailed test output
    -h, --help            Display this help information
  
  Examples:
    node node-test-runner.js --list
    node node-test-runner.js --id=thin-black-lines-2 --iteration=5
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
      } else if (arg.startsWith('--iteration=')) {
        options.iteration = parseInt(arg.substring(10));
      } else if (arg.startsWith('--count=')) {
        options.count = parseInt(arg.substring(8));
      } else if (arg.startsWith('--range=')) {
        options.range = arg.substring(8);
      } else if (arg.startsWith('--output=')) {
        options.output = arg.substring(9);
      } else if (arg === '--id' || arg === '-i') {
        if (i + 1 < args.length) options.id = args[++i];
      } else if (arg === '--iteration' || arg === '-i') {
        if (i + 1 < args.length) options.iteration = parseInt(args[++i]);
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
  function saveOutputImage(test, iterationNum, outputDir) {
    try {
      console.log(`Saving image for test ${test.id}, iteration ${iterationNum} to ${outputDir}`);
      
      // Use the built-in exportBMP method
      const filePath = test.exportBMP(outputDir, iterationNum);
      
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
  function saveTestResults(testId, iterationNum, test, outputDir) {
    try {
      // Create output directory if it doesn't exist
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Create result text
      let resultText = `Test: ${test.title}\n`;
      resultText += `ID: ${testId}\n`;
      resultText += `Iteration: ${iterationNum}\n`;
      resultText += `Errors: ${test.errorCount}\n\n`;
      
      if (test.errorCount > 0) {
        resultText += 'Error Messages:\n';
        test.errors.forEach((error, index) => {
          resultText += `${index + 1}. ${error}\n`;
        });
      }
      
      // Add checks results if available
      if (test.functionToRunAllChecks) {
        resultText += '\nChecks:\n';
        resultText += test.functionToRunAllChecks(test) || "No checks performed";
      }
      
      // Save to file
      const logFilename = `${testId}-iteration${iterationNum}-results.txt`;
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
      Object.keys(RenderTest.registry).sort().forEach(id => {
        const test = RenderTest.registry[id];
        console.log(`  ${id} - ${test.title}`);
      });
      process.exit(0);
    }
  
    // Handle --test option to run one iteration for all registered tests
    if (options.test) {
      console.log('Running one iteration for all registered tests...');
      
      const testIds = Object.keys(RenderTest.registry).sort();
      console.log(`Found ${testIds.length} registered tests.`);
      
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
      
      // Run all tests with iteration #1
      testIds.forEach((testId, index) => {
        const test = RenderTest.registry[testId];
        const iterationNum = 1; // Always use iteration #1 for the --test option
        
        if (showProgress) {
          const percent = Math.floor((index / totalTests) * 100);
          process.stdout.write(`\rProgress: ${percent}% [${index}/${totalTests}] - Running ${testId}`);
        } else {
          console.log(`Running test ${index+1}/${totalTests}: ${testId} - ${test.title}`);
        }
        
        // Set verbosity on the test
        test.verbose = options.verbose;
        
        try {
          const success = test.render(test.buildShapesFn, test.canvasCodeFn, iterationNum);
          
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
            
            const imagePath = saveOutputImage(test, iterationNum, testOutputDir);
            const resultPath = saveTestResults(testId, iterationNum, test, testOutputDir);
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
    const test = RenderTest.registry[testId];
    if (!test) {
      console.error(`Error: Test with ID "${testId}" not found. Use --list to see available tests.`);
      process.exit(1);
    }
  
    // Set verbosity on the test
    test.verbose = options.verbose;
  
    // Determine which iterations to run
    let iterationNumbers = [];
  
    if (options.iteration) {
      iterationNumbers = [parseInt(options.iteration)];
    } else if (options.count) {
      iterationNumbers = Array.from({length: parseInt(options.count)}, (_, i) => i + 1);
    } else if (options.range) {
      const [start, end] = options.range.split('-').map(Number);
      if (isNaN(start) || isNaN(end) || start > end) {
        console.error('Error: Range must be in format "start-end" with start <= end.');
        process.exit(1);
      }
      iterationNumbers = Array.from({length: end - start + 1}, (_, i) => i + start);
    } else {
      // Default to a single iteration
      iterationNumbers = [1];
    }
  
    // Run the test(s)
    console.log(`Running test: ${test.title}`);
    console.log(`Iterations: ${iterationNumbers.length > 1 ? `${iterationNumbers.length} iterations` : `iteration #${iterationNumbers[0]}`}`);
  
    // Show progress if requested
    const showProgress = options.progress && iterationNumbers.length > 1;
    let failedIterations = 0;
    let passedIterations = 0;
  
    // Run the iterations
    iterationNumbers.forEach((iterationNum, index) => {
      if (showProgress) {
        const percent = Math.floor((index / iterationNumbers.length) * 100);
        process.stdout.write(`\rProgress: ${percent}% [${index}/${iterationNumbers.length}]`);
      }
  
      const success = test.render(test.buildShapesFn, test.canvasCodeFn, iterationNum);
      
      if (success) {
        passedIterations++;
        if (options.verbose) {
          console.log(`\nIteration #${iterationNum} passed`);
        }
        
        // Save output for successful tests as well
        if (options.output) {
          const imagePath = saveOutputImage(test, iterationNum, options.output);
          const resultPath = saveTestResults(testId, iterationNum, test, options.output);
        }
      } else {
        failedIterations++;
        console.log(`\nIteration #${iterationNum} failed`);
        
        // Save output for failed tests
        if (options.output) {
          const imagePath = saveOutputImage(test, iterationNum, options.output);
          const resultPath = saveTestResults(testId, iterationNum, test, options.output);
        }
      }
    });
  
    if (showProgress) {
      process.stdout.write('\rProgress: 100% [Complete]                    \n');
    }
  
    // Print summary
    console.log(`\nTest execution complete`);
    console.log(`Passed: ${passedIterations}`);
    console.log(`Failed: ${failedIterations}`);
    
    // Return appropriate exit code
    process.exit(failedIterations > 0 ? 1 : 0);
  }

  function initializeTestRegistry() {
    console.log("Initializing test registry with core tests...");
    loadLowLevelRenderTests();
  }
  
  // Call initialization function
  try {
    // Make sure the registry property is correctly set
    
    // Initialize with our core tests
    initializeTestRegistry();
    console.log(`Registered ${Object.keys(RenderTest.registry).length} tests.`);
  } catch (err) {
    console.error("Error registering tests:", err);
  }
  
