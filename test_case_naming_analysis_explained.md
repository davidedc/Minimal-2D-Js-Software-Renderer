# Explanation of `test_case_naming_analysis_v15.md` Table Composition

This document provides a detailed explanation of how the `test_case_naming_analysis_v15.md` table was constructed, the source of the test files, and a breakdown of each column (facet), including its observed values and the criteria for their assignment.

## Source of Test Files

The test files analyzed in this table originate from two primary directories within the workspace:

1.  `/Users/davidedellacasa/code/Minimal-2D-Js-Software-Renderer/tests/browser-tests/test-cases/`
2.  `/Users/davidedellacasa/code/Minimal-2D-Js-Software-Renderer/tests/browser-tests/performance-tests-legacy/` (though these are legacy, their naming provides context for facet evolution)

The analysis aims to create a unified and descriptive naming convention applicable to tests from both sources, and for future tests.

## Column (Facet) Breakdown

The `test_case_naming_analysis_v15.md` table includes the following columns. Each facet's observed values are derived from the V15 table itself.

---

### 1. `Current Test Name`

*   **Description**: The original filename of the test script.
*   **Values**: Actual filenames (e.g., `scene--all-shapes-combined--test.js`, `arcs--multi-5--fully-random--test.js`).
*   **Criteria**: Directly copied from the file system listing.

---

### 2. `Test Description`

*   **Description**: A brief human-readable description of what the test aims to achieve or render.
*   **Values**: Textual descriptions (e.g., "A test scene combining various shapes.", "Test with 5 arcs, all parameters fully randomized.").
*   **Criteria**: Initially derived from interpreting the filename and then refined based on (simulated or actual) understanding of the test's purpose.

---

### 3. `Shape category`

*   **Description**: The primary type of graphical primitive or entity being tested.
*   **Observed Values in v15.md**: `mixed`, `arcs`, `circles`, `rounded-rects`, `rectangles`, `lines`.
*   **Criteria**:
    *   `arcs`: Tests focusing on arc shapes.
    *   `circles`: Tests focusing on circle shapes.
    *   `rectangles`: Tests focusing on rectangle shapes (non-rounded).
    *   `rounded-rects`: Tests focusing on rounded rectangle shapes.
    *   `lines`: Tests focusing on line segments.
    *   `mixed`: Used for tests that combine multiple distinct shape categories into a single scene (e.g., `scene--all-shapes-combined--test.js`).
    *   Determined by the primary shape type indicated in the filename or the test's drawing function.

---

### 4. `Count`

*   **Description**: Specifies whether the test renders a single instance or multiple instances of the shape(s) **in non-performance-test mode** (for performance test mode, the shapes are *always* drawn a growing number of times to determine how many shapes can be drawn within a given frame budget).
*   **Observed Values in v15.md**: `multi`, `multi-5`, `multi-12`, `multi-8`, `single`, `multi-10`, `multi-20`, `multi-15`.
*   **Criteria**:
    *   `single`: One primary shape instance is drawn.
    *   `multi-[N]`: A specific number `N` of shapes are drawn (e.g., `multi-5` means 5 shapes). Often seen in filenames like `arcs--multi-5...`.
    *   `multi`: Multiple shapes are drawn, but the exact count isn't specified in the filename or is variable based on internal logic (e.g., the scene test).

---

### 5. `SizeCategory`

