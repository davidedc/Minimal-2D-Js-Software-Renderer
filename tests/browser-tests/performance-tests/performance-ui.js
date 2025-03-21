// Main user interface functionality for performance tests

// Initialize UI
function initializeUI() {
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
      resultsContainer.innerHTML = `Display refresh rate detected: ${DETECTED_FPS} fps (${FRAME_BUDGET.toFixed(2)}ms budget)\nReady to run tests.\n`;
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

// Button event listeners
btnLinesTest.addEventListener('click', () => runTest('lines'));
btnRectsTest.addEventListener('click', () => runTest('rects'));
btnCirclesTest.addEventListener('click', () => runTest('circles'));
btnRunAll.addEventListener('click', runAllTests);
btnAbort.addEventListener('click', abortTests);

function runAllTests() {
  const tests = ['lines', 'rects', 'circles'];
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
        allResults.tests.push(tests[currentIndex]);
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
  btnLinesTest.disabled = !enabled;
  btnRectsTest.disabled = !enabled;
  btnCirclesTest.disabled = !enabled;
  btnRunAll.disabled = !enabled;
  btnAbort.disabled = enabled;
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
  
  // Clear previous results if not part of "Run All Tests"
  if (clearResults) {
    let header = `Running ${testType} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
    header += `${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}`;
    header += `${isSilentMode ? ' in silent mode' : ''}...\n\n`;
    resultsContainer.innerHTML = header;
  } else {
    let header = `\nRunning ${testType} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}`;
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
    testType,
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
  runSoftwareCanvasRampTest(testType, STARTING_SHAPE_COUNT, swIncrement, includeBlitting, requiredExceedances, testData, () => {
    
    // After SW canvas test completes, run HTML5 canvas test
    resultsContainer.innerHTML += "\nPHASE 2: Testing HTML5 Canvas...\n";
    if (isSilentMode) {
      resultsContainer.innerHTML += "(Running in silent mode, only periodic updates will be shown)\n";
    }
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
    
    runHTML5CanvasRampTest(testType, STARTING_SHAPE_COUNT, htmlIncrement, requiredExceedances, testData, () => {
      
      // Calculate performance ratio
      testData.ratio = testData.canvasMaxShapes / testData.swMaxShapes;
      
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