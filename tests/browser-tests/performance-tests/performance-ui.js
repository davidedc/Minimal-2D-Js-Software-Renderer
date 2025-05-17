// Main user interface functionality for performance tests

// Function to dynamically generate test list with checkboxes and run buttons
function generateTestButtons() {
  // Only build dynamic UI if we're in a modern environment
  if (typeof document.querySelector !== 'function') return;
  
  // Get containers for each test type
  const lineTestsContainer = document.getElementById('line-tests');
  const rectangleTestsContainer = document.getElementById('rectangle-tests');
  const roundedRectangleTestsContainer = document.getElementById('rounded-rectangle-tests');
  const circleTestsContainer = document.getElementById('circle-tests');
  
  if (!lineTestsContainer || !rectangleTestsContainer || !circleTestsContainer || !roundedRectangleTestsContainer) return;
  
  // Clear existing content from each container
  lineTestsContainer.innerHTML = '';
  rectangleTestsContainer.innerHTML = '';
  roundedRectangleTestsContainer.innerHTML = '';
  circleTestsContainer.innerHTML = '';
  
  // Create test list containers if there are tests for them
  const linesList = window.PERFORMANCE_TESTS_REGISTRY.some(t => t.category === 'lines') ? createTestList('Lines Tests', lineTestsContainer) : null;
  const rectanglesList = window.PERFORMANCE_TESTS_REGISTRY.some(t => t.category === 'rectangles') ? createTestList('Rectangle Tests', rectangleTestsContainer) : null;
  const roundedRectanglesList = window.PERFORMANCE_TESTS_REGISTRY.some(t => t.category === 'rounded-rectangles') ? createTestList('Rounded Rectangle Tests', roundedRectangleTestsContainer) : null;
  const circlesList = window.PERFORMANCE_TESTS_REGISTRY.some(t => t.category === 'circles') ? createTestList('Circle Tests', circleTestsContainer) : null;
  
  // Add test entries to the appropriate list
  window.PERFORMANCE_TESTS_REGISTRY.forEach(test => {
    let targetListElement; // This will be the actual div.test-list
    
    // Determine which list to add the test to based on test category
    if (test.category === 'lines') {
      targetListElement = linesList;
    } else if (test.category === 'rectangles') {
      targetListElement = rectanglesList;
    } else if (test.category === 'rounded-rectangles') {
      targetListElement = roundedRectanglesList;
    } else if (test.category === 'circles') {
      targetListElement = circlesList;
    }
    
    if (targetListElement) { // targetListElement is now the div.test-list or null
      createTestEntry(test, targetListElement); 
    } else {
      if (test && test.category && !['lines', 'rectangles', 'circles', 'rounded-rectangles'].includes(test.category)) {
        console.warn(`[UI] Test "${test.displayName}" has unhandled category: ${test.category}`);
      }
    }
  });
}

