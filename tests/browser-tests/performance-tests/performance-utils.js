// Performance testing utilities

// Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
let FRAME_BUDGET = 16.7; // Default milliseconds (60fps), will be updated after detection
let DETECTED_FPS = 60; // Default, will be updated after detection
const STARTING_SHAPE_COUNT = 10;

// Set up test state
let currentTest = null;
let abortRequested = false;
let animationFrameId = null;
let refreshRateDetected = false;

// Detect display refresh rate and update frame budget
function detectRefreshRate(callback) {
  let times = [];
  let lastTime = performance.now();
  let frameCount = 0;
  
  // Standard refresh rates in Hz
  const STANDARD_REFRESH_RATES = [60, 75, 90, 120, 144, 165, 240, 360, 500];
  
  // Helper function to find closest standard refresh rate
  function findClosestRefreshRate(detectedFPS) {
    // Find the closest standard rate to the detected one
    let closestRate = STANDARD_REFRESH_RATES[0];
    let minDifference = Math.abs(detectedFPS - closestRate);
    
    for (let i = 1; i < STANDARD_REFRESH_RATES.length; i++) {
      const currentDifference = Math.abs(detectedFPS - STANDARD_REFRESH_RATES[i]);
      if (currentDifference < minDifference) {
        closestRate = STANDARD_REFRESH_RATES[i];
        minDifference = currentDifference;
      }
    }
    
    return closestRate;
  }
  
  function measureFrames(timestamp) {
    // Calculate time since last frame
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Only count frames after the first one (which might be delayed)
    if (frameCount > 0) {
      times.push(deltaTime);
    }
    
    frameCount++;
    
    // Collect 20 samples
    if (frameCount <= 20) {
      requestAnimationFrame(measureFrames);
    } else {
      // Remove outliers (slow first frames, etc.)
      times.sort((a, b) => a - b);
      // Use the middle 60% of samples for better accuracy
      const startIdx = Math.floor(times.length * 0.2);
      const endIdx = Math.ceil(times.length * 0.8);
      const reliableTimes = times.slice(startIdx, endIdx);
      
      // Calculate average frame time
      const avgFrameTime = reliableTimes.reduce((sum, time) => sum + time, 0) / reliableTimes.length;
      
      // Calculate FPS (round to nearest whole number)
      const rawDetectedFPS = Math.round(1000 / avgFrameTime);
      
      // Find the closest standard refresh rate
      const closestStandardFPS = findClosestRefreshRate(rawDetectedFPS);
      
      // Store raw detected value for display purposes
      window.RAW_DETECTED_FPS = rawDetectedFPS;
      
      // Update global variables
      DETECTED_FPS = closestStandardFPS;
      FRAME_BUDGET = 1000 / closestStandardFPS;
      refreshRateDetected = true;
      
      // Update UI display and call callback
      document.getElementById('detected-fps').textContent = `${DETECTED_FPS} (raw: ${RAW_DETECTED_FPS})`;
      document.getElementById('frame-budget').textContent = FRAME_BUDGET.toFixed(2);
      
      if (callback) callback();
    }
  }
  
  // Start measurements
  requestAnimationFrame(measureFrames);
}

// Helper function to log results based on quiet mode
function logResult(message) {
  // Use the current checkbox state since this could be called from various places
  if (!quietModeCheckbox.checked) {
    resultsContainer.innerHTML += message;
    resultsContainer.scrollTop = resultsContainer.scrollHeight;
  }
}

// Find the maximum number of shapes that stayed within the frame budget
function findMaxShapes(shapeCounts, timings) {
  // If we have no data, return 0
  if (shapeCounts.length === 0) {
    return 0;
  }
  
  // Start from the end and find the first shape count before we exceeded budget 10 times in a row
  // This is the last shape count we tested
  let lastShapeCount = shapeCounts[shapeCounts.length - 1];
  
  // If we have shape counts and last entry is the one that exceeded budget,
  // return the last shape count that didn't consistently exceed budget 
  // (which is the last shape count before exceeding budget 10 times)
  return lastShapeCount;
}

