// Main user interface functionality for performance tests

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
  
  // Clear previous results if not part of "Run All Tests"
  if (clearResults) {
    resultsContainer.innerHTML = `Running ${testType} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}...\n\n`;
  } else {
    resultsContainer.innerHTML += `\nRunning ${testType} test with SW increment ${swIncrement}, HTML increment ${htmlIncrement}${includeBlitting ? ' (including blitting time)' : ' (excluding blitting time)'}...\n\n`;
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
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
  
  // Start with the software canvas test
  runSoftwareCanvasRampTest(testType, STARTING_SHAPE_COUNT, swIncrement, includeBlitting, requiredExceedances, testData, () => {
    
    // After SW canvas test completes, run HTML5 canvas test
    resultsContainer.innerHTML += "\nPHASE 2: Testing HTML5 Canvas...\n";
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