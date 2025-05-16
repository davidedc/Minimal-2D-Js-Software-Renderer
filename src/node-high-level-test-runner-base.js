/**
 * Node.js Test Runner for Minimal-2D-Js-Software-Renderer - High Level Tests
 * ==========================================================================
 * 
 * This script runs high-level software renderer tests in Node.js without a browser.
 * It uses tests defined in individual test files within tests/browser-tests/test-cases/
 * to run tests via command line.
 */

const fs = require('fs');
const path = require('path');

// Node.js specific version of RenderTest should already be loaded via concatenation

const { exit } = require('process');

function printHelp() {
    console.log(`
  Node.js High-Level Test Runner for Minimal-2D-Js-Software-Renderer
  ===================================================================
  
  Usage: node node-high-level-test-runner.js [options]
  
  Options:
    -i, --id <id>         Test ID to run
    -I, --iteration <num> Specific iteration number to run (uppercase I to avoid clash with id's -i)
    -c, --count <num>     Number of iterations to run
    -r, --range <s-e>     Range of iterations to run (e.g., 1-10)
    -p, --progress        Show progress indicator
    -l, --list            List all available tests
    -o, --output <dir>    Directory to save output images (default: ./test-output-high-level)
    -t, --test            Run one iteration for all tests in the registry
    -v, --verbose         Show detailed test output
    -h, --help            Display this help information
  
  Examples:
    node node-high-level-test-runner.js --list
    node node-high-level-test-runner.js --id=lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient --iteration=5
    node node-high-level-test-runner.js --test --output=./test-output-high-level
    node node-high-level-test-runner.js --id=rectangles--L-size--filled--1px-opaque-stroke--smooth-pixel-pos-and-size--no-rotation --count=100 --progress
    node node-high-level-test-runner.js --id=circles--M-size--filled--no-stroke--smooth-pixel-pos--smooth-radius --range=1-5 --output=./results-high-level
  `);
  }
  
  // Simple argument parser
  function parseArgs(args) {
    const options = {
      output: './test-output-high-level' // Default output directory
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
      } else if (arg.startsWith('--iteration=')) { // Keep matching long form
        options.iteration = parseInt(arg.substring(12));
      } else if (arg.startsWith('--count=')) {
        options.count = parseInt(arg.substring(8));
      } else if (arg.startsWith('--range=')) {
        options.range = arg.substring(8);
      } else if (arg.startsWith('--output=')) {
        options.output = arg.substring(9);
      } else if (arg === '--id' || arg === '-i') {
        if (i + 1 < args.length) options.id = args[++i];
      } else if (arg === '--iteration' || arg === '-I') { // Match short form -I
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
  
  console.log("[High-Level Runner Base] Script top level reached.");

  // Parse command line arguments
  console.log("[High-Level Runner Base] Parsing arguments...");
  const options = parseArgs(process.argv);
  console.log("[High-Level Runner Base] Arguments parsed:", options);

  // Display help if no arguments provided
  if (process.argv.length <= 2) {
    console.log("[High-Level Runner Base] No arguments, printing help and exiting.");
    printHelp();
    process.exit(0);
  }
  
  // Export image data for tests
  function saveOutputImage(test, iterationNum, outputDir) {
    try {
      // Create output directory if it doesn't exist (specific path for this test)
      const testOutputDir = path.join(outputDir, test.id);
       if (!fs.existsSync(testOutputDir)) {
         fs.mkdirSync(testOutputDir, { recursive: true });
       }

      console.log(`Saving image for test ${test.id}, iteration ${iterationNum} to ${testOutputDir}`);
      
      // Use the built-in exportBMP method, passing the specific directory
      const filePath = test.exportBMP(testOutputDir, iterationNum);
      
      if (filePath) {
        console.log(`  Saved BMP to ${filePath}`);
        return filePath;
      } else {
        console.error(`  Failed to save output image for test ${test.id}, iteration ${iterationNum}`);
        return null;
      }
    } catch (err) {
      console.error(`  Failed to save output image for test ${test.id}, iteration ${iterationNum}: ${err.message}`);
      console.error(err.stack);
      return null;
    }
  }
  
  // Save test results as text
  function saveTestResults(testId, iterationNum, test, outputDir) {
    try {
      // Create output directory if it doesn't exist (specific path for this test)
      const testOutputDir = path.join(outputDir, test.id);
      if (!fs.existsSync(testOutputDir)) {
        fs.mkdirSync(testOutputDir, { recursive: true });
      }
      
      // Create result text
      let resultText = `Test: ${test.title}\n`;
      resultText += `ID: ${testId}\n`;
      resultText += `Iteration: ${iterationNum}\n`;
      resultText += `Errors: ${test.errorCount}\n\n`;

      // Add Primitive Logs
      if (test.primitiveLogs && test.primitiveLogs.length > 0) {
        resultText += 'Primitives Drawn:\n';
        
        let decodedLogs = test.primitiveLogs.replace(/<br\s*\/?>/gi, '\n'); // Convert <br> to \n first
        
        // Decode numeric HTML entities (hex and decimal)
        decodedLogs = decodedLogs.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
        decodedLogs = decodedLogs.replace(/&#([0-9]+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)));
        
        // Also decode common named entities - &amp; must be last
        decodedLogs = decodedLogs.replace(/&lt;/g, '<');
        decodedLogs = decodedLogs.replace(/&gt;/g, '>');
        decodedLogs = decodedLogs.replace(/&quot;/g, '"');
        decodedLogs = decodedLogs.replace(/&apos;/g, "'");
        decodedLogs = decodedLogs.replace(/&amp;/g, '&');

        const plainTextLogs = decodedLogs
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        resultText += plainTextLogs + '\n\n'; // Add extra newline for separation
      } else {
        resultText += 'Primitives Drawn: None logged.\n\n';
      }
      
      if (test.errorCount > 0) {
        resultText += 'Error Messages:\n';
        test.errors.forEach((error, index) => {
          resultText += `${index + 1}. ${error}\n`;
        });
      }
      
      // Add checks results if available
      if (test.functionToRunAllChecks) {
         // We need to manually execute the check function in Node.js environment
         // It expects the test instance as context.
         let checksLog = "";
         let checkErrorCountBefore = test.errorCount;
         try {
             // Simulate the browser log container (might need refinement if checks use DOM heavily)
             let nodeLogContainer = { innerHTML: "" }; 
             let checkResults = test.functionToRunAllChecks(test, nodeLogContainer); // Pass the test instance
             checksLog = nodeLogContainer.innerHTML; // Capture logs if any check uses it
              // Some checks might return strings or directly call test.showError()
             if (typeof checkResults === 'string' && checkResults) {
                 checksLog += (checksLog ? '\n' : '') + checkResults;
             } else if (test.errorCount > checkErrorCountBefore) {
                 // Errors were added directly via test.showError() during checks
                 checksLog += (checksLog ? '\n' : '') + `Checks resulted in ${test.errorCount - checkErrorCountBefore} new error(s).`;
             } else if (!checksLog) {
                 checksLog = "Checks completed (no specific log output, see errors above if any).";
             }
         } catch (checkErr) {
             checksLog += `\nError during check execution: ${checkErr.message}`;
             console.error(`Error executing checks for ${testId}:`, checkErr);
         }
         resultText += '\nChecks Log:\n';
         resultText += checksLog;
      } else {
         resultText += '\nChecks: No checks configured for this test.\n';
      }
      
      // Save to file
      const logFilename = `iteration${iterationNum}-results.txt`; // Simplified name within test folder
      const logFilePath = path.join(testOutputDir, logFilename);
      fs.writeFileSync(logFilePath, resultText);
      
      console.log(`  Saved results to ${logFilePath}`);
      return logFilePath;
    } catch (err) {
      console.error(`  Failed to save test results for ${testId}, iteration ${iterationNum}: ${err.message}`);
      return null;
    }
  }
  
  // Main execution function
  function main() {
    console.log("[High-Level Runner Base] main() function started.");
    
    // Ensure RenderTest registry exists (it should be populated by concatenated test files)
    const registrySize = Object.keys(RenderTest.registry).length;
    console.log(`[High-Level Runner Base] Found ${registrySize} tests registered.`);
    if (registrySize === 0) {
        console.warn("Warning: No tests found in the registry. Ensure test files were correctly concatenated and executed.");
        // Don't exit immediately, maybe --list was intended
    }


    // Handle --list option to show all tests
    if (options.list) {
      console.log("[High-Level Runner Base] Executing --list command.");
      console.log('Available high-level tests:');
      if (registrySize > 0) {
         Object.keys(RenderTest.registry).sort().forEach(id => {
           const test = RenderTest.registry[id];
           console.log(`  ${id} - ${test.title}`);
         });
      } else {
          console.log("  (No tests registered)");
      }
      process.exit(0);
    }
  
    // Handle --test option to run one iteration for all registered tests
    if (options.test) {
      console.log("[High-Level Runner Base] Executing --test command.");
      console.log('Running one iteration for all registered high-level tests...');
      
      const testIds = Object.keys(RenderTest.registry).sort();
      
      if (testIds.length === 0) {
          console.error("Error: No tests found to run with --test option.");
          process.exit(1);
      }
      
      // Create base output directory if needed
      if (options.output) {
        if (!fs.existsSync(options.output)) {
          fs.mkdirSync(options.output, { recursive: true });
          console.log(`Created output directory: ${options.output}`);
        }
      } else {
          console.log("No output directory specified. Results and images will not be saved.");
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
          process.stdout.write(`Progress: ${percent}% [${index}/${totalTests}] - Running ${testId}`);
        } else {
          console.log(`
Running test ${index+1}/${totalTests}: ${testId} - ${test.title}`);
        }
        
        // Set verbosity on the test
        test.verbose = options.verbose;
        
        try {
           // High-level tests primarily use canvasCodeFn
          const success = test.render(null, test.canvasCodeFn, iterationNum); 
          
          if (success && test.errorCount === 0) {
            passedTests++;
            if (options.verbose) {
              console.log(`
${testId} passed (Iteration ${iterationNum})`);
            }
          } else {
            failedTests++;
            // Ensure error count is accurate if render returned true but checks failed
            const finalErrorCount = test.errorCount > 0 ? test.errorCount : (!success ? 1 : 0); 
            console.log(`
${testId} failed with ${finalErrorCount} error(s) (Iteration ${iterationNum})`);
             if (options.verbose && test.errors && test.errors.length > 0) {
                 test.errors.forEach((e, i) => console.log(`  Error ${i+1}: ${e}`));
             }
          }
          
          // Save output regardless of success/failure if output dir is set
          if (options.output) {
            const imagePath = saveOutputImage(test, iterationNum, options.output);
            const resultPath = saveTestResults(testId, iterationNum, test, options.output);
          }
        } catch (err) {
          failedTests++;
          console.error(`
Critical error running test ${testId} (Iteration ${iterationNum}): ${err.message}`);
          if (options.verbose) {
            console.error(err.stack);
          }
           // Attempt to save results even on critical error if possible
           if (options.output && test) {
               test.showError(`Critical execution error: ${err.message}`); // Add error to test object
               console.error(err.stack);
               saveTestResults(testId, iterationNum, test, options.output);
           }
        }
        console.log(`[High-Level Runner Base] --test loop: Finished test ${testId}`);
      });
      
      if (showProgress) {
        process.stdout.write('\rProgress: 100% [Complete]                                                              \n');
      }
      
      // Print summary
      console.log(`\nHigh-Level Test execution complete`);
      console.log(`Total tests run: ${totalTests}`);
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
      if (isNaN(start) || isNaN(end) || start <= 0 || start > end) { // Iterations are 1-based
        console.error('Error: Range must be in format "start-end" with 1 <= start <= end.');
        process.exit(1);
      }
      iterationNumbers = Array.from({length: end - start + 1}, (_, i) => i + start);
    } else {
      // Default to a single iteration
      iterationNumbers = [1];
    }
  
    // Run the test(s)
    console.log(`Running high-level test: ${test.title} (ID: ${testId})`);
    if (iterationNumbers.length === 1) {
        console.log(`Running iteration: #${iterationNumbers[0]}`);
    } else {
        console.log(`Running iterations: ${iterationNumbers[0]} to ${iterationNumbers[iterationNumbers.length - 1]} (${iterationNumbers.length} total)`);
    }
  
    // Show progress if requested
    const showProgress = options.progress && iterationNumbers.length > 1;
    let failedIterations = 0;
    let passedIterations = 0;
  
    // Create base output directory if needed
    if (options.output) {
       if (!fs.existsSync(options.output)) {
           fs.mkdirSync(options.output, { recursive: true });
           console.log(`Created output directory: ${options.output}`);
       }
    } else {
        console.log("No output directory specified. Results and images will not be saved.");
    }

    // Run the iterations
    iterationNumbers.forEach((iterationNum, index) => {

      if (showProgress) {
        const percent = Math.floor(((index + 1) / iterationNumbers.length) * 100);
        process.stdout.write(`Progress: ${percent}% [${index + 1}/${iterationNumbers.length}]`);
      } else if (iterationNumbers.length > 1) {
          console.log(`--- Iteration #${iterationNum} ---`);
      }
  
      try {
          // High-level tests primarily use canvasCodeFn
          const success = test.render(null, test.canvasCodeFn, iterationNum);
          
          if (success && test.errorCount === 0) {
            passedIterations++;
            if (options.verbose) {
              console.log(`
Iteration #${iterationNum} passed`);
            }
            
            // Save output for successful tests as well
            if (options.output) {
              const imagePath = saveOutputImage(test, iterationNum, options.output);
              const resultPath = saveTestResults(testId, iterationNum, test, options.output);
            }
          } else {
            failedIterations++;
            const finalErrorCount = test.errorCount > 0 ? test.errorCount : (!success ? 1 : 0);
            console.log(`
Iteration #${iterationNum} failed with ${finalErrorCount} error(s)`);
             if (options.verbose && test.errors && test.errors.length > 0) {
                 test.errors.forEach((e, i) => console.log(`  Error ${i+1}: ${e}`));
             }
            
            // Save output for failed tests
            if (options.output) {
              const imagePath = saveOutputImage(test, iterationNum, options.output);
              const resultPath = saveTestResults(testId, iterationNum, test, options.output);
            }
          }
      } catch (err) {
          failedIterations++;
          console.error(`
Critical error running test ${testId} (Iteration ${iterationNum}): ${err.message}`);
           if (options.verbose) {
               console.error(err.stack);
           }
            // Attempt to save results even on critical error if possible
            if (options.output && test) {
                test.showError(`Critical execution error: ${err.message}`); // Add error to test object
                console.error(err.stack);
                saveTestResults(testId, iterationNum, test, options.output);
            }
      }
    });
  
    if (showProgress) {
      process.stdout.write('\rProgress: 100% [Complete]                                                              \n');
    }
  
    // Print summary
    console.log(`\nTest execution complete for ${testId}`);
    console.log(`Total Iterations: ${iterationNumbers.length}`);
    console.log(`Passed: ${passedIterations}`);
    console.log(`Failed: ${failedIterations}`);
    
    // Return appropriate exit code
    process.exit(failedIterations > 0 ? 1 : 0);
  }

// No explicit initialization needed here. 
// Test registration happens when the concatenated test files are executed by Node.js
// just before this script's content runs.
// The main() function checks if the registry was populated.

// Append main() call in build script 
//console.log("[High-Level Runner Base] Finished single test run mode.");