// Software Canvas Ramp Test
function runSoftwareCanvasRampTest(testType, startCount, incrementSize, includeBlitting, requiredExceedances, testData, callback) {
  let currentShapeCount = startCount;
  let exceededBudget = false;
  let totalPhaseSteps = 1000; // Just an estimate for progress bar
  let currentPhaseStep = 0;
  let consecutiveExceedances = 0;
  let lastLoggedShapeCount = 0;
  // Use isQuietMode from testData, passed from UI
  const isQuietMode = testData.isQuietMode;
  
  // Always log the initial phase info, even in quiet mode
  resultsContainer.innerHTML += "PHASE 1: Testing Software Canvas...\n";
  if (isQuietMode) {
    resultsContainer.innerHTML += "(Running in quieter mode, suppressing frame-by-frame logs)\n";
  }
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
  
  function testNextShapeCount() {
    if (abortRequested || exceededBudget) {
      // All done, report back
      testData.swMaxShapes = findMaxShapes(testData.swShapeCounts, testData.swTimings);
      
      // Always log the final result, even in quiet mode
      resultsContainer.innerHTML += `Software Canvas Maximum Shapes: ${testData.swMaxShapes}\n`;
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      callback();
      return;
    }
    
    // Update progress for this phase
    currentPhaseStep++;
    const progress = Math.min(100, Math.round((currentPhaseStep / totalPhaseSteps) * 50)); // First phase is 50% of total
    currentTestProgressBar.style.width = `${progress}%`;
    currentTestProgressBar.textContent = `${progress}%`;
    
    // Set text color based on progress
    if (progress > 0) {
      currentTestProgressBar.style.color = 'white';
    }
    
    // Clear canvas
    swCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Seed random for consistent shapes
    SeededRandom.seedWithInteger(currentPhaseStep);
    
    // Run the specific test and measure time
    let startTime = performance.now();
    
    // Draw shapes based on test type
    testType.drawFunction(swCtx, currentShapeCount);
    
    // Include blitting time if requested
    if (includeBlitting) {
      swCtx.blitToCanvas(swCanvas);
    }
    
    let endTime = performance.now();
    let elapsedTime = endTime - startTime;
    
    const avgTime = elapsedTime;
    
    // Store results
    testData.swShapeCounts.push(currentShapeCount);
    testData.swTimings.push(avgTime);
    
    // Log to results if not in quiet mode, or every 100 shape count increment in quiet mode
    // In quiet mode, don't log during budget exceedance tests (only first and last exceedance)
    if (!isQuietMode || (isQuietMode && (currentShapeCount - lastLoggedShapeCount >= 100) && consecutiveExceedances === 0)) {
      // In quiet mode, log at shape count increments (but not during exceedance testing)
      resultsContainer.innerHTML += `SW Canvas with ${currentShapeCount} shapes: ${avgTime.toFixed(2)}ms\n`;
      lastLoggedShapeCount = currentShapeCount;
      
      // Auto-scroll to show latest results
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }
    
    // Check if we exceeded the frame budget
    if (avgTime > FRAME_BUDGET) {
      consecutiveExceedances++;
      
      // In quiet mode, only log first and last exceedance
      if (!isQuietMode || consecutiveExceedances === 1 || consecutiveExceedances === requiredExceedances) {
        // Only log the shape count info in quiet mode for first or last exceedance
        if (isQuietMode) {
          resultsContainer.innerHTML += `SW Canvas with ${currentShapeCount} shapes: ${avgTime.toFixed(2)}ms\n`;
        }
        resultsContainer.innerHTML += `  Exceeded budget (${consecutiveExceedances}/${requiredExceedances})\n`;
        // Auto-scroll to show exceedance messages
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
      }
      
      // Only stop if we've exceeded enough times consecutively
      if (consecutiveExceedances >= requiredExceedances) {
        exceededBudget = true;
      } else {
        // Continue with the same shape count to confirm if it consistently exceeds budget
        // No need to increment here
      }
    } else {
      // Reset consecutive exceedances counter
      consecutiveExceedances = 0;
      // Increment shape count and continue testing
      currentShapeCount += incrementSize;
    }
    
    // Wait for the next frame before proceeding to next shape count
    animationFrameId = requestAnimationFrame(testNextShapeCount);
  }
  
  // Start with the first shape count
  testNextShapeCount();
}

