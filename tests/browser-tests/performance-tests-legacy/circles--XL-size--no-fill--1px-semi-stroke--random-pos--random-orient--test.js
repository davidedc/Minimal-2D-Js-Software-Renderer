"use strict";

// name: "XL-size circles with 1px semi-transparent stroke, random position, random orientation"
// desc: "Test rendering performance for XL-size circles (radius 40-60) with 1px semi-transparent stroke, positioned randomly, with random orientation"
// spec: circles--XL-size--no-fill--1px-semi-stroke--random-pos--random-orient
// id: circles--XL-size--no-fill--1px-semi-stroke--random-pos--random-orient

// Function for performance test runner
function draw_circles__XL_size__no_fill__1px_semi_stroke__random_pos__random_orient(ctx, count) {
  for (let i = 0; i < count; i++) {
    // Extra large circles: 80-200px radius per documentation
    const radius = Math.floor(SeededRandom.getRandom() * 120) + 80;
    
    // Ensure circle stays within canvas bounds by constraining center coordinates
    const centerX = Math.floor(SeededRandom.getRandom() * (CANVAS_WIDTH - 2 * radius)) + radius;
    const centerY = Math.floor(SeededRandom.getRandom() * (CANVAS_HEIGHT - 2 * radius)) + radius;
    
    // No fill (only stroke)
    const strokeWidth = 1; // Fixed 1px stroke
    const sr = Math.floor(SeededRandom.getRandom() * 256);
    const sg = Math.floor(SeededRandom.getRandom() * 256);
    const sb = Math.floor(SeededRandom.getRandom() * 256);
    const sa = 128; // Semi-transparent stroke (50%)
    
    ctx.strokeCircle(centerX, centerY, radius, strokeWidth, new Color(sr, sg, sb, sa));
  }
}

// For node test runner
function createTestCase(canvasWidth, canvasHeight, numObjects, objectSize, seed) {
    const createSceneResult = sceneCreation.createCirclesScene(canvasWidth, canvasHeight, numObjects, { 
        seed: seed,
        radiusXRange: [40, 60],
        radiusYRange: [40, 60],
        doFill: false,
        fillStyle: "#000000",
        fillStyleSemiTransp: "rgba(0, 0, 0, 0.5)",
        randomizeColors: false,
        doStroke: true,
        strokeWidth: 1,
        strokeStyle: "rgba(0, 0, 0, 0.5)",
        randomizeStrokeWidths: false,
        positionMode: "random",
        orientationMode: "random"
    });
    
    return createSceneResult;
}

if (typeof module !== 'undefined') {
    const sceneCreation = require('../../../src/scene-creation/scene-creation.js');
    module.exports = { createTestCase };
}