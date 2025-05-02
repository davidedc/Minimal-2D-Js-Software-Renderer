/**
 * Defines the test case for rendering a medium-sized, horizontal, 1px thick,
 * opaque stroke line positioned precisely between pixels.
 * Uses the canvas code approach for drawing and checks for crispness.
 */
function define_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient() {
  return new RenderTestBuilder()
    .withId('lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient')
    .withTitle('Lines: M-Size No-Fill 1px-Opaque-Stroke Crisp-Pixel-Pos Horizontal')
    .withDescription('Tests crisp rendering of a horizontal 1px line centered between pixels using canvas code.')
    .runCanvasCode(draw_lines__M_size__no_fill__1px_opaque_stroke__crisp_pixel_pos__horizontal_orient) // Use the new drawing function
    .withColorCheckMiddleRow({ expectedUniqueColors: 1 }) // Same check as original
    .withColorCheckMiddleColumn({ expectedUniqueColors: 1 }) // Same check as original
    .withExtremesCheck() // Same check as original, uses return value from runCanvasCode
    .build(); // Creates and registers the RenderTest instance
} 