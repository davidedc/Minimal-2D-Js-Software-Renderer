// Main user interface functionality for performance tests

// Function to dynamically generate test buttons
function generateTestButtons() {
  // Only build dynamic buttons if we're in a modern environment
  if (typeof document.querySelector !== 'function') return;
  
  // Get containers for each test type
  const lineTestsContainer = document.getElementById('line-tests');
  const rectangleTestsContainer = document.getElementById('rectangle-tests');
  const circleTestsContainer = document.getElementById('circle-tests');
  
  if (!lineTestsContainer || !rectangleTestsContainer || !circleTestsContainer) return;
  
  // Clear existing buttons from each container
  lineTestsContainer.innerHTML = '';
  rectangleTestsContainer.innerHTML = '';
  circleTestsContainer.innerHTML = '';
  
  // Add buttons for each test in the appropriate container
  Object.values(TESTS).forEach(test => {
    const button = document.createElement('button');
    button.textContent = test.displayName;
    button.addEventListener('click', () => runTest(test));
    button.className = 'test-button'; // Add a class for easier selection
    
    // Determine which container to add the button to based on test id
    if (test.id.startsWith('lines')) {
      lineTestsContainer.appendChild(button);
    } else if (test.id.startsWith('rectangles')) {
      rectangleTestsContainer.appendChild(button);
    } else if (test.id.startsWith('circles')) {
      circleTestsContainer.appendChild(button);
    }
  });
}

// Initialize UI
function initializeUI() {
  // Hide all canvases initially
  hideAllCanvases();
  
  // Generate test buttons dynamically based on test definitions
  generateTestButtons();
  
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

// Profiling mode toggle
document.getElementById('btn-profiling-mode').addEventListener('click', function() {
  const button = this;
  const isProfilingMode = button.textContent.includes('Disable');
  
  if (isProfilingMode) {
    // Disable profiling mode
    button.textContent = 'Enable Profiling Mode';
    button.style.backgroundColor = '#007bff';
    consecutiveExceedances.value = '10';
    silentModeCheckbox.checked = false;
  } else {
    // Enable profiling mode
    button.textContent = 'Disable Profiling Mode';
    button.style.backgroundColor = '#ff4d4d';
    consecutiveExceedances.value = '100000';
    silentModeCheckbox.checked = true;
    
    // Show a quick hint
    const originalHtml = resultsContainer.innerHTML;
    resultsContainer.innerHTML = "Profiling mode enabled. Tests will run without stopping at the frame budget, allowing you to use browser profiling tools on stable rendering.\n\n" + originalHtml;
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
  }
});

// Button event listeners for standard controls
btnRunAll.addEventListener('click', runAllTests);
btnAbort.addEventListener('click', abortTests);

function runAllTests() {
  const tests = TestRunner.getAllAsArray();
  let currentIndex = 0;
  
  // Clear previous results
  resultsContainer.innerHTML = "Running all tests...\n\n";
  
  // Store results for overall summary
  const allResults = {
    tests: [],
    swMaxShapes: [],
    canvasMaxShapes: [],
    ratios: []
  };
  
  function runNextTest() {
    if (currentIndex < tests.length && !abortRequested) {
      runTest(tests[currentIndex], (testResults) => {
        // Store individual test results
        allResults.tests.push(tests[currentIndex].displayName);
        allResults.swMaxShapes.push(testResults.swMaxShapes);
        allResults.canvasMaxShapes.push(testResults.canvasMaxShapes);
        allResults.ratios.push(testResults.ratio);
        
        currentIndex++;
        runNextTest();
      }, false);
    } else {
      // Show overall results after all tests are done
      displayOverallResults(allResults);
      resetTestState();
    }
  }
  
  runNextTest();
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
  progressContainer.style.display = 'none';
}

function setButtonsState(enabled) {
  // Disable static buttons
  btnRunAll.disabled = !enabled;
  btnAbort.disabled = enabled;
  
  // Disable all test buttons
  document.querySelectorAll('.test-button').forEach(btn => {
    btn.disabled = !enabled;
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
  const isSilentMode = silentModeCheckbox.checked;
  
  // Get the test's display name
  const testDisplayName = testType.displayName;
  
  // Clear previous results if not part of "Run All Tests"
  if (clearResults) {
    let header = `Running ${testDisplayName} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isSilentMode ? ' in silent mode' : ''}...\n\n`;
    resultsContainer.innerHTML = header;
  } else {
    let header = `\nRunning ${testDisplayName} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isSilentMode ? ' in silent mode' : ''}...\n\n`;
    resultsContainer.innerHTML += header;
  }
  
  // Show progress bar
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  
  // Testing data structure
  const testData = {
    testType: testType,
    testDisplayName: testDisplayName,
    swIncrement,
    htmlIncrement,
    includeBlitting,
    requiredExceedances,
    isSilentMode,
    // Software Canvas results
    swShapeCounts: [],
    swTimings: [],
    swMaxShapes: 0,
    // HTML5 Canvas results
    canvasShapeCounts: [],
    canvasTimings: [],
    canvasMaxShapes: 0
  };
  
  // First phase: Test Software Canvas
  resultsContainer.innerHTML += "PHASE 1: Testing Software Canvas...\n";
  if (isSilentMode) {
    resultsContainer.innerHTML += "(Running in silent mode, only periodic updates will be shown)\n";
  }
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
  
  // Start with the software canvas test
  showSwCanvas();
  runSoftwareCanvasRampTest(testType, STARTING_SHAPE_COUNT, swIncrement, includeBlitting, requiredExceedances, testData, () => {
    
    // After SW canvas test completes, run HTML5 canvas test
    showHtml5Canvas();
    resultsContainer.innerHTML += "\nPHASE 2: Testing HTML5 Canvas...\n";
    if (isSilentMode) {
      resultsContainer.innerHTML += "(Running in silent mode, only periodic updates will be shown)\n";
    }
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