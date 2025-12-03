function drawArcCanvas(ctx, shape) {
    const { center, radius, startAngle, endAngle, strokeWidth, strokeColor, fillColor } = shape;

    const startRad = (startAngle % 360) * Math.PI / 180;
    const endRad = (endAngle % 360) * Math.PI / 180;

    if (fillColor.a > 0) {
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + radius * Math.cos(startRad), center.y + radius * Math.sin(startRad));
        ctx.arc(center.x, center.y, radius, startRad, endRad);
        ctx.lineTo(center.x, center.y);
        ctx.fillStyle = fillColor.toCSS();
        ctx.fill();
    }

    if (strokeColor.a > 0 && strokeWidth > 0) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, startRad, endRad);
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = strokeColor.toCSS();
        ctx.stroke();
    }
}