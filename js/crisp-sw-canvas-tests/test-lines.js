function drawSimpleLinesScene(ctx) {
    // Set thin line
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(255, 0, 0)"; // Red
    
    // Horizontal line
    ctx.strokeLine(50, 100, 350, 100);
    
    // Vertical line
    ctx.strokeLine(200, 50, 200, 200);
    
    // Diagonal line
    ctx.strokeStyle = "rgb(0, 0, 255)"; // Blue
    ctx.strokeLine(50, 50, 350, 200);
    
    // Thick red line
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgb(255, 0, 0)"; // Red
    ctx.strokeLine(50, 250, 350, 250);
    
    // Thick blue line with opacity
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"; // Semi-transparent blue
    ctx.strokeLine(50, 300, 350, 300);
    
    // Thick green diagonal line
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(0, 255, 0)"; // Green
    ctx.strokeLine(50, 200, 350, 350);
    
    // Lines with transformations
    ctx.save();
    ctx.translate(200, 400);
    ctx.rotate(Math.PI / 4); // 45 degrees
    
    // Star pattern with lines
    ctx.lineWidth = 2;
    const colors = [
        "rgb(255, 0, 0)",      // Red
        "rgb(0, 255, 0)",      // Green
        "rgb(0, 0, 255)",      // Blue
        "rgba(255, 255, 0, 1)", // Yellow
        "rgba(0, 255, 255, 1)"  // Cyan
    ];
    
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = colors[i];
        const angle = (i / 5) * Math.PI * 2;
        const x = Math.cos(angle) * 100;
        const y = Math.sin(angle) * 100;
        ctx.strokeLine(0, 0, x, y);
    }
    ctx.restore();
    
    // Random lines test
    for (let i = 0; i < 20; i++) {
        // Random line width between 1 and 10
        ctx.lineWidth = 1 + Math.floor(SeededRandom.getRandom() * 10);
        
        // Random color with random opacity
        const r = Math.floor(SeededRandom.getRandom() * 256);
        const g = Math.floor(SeededRandom.getRandom() * 256);
        const b = Math.floor(SeededRandom.getRandom() * 256);
        const a = 0.3 + SeededRandom.getRandom() * 0.7; // Random opacity between 0.3 and 1.0
        
        // Format using the correct rgba syntax
        ctx.strokeStyle = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
        
        // Random line positions
        const x1 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
        const y1 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
        const x2 = Math.floor(SeededRandom.getRandom() * CANVAS_WIDTH);
        const y2 = Math.floor(SeededRandom.getRandom() * CANVAS_HEIGHT);
        
        ctx.strokeLine(x1, y1, x2, y2);
    }
    
    // Add lines to organic shapes
    ctx.save();
    ctx.translate(400, 300);
    ctx.scale(0.8, 0.8);
    ctx.rotate(Math.PI / 6); // 30 degrees
    
    // Draw a square with lines
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(255, 0, 0)"; // Red
    ctx.strokeLine(-100, -100, 100, -100);
    ctx.strokeLine(100, -100, 100, 100);
    ctx.strokeLine(100, 100, -100, 100);
    ctx.strokeLine(-100, 100, -100, -100);
    
    // Draw diagonals
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgb(0, 0, 255)"; // Blue
    debugger
    ctx.strokeLine(-100, -100, 100, 100);
    ctx.strokeLine(-100, 100, 100, -100);
    
    ctx.restore();
}

function createLinesTest() {
    return new RenderComparisonBuilder()
        .withId('lines-test')
        .withTitle('Lines Test')
        .withDescription('Tests various line rendering capabilities including thickness, color, and transformations')
        .runCanvasCode(drawSimpleLinesScene)
        .build();
}