// HTML5 Canvas Ramp Test
function runHTML5CanvasRampTest(testType, startCount, incrementSize, requiredExceedances, testData, callback) {
  let currentShapeCount = startCount;
  let exceededBudget = false;
  let totalPhaseSteps = 1000; // Just an estimate for progress bar
  let currentPhaseStep = 0;
  let consecutiveExceedances = 0;
  let lastLoggedShapeCount = 0;
  // Use isQuietMode from testData, passed from UI
  const isQuietMode = testData.isQuietMode;
  
  // Always log the initial phase info, even in quiet mode
  resultsContainer.innerHTML += "\nPHASE 2: Testing HTML5 Canvas...\n";
  if (isQuietMode) {
    resultsContainer.innerHTML += "(Running in quieter mode, suppressing frame-by-frame logs)\n";
  }
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
  
  function testNextShapeCount() {
    if (abortRequested || exceededBudget) {
      // All done, report back
      testData.canvasMaxShapes = findMaxShapes(testData.canvasShapeCounts, testData.canvasTimings);
      
      // Always log the final result, even in quiet mode
      resultsContainer.innerHTML += `HTML5 Canvas Maximum Shapes: ${testData.canvasMaxShapes}\n`;
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
      callback();
      return;
    }
    
    // Update progress for this phase
    currentPhaseStep++;
    const progress = Math.min(100, 50 + Math.round((currentPhaseStep / totalPhaseSteps) * 50)); // Second phase is last 50%
    currentTestProgressBar.style.width = `${progress}%`;
    currentTestProgressBar.textContent = `${progress}%`;
    
    // Set text color based on progress
    if (progress > 0) {
      currentTestProgressBar.style.color = 'white';
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Seed random for consistent shapes
    SeededRandom.seedWithInteger(currentPhaseStep);
    
    // Run the specific test and measure time
    let startTime = performance.now();
    
    // Draw shapes based on test type
    testType.drawFunction(ctx, currentShapeCount);
    
    let endTime = performance.now();
    let elapsedTime = endTime - startTime;
    
    const avgTime = elapsedTime;
    
    // Store results
    testData.canvasShapeCounts.push(currentShapeCount);
    testData.canvasTimings.push(avgTime);
    
    // Log to results if not in quiet mode, or every 1000 shape count increment in quiet mode
    // In quiet mode, don't log during budget exceedance tests (only first and last exceedance)
    if (!isQuietMode || (isQuietMode && (currentShapeCount - lastLoggedShapeCount >= 1000) && consecutiveExceedances === 0)) {
      // In quiet mode, log at larger shape count increments (but not during exceedance testing)
      resultsContainer.innerHTML += `HTML5 Canvas with ${currentShapeCount} shapes: ${avgTime.toFixed(2)}ms\n`;
      lastLoggedShapeCount = currentShapeCount;
      
      // Auto-scroll to show latest results
      resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }
    
    // Check if we exceeded the frame budget
    if (avgTime > FRAME_BUDGET) {
      consecutiveExceedances++;
      
      // In quiet mode, only log first and last exceedance
      if (!isQuietMode || consecutiveExceedances === 1 || consecutiveExceedances === requiredExceedances) {
        // Only log the shape count info in quiet mode for first or last exceedance
        if (isQuietMode) {
          resultsContainer.innerHTML += `HTML5 Canvas with ${currentShapeCount} shapes: ${avgTime.toFixed(2)}ms\n`;
        }
        resultsContainer.innerHTML += `  Exceeded budget (${consecutiveExceedances}/${requiredExceedances})\n`;
        // Auto-scroll to show exceedance messages
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
      }
      
      // Only stop if we've exceeded enough times consecutively
      if (consecutiveExceedances >= requiredExceedances) {
        exceededBudget = true;
      } else {
        // Continue with the same shape count to confirm if it consistently exceeds budget
        // No need to increment here
      }
    } else {
      // Reset consecutive exceedances counter
      consecutiveExceedances = 0;
      // Increment shape count and continue testing
      currentShapeCount += incrementSize;
    }
    
    // Wait for the next frame before proceeding to next shape count
    animationFrameId = requestAnimationFrame(testNextShapeCount);
  }
  
  // Start with the first shape count
  testNextShapeCount();
}

// Results display functions
function displayRampTestResults(testData) {
  // Format results
  let results = "";
  results += `\n=== ${testData.testDisplayName.toUpperCase()} TEST RESULTS ===\n`;
  if (testData.numRuns && testData.numRuns > 1) {
      results += `(Averaged over ${testData.numRuns} runs)\n`;
  }
  results += `Test Parameters:\n`;
  results += `- Display refresh rate: ${DETECTED_FPS} fps (standard rate, raw detected: ${window.RAW_DETECTED_FPS || DETECTED_FPS} fps)\n`;
  results += `- Frame budget: ${FRAME_BUDGET.toFixed(2)}ms\n`;
  results += `- SW Canvas start count: ${testData.swStartCount}\n`;
  results += `- SW Canvas increment: ${testData.swIncrement}\n`;
  results += `- HTML5 Canvas start count: ${testData.htmlStartCount}\n`;
  results += `- HTML5 Canvas increment: ${testData.htmlIncrement}\n`;
  results += `- Consecutive exceedances required: ${testData.requiredExceedances}\n`;
  results += `- Blitting time: ${testData.includeBlitting ? "Included" : "Excluded"}\n`;
  if (testData.isQuietMode) {
    results += `- Log mode: Quieter (frame-by-frame logs suppressed)\n`;
  } else {
    results += `- Log mode: Verbose (all frames logged)\n`;
  }
  results += `\n`;
  
  results += `Software Canvas Performance:\n`;
  results += `- Maximum shapes per frame: ${testData.swMaxShapes}\n\n`;
  
  results += `HTML5 Canvas Performance:\n`;
  results += `- Maximum shapes per frame: ${testData.canvasMaxShapes}\n\n`;
  
  // Display the average ratio
  results += `Performance Ratio (HTML5 / Software): ${testData.ratio.toFixed(2)}x`;

  // If averaged, also show the individual run ratios
  if (testData.numRuns && testData.numRuns > 1 && testData.individualRatios && testData.individualRatios.length > 0) {
    const individualRatiosFormatted = testData.individualRatios.map(r => isNaN(r) ? 'NaN' : r.toFixed(2)).join(', ');
    results += ` (average of: ${individualRatiosFormatted})`;
  }
  results += `\n`; // Add newline after ratio line

  results += `HTML5 canvas can render ${testData.ratio.toFixed(2)}x ${testData.ratio > 1 ? "more" : "fewer"} shapes than Software canvas within frame budget.\n\n`;
  
  // Append results to container
  resultsContainer.innerHTML += results;
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
}

function displayOverallResults(allResults) {
  // Calculate overall statistics
  const avgSwMaxShapes = calculateAverage(allResults.swMaxShapes);
  const avgCanvasMaxShapes = calculateAverage(allResults.canvasMaxShapes);
  const avgRatio = calculateAverage(allResults.ratios);
  
  // Format overall results
  let results = "\n=== OVERALL TEST RESULTS ===\n";
  results += `Display refresh rate: ${DETECTED_FPS} fps (standard rate, raw detected: ${window.RAW_DETECTED_FPS || DETECTED_FPS} fps)\n`;
  results += `Frame budget: ${FRAME_BUDGET.toFixed(2)}ms\n`;
  results += `Tests run: ${allResults.tests.length}\n`;
  results += `Log mode: ${quietModeCheckbox.checked ? "Quiet" : "Verbose"}\n\n`;
  
  // Test specific summary
  results += "Test Summary:\n";
  for (let i = 0; i < allResults.tests.length; i++) {
    results += `- ${allResults.tests[i].toUpperCase()}: SW Canvas ${allResults.swMaxShapes[i]} shapes, HTML5 Canvas ${allResults.canvasMaxShapes[i]} shapes, Ratio ${allResults.ratios[i].toFixed(2)}x\n`;
  }
  results += "\n";
  
  results += "Average Performance Across All Tests:\n";
  results += `- Software Canvas: ${Math.round(avgSwMaxShapes)} shapes/frame\n`;
  results += `- HTML5 Canvas: ${Math.round(avgCanvasMaxShapes)} shapes/frame\n`;
  results += `- Average Ratio: ${avgRatio.toFixed(2)}x\n`;
  results += `HTML5 canvas can render on average ${avgRatio.toFixed(2)}x ${avgRatio > 1 ? "more" : "fewer"} shapes than Software canvas within frame budget.\n\n`;
  
  // Append results to container
  resultsContainer.innerHTML += results;
  resultsContainer.scrollTop = resultsContainer.scrollHeight;
}

// Simple chart generation function
function generatePerformanceChart(testData) {
  // Clear previous chart if any
  chartContainer.innerHTML = '';
  
  // Create canvas for chart
  const chartCanvas = document.createElement('canvas');
  chartCanvas.width = chartContainer.clientWidth - 20;
  chartCanvas.height = chartContainer.clientHeight - 20;
  chartContainer.appendChild(chartCanvas);
  
  const chartCtx = chartCanvas.getContext('2d');
  
  // Chart settings
  const chartPadding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartWidth = chartCanvas.width - chartPadding.left - chartPadding.right;
  const chartHeight = chartCanvas.height - chartPadding.top - chartPadding.bottom;
  
  // Find max values for scaling
  const maxShapeCount = Math.max(
    ...testData.swShapeCounts,
    ...testData.canvasShapeCounts
  );
  
  const maxTime = Math.max(
    ...testData.swTimings,
    ...testData.canvasTimings,
    FRAME_BUDGET * 1.5 // Ensure frame budget line is visible
  );
  
  // Draw chart background
  chartCtx.fillStyle = '#f8f8f8';
  chartCtx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);
  
  // Draw frame budget line
  const budgetY = chartPadding.top + chartHeight - (FRAME_BUDGET / maxTime) * chartHeight;
  
  chartCtx.beginPath();
  chartCtx.moveTo(chartPadding.left, budgetY);
  chartCtx.lineTo(chartPadding.left + chartWidth, budgetY);
  chartCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
  chartCtx.lineWidth = 2;
  chartCtx.setLineDash([5, 5]);
  chartCtx.stroke();
  chartCtx.setLineDash([]);
  
  // Add frame budget label
  chartCtx.fillStyle = 'rgba(255, 0, 0, 0.9)';
  chartCtx.font = '12px Arial';
  chartCtx.textAlign = 'right';
  const rawFpsDisplay = window.RAW_DETECTED_FPS ? `, raw: ${window.RAW_DETECTED_FPS}fps` : '';
  chartCtx.fillText(`Frame Budget (${FRAME_BUDGET.toFixed(2)}ms @ ${DETECTED_FPS}fps${rawFpsDisplay})`, chartPadding.left + chartWidth - 10, budgetY - 5);
  
  // Draw axes
  chartCtx.beginPath();
  chartCtx.moveTo(chartPadding.left, chartPadding.top);
  chartCtx.lineTo(chartPadding.left, chartPadding.top + chartHeight);
  chartCtx.lineTo(chartPadding.left + chartWidth, chartPadding.top + chartHeight);
  chartCtx.strokeStyle = '#333';
  chartCtx.lineWidth = 2;
  chartCtx.stroke();
  
  // Draw axis labels
  chartCtx.fillStyle = '#333';
  chartCtx.font = '14px Arial';
  chartCtx.textAlign = 'center';
  chartCtx.fillText('Number of Shapes', chartPadding.left + chartWidth / 2, chartPadding.top + chartHeight + 30);
  
  chartCtx.save();
  chartCtx.translate(15, chartPadding.top + chartHeight / 2);
  chartCtx.rotate(-Math.PI / 2);
  chartCtx.textAlign = 'center';
  chartCtx.fillText('Render Time (ms)', 0, 0);
  chartCtx.restore();
  
  // Draw title
  chartCtx.font = '16px Arial';
  chartCtx.textAlign = 'center';
  const chartTitle = testData.numRuns && testData.numRuns > 1 
      ? `${testData.testDisplayName} Test: Render Time vs. Shape Count (Last Run Data)` 
      : `${testData.testDisplayName} Test: Render Time vs. Shape Count`;
  chartCtx.fillText(chartTitle, chartPadding.left + chartWidth / 2, 20);
  
  // Draw Software Canvas data points
  drawChartLine(
    chartCtx,
    testData.swShapeCounts,
    testData.swTimings,
    maxShapeCount,
    maxTime,
    chartPadding,
    chartWidth,
    chartHeight,
    'rgba(0, 0, 255, 0.8)',
    'Software Canvas'
  );
  
  // Draw HTML5 Canvas data points
  drawChartLine(
    chartCtx,
    testData.canvasShapeCounts,
    testData.canvasTimings,
    maxShapeCount,
    maxTime,
    chartPadding,
    chartWidth,
    chartHeight,
    'rgba(0, 128, 0, 0.8)',
    'HTML5 Canvas'
  );
  
  // Draw legend
  const legendY = chartPadding.top + 20;
  
  // Software Canvas legend
  chartCtx.fillStyle = 'rgba(0, 0, 255, 0.8)';
  chartCtx.fillRect(chartPadding.left + 10, legendY, 20, 10);
  chartCtx.fillStyle = '#333';
  chartCtx.textAlign = 'left';
  chartCtx.fillText('Software Canvas', chartPadding.left + 40, legendY + 9);
  
  // HTML5 Canvas legend
  chartCtx.fillStyle = 'rgba(0, 128, 0, 0.8)';
  chartCtx.fillRect(chartPadding.left + 180, legendY, 20, 10);
  chartCtx.fillStyle = '#333';
  chartCtx.fillText('HTML5 Canvas', chartPadding.left + 210, legendY + 9);
}