// Create a test list container with a title and check/uncheck all buttons
// MODIFIED: Now takes parentContainer and appends to it, returns the inner list for items.
function createTestList(title, parentContainer) { 
  const listContainer = document.createElement('div'); // This is the outer div.test-list-container
  listContainer.className = 'test-list-container';
  
  const headerContainer = document.createElement('div');
  headerContainer.className = 'test-list-header';
  
  const listTitle = document.createElement('h4');
  listTitle.textContent = title;
  listTitle.className = 'test-list-title';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'checkbox-buttons';
  
  const checkAllBtn = document.createElement('button');
  checkAllBtn.textContent = 'Check All';
  checkAllBtn.className = 'small-button';
  
  const listItemsDiv = document.createElement('div'); // This is the div.test-list for items
  listItemsDiv.className = 'test-list';

  checkAllBtn.addEventListener('click', () => {
    listItemsDiv.querySelectorAll('.test-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });
  });
  
  const uncheckAllBtn = document.createElement('button');
  uncheckAllBtn.textContent = 'Uncheck All';
  uncheckAllBtn.className = 'small-button';
  uncheckAllBtn.addEventListener('click', () => {
    listItemsDiv.querySelectorAll('.test-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
  });
  
  buttonContainer.appendChild(checkAllBtn);
  buttonContainer.appendChild(uncheckAllBtn);
  
  headerContainer.appendChild(listTitle);
  headerContainer.appendChild(buttonContainer);
  
  listContainer.appendChild(headerContainer);
  listContainer.appendChild(listItemsDiv); // Append the item list div
  
  if (parentContainer) { // Append the whole created structure to the main category div on the page
      parentContainer.appendChild(listContainer);
  }
  
  return listItemsDiv; // Return the inner list (div.test-list) for direct item appending
}

// Create a test entry with checkbox and run button
// actualListElement is now expected to be the div with class 'test-list'
function createTestEntry(test, actualListElement) {
  const testItem = document.createElement('div');
  testItem.className = 'test-item';
  
  // Create checkbox for test selection
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'test-checkbox';
  checkbox.dataset.testId = test.id;
  
  // Create label for test description
  const label = document.createElement('label');
  label.className = 'test-label';
  label.textContent = test.displayName;
  
  // Create run button for individual test
  const runButton = document.createElement('button');
  runButton.textContent = 'Run';
  runButton.className = 'test-button run-button';
  runButton.dataset.testId = test.id;
  
  // Add event listener to run button
  runButton.addEventListener('click', () => runTest(test));
  
  // Add elements to test item
  testItem.appendChild(checkbox);
  testItem.appendChild(label);
  testItem.appendChild(runButton);

  // The 'actualListElement' IS the actualListElement we want to append to.
  if (actualListElement) { // Check if actualListElement is not null
      actualListElement.appendChild(testItem);
  } else {
      console.error('[UI] In createTestEntry, actualListElement is null or undefined. Cannot append testItem for:', test ? test.id : 'N/A');
  }
  
  return testItem;
}

// Initialize UI
function initializeUI() {
  // Hide all canvases initially
  hideAllCanvases();
  
  // Generate test buttons dynamically based on test definitions
  generateTestButtons();
  
  // Add event listeners for check/uncheck all buttons
  document.getElementById('btn-check-all').addEventListener('click', checkAllTests);
  document.getElementById('btn-uncheck-all').addEventListener('click', uncheckAllTests);
  
  // Detect refresh rate before allowing tests to run
  if (!refreshRateDetected) {
    // Disable test buttons until refresh rate is detected
    setButtonsState(false);
    
    // Show detection message
    resultsContainer.innerHTML = "Detecting display refresh rate... Please wait.\n";
    
    // Start refresh rate detection
    detectRefreshRate(() => {
      // Enable buttons once detection is complete
      setButtonsState(true);
      
      // Show detection result
      resultsContainer.innerHTML = `Display refresh rate detected: ${DETECTED_FPS} fps (standard rate, raw detected: ${window.RAW_DETECTED_FPS || DETECTED_FPS} fps)\nFrame budget: ${FRAME_BUDGET.toFixed(2)}ms\nReady to run tests.\n`;
    });
  }
}

// Check all tests across all categories
function checkAllTests() {
  document.querySelectorAll('.test-checkbox').forEach(checkbox => {
    checkbox.checked = true;
  });
}

// Uncheck all tests across all categories
function uncheckAllTests() {
  document.querySelectorAll('.test-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });
}

// Profiling mode toggle
document.getElementById('btn-profiling-mode').addEventListener('click', function() {
  const button = this;
  const isProfilingMode = button.textContent.includes('Disable');
  
  if (isProfilingMode) {
    // Disable profiling mode
    button.textContent = 'Enable Profiling Mode';
    button.style.backgroundColor = '#007bff';
    consecutiveExceedances.value = '10';
    quietModeCheckbox.checked = true; // Keep quiet mode enabled by default
  } else {
    // Enable profiling mode
    button.textContent = 'Disable Profiling Mode';
    button.style.backgroundColor = '#ff4d4d';
    consecutiveExceedances.value = '100000';
    quietModeCheckbox.checked = true;
    
    // Show a quick hint
    const originalHtml = resultsContainer.innerHTML;
    resultsContainer.innerHTML = "Profiling mode enabled. Tests will run without stopping at the frame budget, allowing you to use browser profiling tools on stable rendering.\n\n" + originalHtml;
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
  }
});

// Button event listeners for standard controls
btnRunChecked.addEventListener('click', runCheckedTests);
btnRunAll.addEventListener('click', runAllTests);
btnAbort.addEventListener('click', abortTests);

// Run all checked tests
function runCheckedTests() {
  // Get all checked checkboxes
  const checkedBoxes = document.querySelectorAll('.test-checkbox:checked');
  
  // Create array of tests to run
  const testsToRun = [];
  checkedBoxes.forEach(checkbox => {
    const testId = checkbox.dataset.testId;
    const test = findTestById(testId);
    if (test) {
      testsToRun.push(test);
    }
  });
  
  // Check if no tests are selected
  if (testsToRun.length === 0) {
    resultsContainer.innerHTML = "No tests selected. Please check at least one test to run.\n";
    return;
  }
  
  // Run the selected tests
  runTestSeries(testsToRun, `Running ${testsToRun.length} checked tests...`);
}

// Run all tests regardless of checkbox state
function runAllTests() {
  const testsToRun = window.PERFORMANCE_TESTS_REGISTRY.slice(); // Get a copy of all tests from the registry
  runTestSeries(testsToRun, "Running all tests...");
}

// Common function to run a series of tests
function runTestSeries(testsToRun, statusMessage) {
  let currentIndex = 0;
  
  // Clear previous results
  resultsContainer.innerHTML = statusMessage + "\n\n";
  
  // Update overall progress label to include test count
  document.querySelector('#overall-progress-container .progress-label').textContent = `Overall progress (0/${testsToRun.length}):`;
  
  // Show overall progress bar
  overallProgressContainer.style.display = 'block';
  overallProgressBar.style.width = '0%';
  overallProgressBar.textContent = '0%';
  
  // Set text color to dark when progress is 0%
  overallProgressBar.style.color = '#333';
  
  // Store results for overall summary
  const allResults = {
    tests: [],
    swMaxShapes: [],
    canvasMaxShapes: [],
    ratios: []
  };
  
  function runNextTest() {
    if (currentIndex < testsToRun.length && !abortRequested) {
      // Update overall progress
      const overallProgress = Math.round((currentIndex / testsToRun.length) * 100);
      overallProgressBar.style.width = overallProgress + '%';
      overallProgressBar.textContent = overallProgress + '%';
      
      // Set text color to white when progress is greater than 0%
      if (overallProgress > 0) {
        overallProgressBar.style.color = 'white';
      }
      
      // Update test count in progress label
      document.querySelector('#overall-progress-container .progress-label').textContent = 
        `Overall progress (${currentIndex + 1}/${testsToRun.length}):`;
      
      runTest(testsToRun[currentIndex], (testResults) => {
        // Store individual test results
        allResults.tests.push(testsToRun[currentIndex].displayName);
        allResults.swMaxShapes.push(testResults.swMaxShapes);
        allResults.canvasMaxShapes.push(testResults.canvasMaxShapes);
        allResults.ratios.push(testResults.ratio);
        
        currentIndex++;
        runNextTest();
      }, false);
    } else {
      // Update overall progress to 100% when done
      overallProgressBar.style.width = '100%';
      overallProgressBar.textContent = '100%';
      
      // Show overall results after all tests are done
      displayOverallResults(allResults);
      
      // Hide overall progress bar after a short delay
      setTimeout(() => {
        overallProgressContainer.style.display = 'none';
      }, 1000);
      
      resetTestState();
    }
  }
  
  runNextTest();
}

// Find test by ID
function findTestById(testId) {
  return window.PERFORMANCE_TESTS_REGISTRY.find(test => test.id === testId);
}

function abortTests() {
  abortRequested = true;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  hideAllCanvases();
  resetTestState();
  resultsContainer.innerHTML += "Tests aborted by user.\n";
}

function resetTestState() {
  currentTest = null;
  abortRequested = false;
  setButtonsState(true);
  
  // Reset the test progress labels to default
  document.querySelector('#current-test-progress-container .progress-label').textContent = 'Current test progress:';
  document.querySelector('#overall-progress-container .progress-label').textContent = 'Overall progress:';
  
  // Reset progress bars
  currentTestProgressBar.style.width = '0%';
  currentTestProgressBar.textContent = '0%';
  currentTestProgressBar.style.color = '#333';
  
  overallProgressBar.style.width = '0%';
  overallProgressBar.textContent = '0%';
  overallProgressBar.style.color = '#333';
  
  // Hide progress bars
  currentTestProgressContainer.style.display = 'none';
  overallProgressContainer.style.display = 'none'; // Also hide overall progress bar
}

function setButtonsState(enabled) {
  // Disable static buttons
  btnRunChecked.disabled = !enabled;
  btnRunAll.disabled = !enabled;
  btnAbort.disabled = enabled;
  
  // Disable all run buttons
  document.querySelectorAll('.run-button').forEach(btn => {
    btn.disabled = !enabled;
  });
  
  // Disable all checkboxes
  document.querySelectorAll('.test-checkbox').forEach(checkbox => {
    checkbox.disabled = !enabled;
  });
}

// Get a reference to the new input field at the top level
const numRunsInput = document.getElementById('num-runs');
const swStartCountInput = document.getElementById('sw-start-count');
const htmlStartCountInput = document.getElementById('html-start-count');

function runTest(testType, callback = null, clearResults = true) {
  setButtonsState(false);
  currentTest = testType;
  abortRequested = false;
  
  // Get test parameters
  const swIncrement = parseInt(swIncrementSize.value);
  const htmlIncrement = parseInt(htmlIncrementSize.value);
  const swStartCount = parseInt(swStartCountInput.value) || 10; // Get SW start count, default 10
  const htmlStartCount = parseInt(htmlStartCountInput.value) || 10; // Get HTML start count, default 10
  const requiredExceedances = parseInt(consecutiveExceedances.value);
  const includeBlitting = includeBlittingCheckbox.checked;
  const isQuietMode = quietModeCheckbox.checked;
  const numRuns = parseInt(numRunsInput.value) || 1; // Get number of runs, default to 1
  
  // Get the test's display name
  const testDisplayName = testType.displayName;
  
  // Clear previous results if not part of "Run All Tests"
  if (clearResults) {
    let header = `Running ${testDisplayName} test (averaging ${numRuns} runs) with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isQuietMode ? ' in quieter mode' : ''}...\n\n`;
    resultsContainer.innerHTML = header;
  } else {
    let header = `\nRunning ${testDisplayName} test (averaging ${numRuns} runs) with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isQuietMode ? ' in quieter mode' : ''}...\n\n`;
    resultsContainer.innerHTML += header;
  }
  
  // Update current test label to include test name and run count
  document.querySelector('#current-test-progress-container .progress-label').textContent = 
    `Current test progress (${testDisplayName}, ${numRuns} runs):`;
  
  // Show progress bar
  currentTestProgressContainer.style.display = 'block';
  currentTestProgressBar.style.width = '0%';
  currentTestProgressBar.textContent = '0%';
  
  // Set text color to dark when progress is 0%
  currentTestProgressBar.style.color = '#333';
  
  // Data structure to accumulate results over multiple runs
  const accumulatedData = {
    swMaxShapesTotal: 0,
    canvasMaxShapesTotal: 0,
    runCount: 0,
    individualRatios: [] // Array to store ratios from each run
  };

  // Variable to store the detailed data from the last completed run for charting
  let lastSingleRunData = null;

  // Function to run a single iteration of the test
  function runSingleIteration(iterationCallback) {
    // Temporary data structure for a single run
    const singleRunData = {
      testType: testType,
      testDisplayName: testDisplayName,
      swIncrement,
      htmlIncrement,
      includeBlitting,
      requiredExceedances,
      isQuietMode,
      swShapeCounts: [],
      swTimings: [],
      swMaxShapes: 0,
      canvasShapeCounts: [],
      canvasTimings: [],
      canvasMaxShapes: 0
    };
    
    // Add run number to results log
    const runNum = accumulatedData.runCount + 1;
    resultsContainer.innerHTML += `Starting Run ${runNum}/${numRuns}...\n`;
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
    
    // Start with the software canvas test
    showSwCanvas();
    runSoftwareCanvasRampTest(testType, swStartCount, swIncrement, includeBlitting, requiredExceedances, singleRunData, () => {
      if (abortRequested) return iterationCallback(null); // Abort early if requested
      
      // After SW canvas test completes, run HTML5 canvas test
      showHtml5Canvas();
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      
      runHTML5CanvasRampTest(testType, htmlStartCount, htmlIncrement, requiredExceedances, singleRunData, () => {
        if (abortRequested) return iterationCallback(null); // Abort early if requested
        
        // Accumulate results from this run
        accumulatedData.swMaxShapesTotal += singleRunData.swMaxShapes;
        accumulatedData.canvasMaxShapesTotal += singleRunData.canvasMaxShapes;
        accumulatedData.runCount++;

        // Calculate and store the ratio for this specific run
        const runRatio = singleRunData.canvasMaxShapes / singleRunData.swMaxShapes;
        accumulatedData.individualRatios.push(runRatio); 

        // Store this run's data in case it's the last one
        lastSingleRunData = singleRunData; 

         // Log results for this run
        resultsContainer.innerHTML += `  Run ${runNum} complete: SW Max = ${singleRunData.swMaxShapes}, HTML Max = ${singleRunData.canvasMaxShapes}\n`;
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
        
        // Call the iteration callback, passing the single run data (though we mainly use accumulated)
        iterationCallback(singleRunData);
      });
    });
  }
  
  // Loop through the required number of runs
  function runAverageLoop() {
    if (accumulatedData.runCount < numRuns && !abortRequested) {
      // Update progress bar based on runs completed within the current test
      const currentRunProgress = Math.round((accumulatedData.runCount / numRuns) * 100);
      currentTestProgressBar.style.width = currentRunProgress + '%';
      currentTestProgressBar.textContent = currentRunProgress + '%';
      if (currentRunProgress > 0) {
        currentTestProgressBar.style.color = 'white';
      } else {
        currentTestProgressBar.style.color = '#333';
      }
      
      runSingleIteration(() => {
        if (!abortRequested) {
          // Slight delay before starting the next run to allow UI updates
          setTimeout(runAverageLoop, 50); 
        } else {
          // Handle abortion during the loop
          finalizeTest(null); // Pass null to indicate abortion
        }
      });
    } else {
      // All runs complete (or aborted)
      finalizeTest(accumulatedData);
    }
  }
  
  // Function to finalize the test after all runs (or abortion)
  function finalizeTest(finalAccumulatedData) {
    if (abortRequested && !finalAccumulatedData) {
      resultsContainer.innerHTML += "\nTest aborted during averaging runs.\n";
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      hideAllCanvases();
      resetTestState();
      if (callback) callback(null); // Indicate abortion to series runner
      return;
    }
    
    // Calculate averages
    const avgSwMaxShapes = finalAccumulatedData.swMaxShapesTotal / finalAccumulatedData.runCount;
    const avgCanvasMaxShapes = finalAccumulatedData.canvasMaxShapesTotal / finalAccumulatedData.runCount;
    const avgRatio = avgCanvasMaxShapes / avgSwMaxShapes;
    
    // Prepare final results structure (similar to original testData but with averaged values)
    const finalResultsData = {
      testType: testType,
      testDisplayName: testDisplayName,
      swIncrement,
      htmlIncrement,
      swStartCount,
      htmlStartCount,
      includeBlitting,
      requiredExceedances,
      isQuietMode,
      numRuns: finalAccumulatedData.runCount, // Store actual number of completed runs
      // Use averaged results
      swMaxShapes: avgSwMaxShapes,
      canvasMaxShapes: avgCanvasMaxShapes,
      ratio: avgRatio,
      // Keep timings/counts from the last run for the chart (or could average these too if needed)
      // For simplicity, let's assume the structure for display/charting uses the last run's details if needed
      // Use detailed data from the *last* completed run for charting purposes.
      swShapeCounts: lastSingleRunData ? lastSingleRunData.swShapeCounts : [],
      swTimings: lastSingleRunData ? lastSingleRunData.swTimings : [],
      canvasShapeCounts: lastSingleRunData ? lastSingleRunData.canvasShapeCounts : [],
      canvasTimings: lastSingleRunData ? lastSingleRunData.canvasTimings : [],
      individualRatios: finalAccumulatedData.individualRatios // Pass the list of individual ratios
    };
    
    // Hide all canvases when test is complete
    hideAllCanvases();
    
    // Display final averaged results
    displayRampTestResults(finalResultsData); // Ensure this function can handle numRuns property
    
    // Generate performance chart (using averaged max shapes, needs consideration for detailed data)
    generatePerformanceChart(finalResultsData); // Ensure this can handle potentially missing detailed data if not averaged
    
    // Update progress bar to 100% for the current test
    currentTestProgressBar.style.width = '100%';
    currentTestProgressBar.textContent = '100%';
    currentTestProgressBar.style.color = 'white';
    
    // Hide current test progress bar after a short delay
    setTimeout(() => {
      currentTestProgressContainer.style.display = 'none';
    }, 1000);
    
    // Reset test state if not part of "Run All Tests"
    if (!callback) {
      resetTestState();
    }
    
    // Call callback if provided (for runTestSeries), passing the final averaged results
    if (callback) callback(finalResultsData);
  }
  
  // Start the averaging loop
  runAverageLoop();
}

// Initialize UI when script loads
initializeUI();