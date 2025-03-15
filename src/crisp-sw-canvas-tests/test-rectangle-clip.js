function drawRectangleClipTest(ctx) {
    // Draw rectangle with thick black stroke
    // make it semi-transparent so we can see the fill underneath it,
    // so we have a better sense of where the clipping is happening.
    ctx.lineWidth = 50;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillStyle = 'rgba(200, 200, 255, 0.3)';
    ctx.beginPath();
    ctx.rect(100, 50, 200, 100);
    ctx.fillRect(100, 50, 200, 100);
    ctx.strokeRect(100, 50, 200, 100);

    // Clip to the rectangle
    ctx.save();
    ctx.clip();

    // Draw thin red vertical rectangle across the clipped area
    ctx.fillStyle = 'rgb(255, 0, 0)';
    // Position the rectangle to cross through the clipped area
    ctx.fillRect(150, 0, 10, 250);
    
    // Restore the context to remove clipping
    ctx.restore();
}

function createRectangleClipTest() {
    return new RenderComparisonBuilder()
        .withId('rectangle-clip-test')
        .withTitle('Testing if rectangle stroke is part of clipping area (it shouldn\'t be)')
        .withDescription('This test checks if the stroke of a rectangle is correctly excluded from the clipping area. ' +
                        'The red line should only be visible within the filled area (the blue rectangle and the darker part of the stroke, where the fill overlaps the stroke), NOT in the external lighter gray area (where only the stroke is visible).')
        .runCanvasCode(drawRectangleClipTest)
        .build();
}