// Main user interface functionality for performance tests

// Function to dynamically generate test list with checkboxes and run buttons
function generateTestButtons() {
  // Only build dynamic UI if we're in a modern environment
  if (typeof document.querySelector !== 'function') return;
  
  // Get containers for each test type
  const lineTestsContainer = document.getElementById('line-tests');
  const rectangleTestsContainer = document.getElementById('rectangle-tests');
  const circleTestsContainer = document.getElementById('circle-tests');
  
  if (!lineTestsContainer || !rectangleTestsContainer || !circleTestsContainer) return;
  
  // Clear existing content from each container
  lineTestsContainer.innerHTML = '';
  rectangleTestsContainer.innerHTML = '';
  circleTestsContainer.innerHTML = '';
  
  // Create test list containers
  const linesList = createTestList('Lines Tests');
  const rectanglesList = createTestList('Rectangle Tests');
  const circlesList = createTestList('Circle Tests');
  
  lineTestsContainer.appendChild(linesList);
  rectangleTestsContainer.appendChild(rectanglesList);
  circleTestsContainer.appendChild(circlesList);
  
  // Add test entries to the appropriate list
  Object.values(TESTS).forEach(test => {
    let listContainer;
    
    // Determine which container to add the test to based on test id
    if (test.id.startsWith('lines')) {
      listContainer = linesList;
    } else if (test.id.startsWith('rectangles')) {
      listContainer = rectanglesList;
    } else if (test.id.startsWith('circles')) {
      listContainer = circlesList;
    }
    
    if (listContainer) {
      createTestEntry(test, listContainer);
    }
  });
}

// Create a test list container with a title and check/uncheck all buttons
function createTestList(title) {
  const listContainer = document.createElement('div');
  listContainer.className = 'test-list-container';
  
  // Create header container with title and buttons
  const headerContainer = document.createElement('div');
  headerContainer.className = 'test-list-header';
  
  // Create title
  const listTitle = document.createElement('h4');
  listTitle.textContent = title;
  listTitle.className = 'test-list-title';
  
  // Create check/uncheck buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'checkbox-buttons';
  
  // Check all button
  const checkAllBtn = document.createElement('button');
  checkAllBtn.textContent = 'Check All';
  checkAllBtn.className = 'small-button';
  checkAllBtn.addEventListener('click', () => {
    // Find all checkboxes in this list and check them
    const container = listContainer.querySelector('.test-list');
    if (container) {
      container.querySelectorAll('.test-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });
    }
  });
  
  // Uncheck all button
  const uncheckAllBtn = document.createElement('button');
  uncheckAllBtn.textContent = 'Uncheck All';
  uncheckAllBtn.className = 'small-button';
  uncheckAllBtn.addEventListener('click', () => {
    // Find all checkboxes in this list and uncheck them
    const container = listContainer.querySelector('.test-list');
    if (container) {
      container.querySelectorAll('.test-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
    }
  });
  
  // Add buttons to container
  buttonContainer.appendChild(checkAllBtn);
  buttonContainer.appendChild(uncheckAllBtn);
  
  // Add title and buttons to header
  headerContainer.appendChild(listTitle);
  headerContainer.appendChild(buttonContainer);
  
  // Create list for test items
  const list = document.createElement('div');
  list.className = 'test-list';
  
  // Add components to container
  listContainer.appendChild(headerContainer);
  listContainer.appendChild(list);
  
  return list;
}

// Create a test entry with checkbox and run button
function createTestEntry(test, container) {
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
  
  // Add test item to container
  container.appendChild(testItem);
  
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
  const testsToRun = TestRunner.getAllAsArray();
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
  return Object.values(TESTS).find(test => test.id === testId);
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

function runTest(testType, callback = null, clearResults = true) {
  setButtonsState(false);
  currentTest = testType;
  abortRequested = false;
  
  // Get test parameters
  const swIncrement = parseInt(swIncrementSize.value);
  const htmlIncrement = parseInt(htmlIncrementSize.value);
  const requiredExceedances = parseInt(consecutiveExceedances.value);
  const includeBlitting = includeBlittingCheckbox.checked;
  const isQuietMode = quietModeCheckbox.checked;
  
  // Get the test's display name
  const testDisplayName = testType.displayName;
  
  // Clear previous results if not part of "Run All Tests"
  if (clearResults) {
    let header = `Running ${testDisplayName} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isQuietMode ? ' in quieter mode' : ''}...\n\n`;
    resultsContainer.innerHTML = header;
  } else {
    let header = `\nRunning ${testDisplayName} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isQuietMode ? ' in quieter mode' : ''}...\n\n`;
    resultsContainer.innerHTML += header;
  }
  
  // Update current test label to include test name
  document.querySelector('#current-test-progress-container .progress-label').textContent = `Current test progress (${testDisplayName}):`;
  
  // Show progress bar
  currentTestProgressContainer.style.display = 'block';
  currentTestProgressBar.style.width = '0%';
  currentTestProgressBar.textContent = '0%';
  
  // Set text color to dark when progress is 0%
  currentTestProgressBar.style.color = '#333';
  
  // Testing data structure
  const testData = {
    testType: testType,
    testDisplayName: testDisplayName,
    swIncrement,
    htmlIncrement,
    includeBlitting,
    requiredExceedances,
    isQuietMode,
    // Software Canvas results
    swShapeCounts: [],
    swTimings: [],
    swMaxShapes: 0,
    // HTML5 Canvas results
    canvasShapeCounts: [],
    canvasTimings: [],
    canvasMaxShapes: 0
  };
  
  // First phase message is now added in the runSoftwareCanvasRampTest function
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
  
  // Start with the software canvas test
  showSwCanvas();
  runSoftwareCanvasRampTest(testType, STARTING_SHAPE_COUNT, swIncrement, includeBlitting, requiredExceedances, testData, () => {
    
    // After SW canvas test completes, run HTML5 canvas test
    showHtml5Canvas();
    // Phase 2 message is now added in the runHTML5CanvasRampTest function
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
    
    runHTML5CanvasRampTest(testType, STARTING_SHAPE_COUNT, htmlIncrement, requiredExceedances, testData, () => {
      
      // Calculate performance ratio
      testData.ratio = testData.canvasMaxShapes / testData.swMaxShapes;
      
      // Hide all canvases when test is complete
      hideAllCanvases();
      
      // Display final results
      displayRampTestResults(testData);
      
      // Generate performance chart
      generatePerformanceChart(testData);
      
      // Reset test state if not part of "Run All Tests"
      if (!callback) {
        resetTestState();
      }
      
      // Call callback if provided (for runAllTests), passing the results
      if (callback) callback(testData);
    });
  });
}

// Initialize UI when script loads
initializeUI();