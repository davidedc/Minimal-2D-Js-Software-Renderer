function drawArcCanvas(ctx, shape) {
    const {
        center, radius, startAngle, endAngle,
        strokeWidth, strokeColor: { r: strokeR, g: strokeG, b: strokeB, a: strokeA },
        fillColor: { r: fillR, g: fillG, b: fillB, a: fillA }
    } = shape;

    const startRad = (startAngle % 360) * Math.PI / 180;
    const endRad = (endAngle % 360) * Math.PI / 180;
    
    if (fillA > 0) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + radius * Math.cos(startRad), center.y + radius * Math.sin(startRad));
        ctx.arc(center.x, center.y, radius, startRad, endRad);
        ctx.lineTo(center.x, center.y);
        ctx.fillStyle = `rgba(${fillR}, ${fillG}, ${fillB}, ${fillA / 255})`;
        ctx.fill();
    }
    
    if (strokeA > 0 && strokeWidth > 0) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startRad, endRad);
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = `rgba(${strokeR}, ${strokeG}, ${strokeB}, ${strokeA / 255})`;
        ctx.stroke();
    }
}