*   **Description**: Classifies the general size of the shapes being rendered, using t-shirt sizes (XS, S, M, L, XL) where applicable, `mixed` if sizes vary significantly or across categories, or `N/A`.
*   **Observed Values in v15.md**: `mixed`, `N/A`, `L`, `M`, `S`, `XS`, `XL`.
*   **Criteria**:
    *   `XS`, `S`, `M`, `L`, `XL`: Assigned if the filename explicitly contains these (e.g., `--m-size--`, `--xs-size--`). It's assumed that if randomization terms like `randsize` or `varsize` are also present, the randomization occurs *within* this named bucket.
    *   `N/A`: Used for `scene` tests, and for `lines` if no specific size bucket can be determined from the filename or code (as line "size" is length, which isn't always bucketed this way).
    *   `mixed`:
        *   If shape dimensions are randomized over a range that demonstrably spans multiple XS-XL conceptual buckets (e.g., radius from 10 to 225).
        *   If a test draws multiple shapes of distinctly different fixed sizes (e.g., one small, one large).
        *   If the filename indicates general size randomization (`randsize`, `varsize`, `randparams` affecting dimensions) without an explicit XS-XL bucket in the filename.
        *   For lines, if the filename includes terms indicating general randomization of length/position without a specific size category (e.g., "random", "randparams" affecting length, "varsize"), and no XS-XL bucket is in the filename.
    *   Parenthesized comments were removed. The goal was to determine if randomized sizes still generally fall within a defined bucket or truly are mixed.

---

### 6. `FillStyle`

*   **Description**: Indicates the nature of the shape's fill, focusing on its presence and opacity.
*   **Observed Values in v15.md**: `N/A`, `mixed`, `opaque`, `none`, `semitransparent`.
*   **Criteria**:
    *   `none`: No fill is applied (e.g., lines by default, or if `fillStyle` alpha is 0, or no fill operation is called for a shape). Filenames with `--no-fill--` also map to this.
    *   `opaque`: A fill is applied with full opacity (alpha = 1.0 or 255). This is often the default for `getRandomColor()` if alpha isn't specified.
    *   `semitransparent`: A fill is applied with partial opacity (alpha between 0 and 1, exclusive). Filenames with "semitransparent_fill" or "transparent_fill" (if fill is present but alpha is <1) lead to this.
    *   `mixed`: If different shapes in the test have different fill styles (e.g., some opaque, some none), or if the fill opacity itself is randomized across these categories. The `scene--all-shapes-combined--test.js` is a prime example.
    *   `N/A`: For the main scene test, as fills are per-component.
    *   Determined by analyzing `ctx.fillStyle` assignments, alpha values in color objects, and calls to fill methods (`fillRect`, `fillCircle`, `fillAndStrokeArc`, etc.) in the test scripts. Parenthesized comments were removed.

---

### 7. `StrokeStyle`

*   **Description**: Indicates the nature of the shape's stroke, focusing on its presence and opacity.
*   **Observed Values in v15.md**: `N/A`, `mixed`, `opaque`, `none`, `semitransparent`.
*   **Criteria**:
    *   `none`: No stroke is applied (e.g., `strokeWidth` is 0, no stroke operation, or filename explicitly states `--no-stroke--` or `--no-NA-stroke--`).
    *   `opaque`: A stroke is applied with full opacity. This is common if `strokeStyle` is set by `getRandomColor()` without specific alpha manipulation, or if color is a fixed opaque color. Filenames with "opaque_stroke" also map here.
    *   `semitransparent`: A stroke is applied with partial opacity. Filenames with "semitransparent_stroke" or "semi-stroke" or "transparent_stroke" lead to this.
    *   `mixed`: If different shapes in the test have different stroke styles, or if stroke opacity is randomized across opaque/semitransparent/none categories. The `scene--all-shapes-combined--test.js` is an example.
    *   `N/A`: For the main scene test, as strokes are per-component.
    *   Determined by analyzing `ctx.strokeStyle`, `ctx.lineWidth`, alpha values in stroke color objects, and calls to stroke methods (`strokeRect`, `strokeCircle`, `fillAndStrokeArc`, etc.) in the test scripts. Parenthesized comments were removed.

---

### 8. `StrokeThickness`

*   **Description**: Specifies the thickness of the stroke.
*   **Observed Values in v15.md**: `none`, `1px`, `2px`, `3px`, `5px`, `10px`, `1px-4px`, `1px-5px`, `1px-10px`, `1px-11px`, `10px-20px`, `1px-30px`, `mixed`.
*   **Criteria (as applied for v15)**:
    *   `none`: If `StrokeStyle` is `none`, or if the test script explicitly sets `lineWidth` to 0 or does not perform a stroke operation.
    *   `[N]px`: If an explicit, single pixel value is used. This is determined either from the filename (e.g., `--1px_...`, `10px_black_opaque_stroke`) or by analyzing the test script's code to find a constant `lineWidth` assignment.
    *   `[N]px-[M]px`: If stroke width is randomized within a discernible, continuous integer pixel range. This is determined by analyzing the test script's code, typically looking for `SeededRandom.getRandom()` calls that define a min and max for `lineWidth` (e.g., `Math.floor(SeededRandom.getRandom() * RANGE_SIZE) + MIN_WIDTH`).
    *   `mixed`:
        *   Used for the main scene test (`scene--all-shapes-combined--test.js`) as it combines components with varying stroke thicknesses.
        *   If a test script uses a discrete set of different fixed pixel values for strokes within the same test (e.g., drawing some shapes with 1px, then 2px, then 4px strokes, as in `arcs--multi-12--90-deg--fixed-params--grid-layout--test.js`).
        *   If randomization logic in the code results in a scattered set of specific values rather than a continuous range (e.g., only specific even numbers like `2, 4, ..., 12px`).
        *   Original t-shirt sizes (`L`, `M`, `XL`) from filenames in legacy tests were re-evaluated by examining their source code. If the code revealed a specific pixel value or a continuous range, it was converted to `[N]px` or `[N]px-[M]px`. If the code was unavailable or the t-shirt size didn't map to a clear pixel definition, it would have remained `mixed`, but for v15, all such legacy files provided were mapped to specific ranges.
    *   The `unknown` values from previous versions were resolved by filename cues or by assuming `mixed` if no other information was available (though for v15, all `unknown` were resolved to more specific values based on filename or code). Parenthesized comments were removed.

---

### 9. `Layout`

*   **Description**: Describes the overall arrangement or placement strategy of shapes on the canvas.
*   **Observed Values in v15.md**: `spread`, `grid`, `random`, `centered`, `N/A`.
*   **Criteria**:
    *   `spread`: Multiple shapes are drawn, and their positions are randomized or systematically varied to distribute them across the canvas, often with the intent to minimize overlap for visual inspection (e.g., `getRandomPoint()` called for each instance in a loop, or `Math.random() * canvasDimension` applied to x/y of each instance).
    *   `grid`: Shapes are explicitly arranged in a grid formation.
    *   `random`: Typically for a single shape whose position is chosen randomly on the canvas. Could also apply to multiple shapes if their random positioning doesn't inherently imply a "spread" (less common).
    *   `centered`: A single primary shape (or a fixed composition) is explicitly positioned at or near the canvas center.
    *   `N/A`: If layout is not a primary characteristic or the concept doesn't clearly apply (e.g., for some single-item tests where the focus is purely on rendering parameters other than its specific global placement).

---

### 10. `CenteredAt`

*   **Description**: For shapes like circles, arcs, and rectangles, this specifies if their geometric center is aligned with a pixel center, a grid intersection, or neither.
*   **Observed Values in v15.md**: `N/A`, `random`, `mixed-pixel-grid`, `pixel`, `grid`.
*   **Criteria**:
    *   `pixel`: Center coordinates are `*.5` (e.g., `centerX = Math.floor(width/2) + 0.5`).
    *   `grid`: Center coordinates are integers (e.g., `centerX = Math.floor(width/2)`).
    *   `mixed-pixel-grid`: One center coordinate is `*.5` and the other is an integer.
    *   `random`: If the shape's center is determined by fully random logic (e.g., `Math.random() * canvasDimension`) without specific snapping to pixel/grid for the center point itself *before* any subsequent edge alignment/crisping.
    *   `N/A`: For lines (where center isn't the primary positioning anchor in this context), scenes, or when the `Layout` is `random` or `spread` such that each instance has a unique, non-grid/non-pixel-aligned center. If `crisp-pixel-pos` was in the filename for lines, this is `N/A`.
    *   This refers to the *geometric center's* alignment characteristics *before* adjustments for crisp edge rendering are made.

---

### 11. `EdgeAlignment`

*   **Description**: Indicates if the shape's final rendered edges (considering stroke) align with pixel boundaries to avoid anti-aliasing "feathering".
*   **Observed Values in v15.md**: `mixed`, `not-crisp`, `crisp`.
*   **Criteria**:
    *   `crisp`:
        *   If the filename explicitly contains "crisp" or "precise".
        *   If the test code uses a known crisping function like `adjustDimensionsForCrispStrokeRendering()`.
        *   If manual calculations are performed to ensure pixel boundary alignment (e.g., adjusting coordinates by `+/-0.5` for odd-width strokes, or ensuring even dimensions for even strokes centered on grid lines).
        *   Often implied if `CenteredAt` is `pixel` or `grid` and stroke/shape dimensions are handled correctly.
    *   `not-crisp`:
        *   Default for shapes with fully random positions and sizes unless specific crisping logic is applied.
        *   All oblique lines, or lines with floating-point start/end coordinates not specifically aligned to pixel boundaries.
        *   Rotated shapes where rotation is not by multiples of 90 degrees, unless specific logic ensures crispness post-rotation (rare).
    *   `mixed`: If a test intentionally renders some elements crisp and others not-crisp, or if the crispness varies unpredictably within the test items. For `scene--all-shapes-combined--test.js`, this is `mixed` because sub-components have varying crispness.
    *   `N/A`: If the concept is not applicable (though usually one of `crisp`, `not-crisp`, or `mixed` should apply to rendered shapes).

---

### 12. `Orientation`

*   **Description**: Describes the rotation or fixed orientation of shapes. Merges previous "Orientation" and "Rotation" columns.
*   **Observed Values in v15.md**: `mixed`, `random`, `fixed-90-deg`, `N/A`, `square`, `45-degree`, `horizontal`, `vertical`.
*   **Criteria**:
    *   `horizontal`, `vertical`, `45-degree`: For lines or other shapes explicitly drawn at these orientations.
    *   `square`: For axis-aligned rectangles (no rotation), or lines explicitly drawn at 0, 90, 180, 270 degrees.
    *   `rotated`: If `ctx.rotate()` is used with an arbitrary, non-axis-aligned angle, or if coordinates imply this.
    *   `random`: If the rotation angle or orientation is randomized.
    *   `fixed-90-deg`: A specific case for arcs at 90 degrees. (This should likely be standardized to just `90-deg` or similar under a broader "fixed-angle" concept if needed).
    *   `N/A`: For circles (which have no inherent orientation beyond their center), or if orientation is not a relevant characteristic of the test.
    *   The `scene--all-shapes-combined--test.js` is `mixed` as it contains various orientations.

---

### 13. `ArcAngle`

*   **Description**: Specifies the angular extent of an arc. Applicable only to `arcs`.
*   **Observed Values in v15.md**: `mixed`, `randomized`, `90-deg`, `N/A`.
*   **Criteria**:
    *   `90-deg`: For arcs explicitly drawn with a 90-degree extent.
    *   `randomized`: If `startAngle` and `endAngle` are randomized to produce variable extents.
    *   `mixed`: For the scene test (as it contains arcs that would fit other categories). Could also apply if a single test draws arcs of multiple, distinct fixed extents.
    *   `N/A`: For all non-arc shapes.

---

### 14. `RoundRectRadius`

*   **Description**: Specifies the corner radius for rounded rectangles. Applicable only to `rounded-rects`.
*   **Observed Values in v15.md**: `mixed`, `N/A`, `large-cat`, `randomized`, `unknown`.
*   **Criteria**:
    *   `large-cat`: If the filename or code explicitly indicates a "large" radius category (e.g., `fixedRadius = 40` in a test named with "large-radius").
    *   `randomized`: If the corner radius is determined by `SeededRandom.getRandom()`.
    *   `unknown`: If the radius is fixed but its specific value or category isn't clear from the filename or readily available code insights from previous steps.
    *   `mixed`: For the scene test. Could also apply if a test draws rounded rectangles with multiple distinct fixed or categorized radii.
    *   `N/A`: For all non-rounded-rectangle shapes.

---

### 15. `Uncaptured Aspects`

*   **Description**: A notes field to list any significant test characteristics or details that are not fully captured by the preceding structured facet columns. This is especially important after removing parenthesized comments, as nuances might have been lost.
*   **Values**: Free-form text.
*   **Criteria**: Populated by reviewing the original filename, test description, and the values assigned to other facets. If a facet value is "mixed" or "random", this column might specify *what* aspects are mixed/randomized (e.g., "Specific randomization ranges for radius, fill/stroke colors."). If a value is a default or an assumption, this column might note that. It also captures details too specific for a facet, like precise grid dimensions or the exact meaning of a "randparams" flag if it affects multiple attributes.

---

This detailed breakdown should clarify the structure and content of `test_case_naming_analysis_v15.md`. 