function drawChartLine(ctx, xValues, yValues, maxX, maxY, padding, width, height, color, label) {
  if (xValues.length < 2) return;
  
  ctx.beginPath();
  
  for (let i = 0; i < xValues.length; i++) {
    const x = padding.left + (xValues[i] / maxX) * width;
    const y = padding.top + height - (yValues[i] / maxY) * height;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    // Draw data point
    ctx.fillStyle = color;
    ctx.fillRect(x - 3, y - 3, 6, 6);
  }
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Utility functions
function calculateAverage(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function calculateStandardDeviation(values, avg) {
  if (values.length <= 1) return 0;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

// Canvas visibility management functions
function showSwCanvas() {
  document.getElementById("sw-canvas-container").style.display = "block";
  document.getElementById("html5-canvas-container").style.display = "none";
  document.getElementById("canvas-label").textContent = "Software Canvas";
}

function showHtml5Canvas() {
  document.getElementById("sw-canvas-container").style.display = "none";
  document.getElementById("html5-canvas-container").style.display = "block";
  document.getElementById("canvas-label").textContent = "HTML5 Canvas";
}

function hideAllCanvases() {
  document.getElementById("sw-canvas-container").style.display = "none";
  document.getElementById("html5-canvas-container").style.display = "none";
  document.getElementById("canvas-label").textContent = "Graphics will be shown here when tests start";
}