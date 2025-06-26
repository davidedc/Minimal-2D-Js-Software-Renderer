# Explanation of Test Case Analysis Data (`test_case_naming_analysis_v19.tsv`)

This document provides a detailed explanation of the facets used in the final test case analysis file, `test_case_naming_analysis_v19.tsv`. This TSV file is the definitive, machine-readable output of a comprehensive analysis project, containing a full breakdown of every test case and the proposed new filename generated according to the convention defined in `new_test_naming_convention.md`.

## Source of Test Files

The test files analyzed in this table originate from two primary directories within the workspace:

1.  `/Users/davidedellacasa/code/Minimal-2D-Js-Software-Renderer/tests/browser-tests/test-cases/`
2.  `/Users/davidedellacasa/code/Minimal-2D-Js-Software-Renderer/tests/browser-tests/performance-tests-legacy/` (though these are legacy, their naming provides context for facet evolution)

The analysis aims to create a unified and descriptive naming convention applicable to tests from both sources, and for future tests.

## Column (Facet) Breakdown

The `test_case_naming_analysis_v19.tsv` file includes the following columns. The `New Test Name` column is generated based on the values of the preceding facet columns.

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
*   **Observed Values in v19.tsv**: `mixed`, `arcs`, `circles`, `rounded-rects`, `rectangles`, `lines`.
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
*   **Observed Values in v19.tsv**: `multi`, `multi-5`, `multi-12`, `multi-8`, `single`, `multi-10`, `multi-20`, `multi-15`.
*   **Criteria**:
    *   `single`: One primary shape instance is drawn.
    *   `multi-[N]`: A specific number `N` of shapes are drawn (e.g., `multi-5` means 5 shapes). Often seen in filenames like `arcs--multi-5...`.
    *   `multi`: Multiple shapes are drawn, but the exact count isn't specified in the filename or is variable based on internal logic (e.g., the scene test).

---

### 5. `SizeCategory`

*   **Description**: Classifies the general size of the shapes being rendered. This is determined by applying a **unified, non-overlapping size scale** to a key linear dimension of the shape (e.g., length, radius, or longest side).
*   **Observed Values in v19.tsv**: `mixed`, `L`, `M`, `S`, `XS`, `XL`.

#### Unified T-Shirt Size Scale

This single scale is used for all linear pixel measurements across all shape categories.

| Size Category | Unified Pixel Range |
| :--- | :--- |
| **XS** | `5-15px` |
| **S** | `16-39px` |
| **M** | `40-79px` |
| **L** | `80-159px` |
| **XL** | `160-400px` |

#### Application of the Unified Scale

*   **For `lines`**: The `SizeCategory` is determined by applying the unified scale to the line's **length**.
*   **For `circles` and `arcs`**: The `SizeCategory` is determined by applying the unified scale to the shape's **radius**.
*   **For `rectangles` and `rounded-rects`**: The `SizeCategory` is determined by applying the unified scale to the rectangle's **longest side** (i.e., `Math.max(width, height)`).

*   **Criteria for Assignment (as applied for v19)**:
    *   `XS`, `S`, `M`, `L`, `XL`: Assigned if the shape's key dimension (length, radius, or longest side) consistently falls within the corresponding pixel range of the unified scale. If dimensions are randomized, the entire randomized range must fall within a single bucket. Filename cues (e.g., `--m-size--`) serve as hints but are superseded by code analysis based on the unified scale.
    *   `mixed`:
        *   If a test script randomizes a shape's key dimension such that the resulting range spans *multiple* defined buckets (e.g., a rectangle width randomized from 30px to 90px would be `mixed` as it covers S, M, and L).
        *   If a test draws multiple shapes of distinctly different fixed size categories (e.g., one XS circle and one L circle).
        *   If the `Shape category` itself is `mixed` (like in `scene--all-shapes-combined--test.js`), then `SizeCategory` will also typically be `mixed`.
    *   The primary source for determination is the test's `.js` source file located in `/Users/davidedellacasa/code/Minimal-2D-Js-Software-Renderer/tests/browser-tests/test-cases/` or `/Users/davidedellacasa/code/Minimal-2D-Js-Software-Renderer/tests/browser-tests/performance-tests-legacy/`.

---

### 6. `FillStyle`

*   **Description**: Indicates the nature of the shape's fill, focusing on its presence and opacity.
*   **Observed Values in v19.tsv**: `N/A`, `mixed`, `opaque`, `none`, `semitransparent`.
*   **Criteria**:
    *   `none`: No fill is applied (e.g., lines by default, or if `fillStyle` alpha is 0, or no fill operation is called for a shape). Filenames with `--no-fill--` also map to this.
    *   `opaque`: A fill is applied with full opacity (alpha = 1.0 or 255). This is often the default for `getRandomColor()` if alpha isn't specified.
    *   `semitransparent`: A fill is applied with partial opacity (alpha between 0 and 1, exclusive). Filenames with "semitransparent_fill" or "transparent_fill" (if fill is present but alpha is <1) lead to this.
    *   `mixed`: If different shapes in the test have different fill styles (e.g., some opaque, some none), or if the fill opacity itself is randomized across these categories. The `scene--all-shapes-combined--test.js` is a prime example.
    *   `N/A`: For the main scene test, as fills are per-component.
    *   Determined by analyzing `ctx.fillStyle` assignments, alpha values in color objects, and calls to fill methods (`fillRect`, `fillCircle`, `fillAndOuterStrokeArc`, etc.) in the test scripts. Parenthesized comments were removed.

---

### 7. `StrokeStyle`

*   **Description**: Indicates the nature of the shape's stroke, focusing on its presence and opacity.
*   **Observed Values in v19.tsv**: `N/A`, `mixed`, `opaque`, `none`, `semitransparent`.
*   **Criteria**:
    *   `none`: No stroke is applied (e.g., `strokeWidth` is 0, no stroke operation, or filename explicitly states `--no-stroke--` or `--no-NA-stroke--`).
    *   `opaque`: A stroke is applied with full opacity. This is common if `strokeStyle` is set by `getRandomColor()` without specific alpha manipulation, or if color is a fixed opaque color. Filenames with "opaque_stroke" also map here.
    *   `semitransparent`: A stroke is applied with partial opacity. Filenames with "semitransparent_stroke" or "semi-stroke" or "transparent_stroke" lead to this.
    *   `mixed`: If different shapes in the test have different stroke styles, or if stroke opacity is randomized across opaque/semitransparent/none categories. The `scene--all-shapes-combined--test.js` is an example.
    *   `N/A`: For the main scene test, as strokes are per-component.
    *   Determined by analyzing `ctx.strokeStyle`, `ctx.lineWidth`, alpha values in stroke color objects, and calls to stroke methods (`strokeRect`, `strokeCircle`, `fillAndOuterStrokeArc`, etc.) in the test scripts. Parenthesized comments were removed.

---

### 8. `StrokeThickness`

*   **Description**: Specifies the thickness of the stroke.
*   **Observed Values in v19.tsv**: `none`, `1px`, `2px`, `3px`, `5px`, `10px`, `1px-4px`, `1px-5px`, `1px-10px`, `1px-11px`, `10px-20px`, `1px-30px`, `mixed`.
*   **Criteria (as applied for v19)**:
    *   `none`: If `StrokeStyle` is `none`, or if the test script explicitly sets `lineWidth` to 0 or does not perform a stroke operation.
    *   `[N]px`: If an explicit, single pixel value is used. This is determined either from the filename (e.g., `--1px_...`, `10px_black_opaque_stroke`) or by analyzing the test script's code to find a constant `lineWidth` assignment.
    *   `[N]px-[M]px`: If stroke width is randomized within a discernible, continuous integer pixel range. This is determined by analyzing the test script's code, typically looking for `SeededRandom.getRandom()` calls that define a min and max for `lineWidth` (e.g., `Math.floor(SeededRandom.getRandom() * RANGE_SIZE) + MIN_WIDTH`).
    *   `mixed`:
        *   Used for the main scene test (`scene--all-shapes-combined--test.js`) as it combines components with varying stroke thicknesses.
        *   If a test script uses a discrete set of different fixed pixel values for strokes within the same test (e.g., drawing some shapes with 1px, then 2px, then 4px strokes, as in `arcs--multi-12--90-deg--fixed-params--grid-layout--test.js`).
        *   If randomization logic in the code results in a scattered set of specific values rather than a continuous range (e.g., only specific even numbers like `2, 4, ..., 12px`).
        *   Original t-shirt sizes (`L`, `M`, `XL`) from filenames in legacy tests were re-evaluated by examining their source code. If the code revealed a specific pixel value or a continuous range, it was converted to `[N]px` or `[N]px-[M]px`. If the code was unavailable or the t-shirt size didn't map to a clear pixel definition, it would have remained `mixed`, but for the final analysis, all such legacy files provided were mapped to specific ranges.
    *   The `unknown` values from previous versions were resolved by filename cues or by assuming `mixed` if no other information was available (though for the final analysis, all `unknown` were resolved to more specific values based on filename or code). Parenthesized comments were removed.

---

### 9. `Layout`

*   **Description**: Describes the overall arrangement or placement strategy of shapes on the canvas.
*   **Observed Values in v19.tsv**: `spread`, `grid`, `random`, `centered`, `mixed`, `N/A`.
*   **Criteria**:
    *   `spread`: Multiple shapes are drawn, and their positions are randomized or systematically varied to distribute them across the canvas, often with the intent to minimize overlap for visual inspection (e.g., `getRandomPoint()` called for each instance in a loop, or `Math.random() * canvasDimension` applied to x/y of each instance).
    *   `grid`: Shapes are explicitly arranged in a grid formation.
    *   `random`: Typically for a single shape whose position is chosen randomly on the canvas. Could also apply to multiple shapes if their random positioning doesn't inherently imply a "spread" (less common).
    *   `centered`: A single primary shape (or a fixed composition) is explicitly positioned at or near the canvas center.
    *   `mixed`: Used for tests that combine multiple distinct layout strategies, for instance when some shapes are arranged in a `grid` and others are `spread` randomly.
    *   `N/A`: If layout is not a primary characteristic or the concept doesn't clearly apply (e.g., for some single-item tests where the focus is purely on rendering parameters other than its specific global placement).

---

### 10. `CenteredAt`

*   **Description**: For shapes like circles, arcs, and rectangles, this specifies if their geometric center's coordinates are aligned with a pixel center, a grid intersection, or neither. This is important to test because that's basically the key factor to get many shapes to draw crisply (or have pixel-aligned edges/bounds) in HTML5 Canvas, and there might be some non-obvious fiddling with half-points when drawing the shapes with the sw renderer.
*   **Observed Values in v19.tsv**: `N/A`, `random`, `mixed-pixel-grid`, `pixel`, `grid`.
*   **Criteria**:
    *   `pixel`: Center coordinates are `*.5` (e.g., `centerX = Math.floor(width/2) + 0.5`).
    *   `grid`: Center coordinates are integers (e.g., `centerX = Math.floor(width/2)`).
    *   `mixed-pixel-grid`: the center is either centered at pixel or at grid. For shapes where each dimension can be chosen independently (rectangles and rounded rectangles), this value also covers the case of one center coordinate being `*.5` and the other being an integer - this is because one can still get crisp drawings in with appropriatly chosen width/height.
    *   `random`: If the shape's center is determined by fully random logic (e.g., `Math.random() * canvasDimension`) without specific snapping to pixel/grid for the center point itself.
    *   `N/A`: For lines (where center isn't the primary positioning anchor in this context), scenes, or when the `Layout` is `random` or `spread` such that each instance has a unique, non-grid/non-pixel-aligned center. If `crisp-pixel-pos` was in the filename for lines, this is `N/A`.

---

### 11. `EdgeAlignment`

*   **Description**: Indicates if the shape's final rendered edges (considering stroke) align with pixel boundaries. In general pixel-aligned shapes result in crisp drawing (e.g. in case of rectangles) or boundary (e.g. in case of rounded rects, arcs, circles).
*   **Observed Values in v19.tsv**: `mixed`, `not-crisp`, `crisp`.
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
*   **Observed Values in v19.tsv**: `mixed`, `random`, `fixed-90-deg`, `N/A`, `square`, `45-degree`, `horizontal`, `vertical`.
*   **Criteria**:
    *   `horizontal`, `vertical`, `45-degree`: For lines or other shapes explicitly drawn at these orientations.
    *   `square`: For axis-aligned rectangles (no rotation), or lines explicitly drawn at 0, 90, 180, 270 degrees.
    *   `rotated`: If `ctx.rotate()` is used with an arbitrary, non-axis-aligned angle, or if coordinates imply this.
    *   `random`: If the rotation angle or orientation is randomized.
    *   `fixed-90-deg`: A specific case for arcs at 90 degrees.
    *   `N/A`: For circles (which have no inherent orientation beyond their center), or if orientation is not a relevant characteristic of the test.
    *   The `scene--all-shapes-combined--test.js` is `mixed` as it contains various orientations.
    *   For `arcs`, this describes the rotation of the arc's baseline (e.g., `vertical` for an arc in the top-right or bottom-right quadrant), and is distinct from its extent.

---

### 13. `ArcAngleExtent`

*   **Description**: Specifies the angular extent (or span) of an arc. Applicable only to `arcs`. This facet was previously named `ArcAngle`.
*   **Observed Values in v19.tsv**: `mixed`, `randomized`, `90-deg`, `N/A`.
*   **Criteria**:
    *   `90-deg`: For arcs explicitly drawn with a 90-degree extent.
    *   `randomized`: If `startAngle` and `endAngle` are randomized to produce variable extents.
    *   `mixed`: For the scene test (as it contains arcs that would fit other categories). Could also apply if a single test draws arcs of multiple, distinct fixed extents.
    *   `N/A`: For all non-arc shapes.

---

### 14. `RoundRectRadius`

*   **Description**: Specifies the corner radius for rounded rectangles. Applicable only to `rounded-rects`.
*   **Observed Values in v19.tsv**: `mixed`, `N/A`, `large-cat`, `randomized`.
*   **Criteria**:
    *   `large-cat`: If the filename or code explicitly indicates a "large" radius category (e.g., `fixedRadius = 40` in a test named with "large-radius").
    *   `randomized`: If the corner radius is determined by `SeededRandom.getRandom()`.
    *   `mixed`: For the scene test. Could also apply if a test draws rounded rectangles with multiple distinct fixed or categorized radii.
    *   `N/A`: For all non-rounded-rectangle shapes.
    *   The `unknown` values from previous versions were resolved to `randomized` after code analysis.

---

### 15. `ContextTranslation`

*   **Description**: Specifies if the rendering context is translated using `ctx.translate()`.
*   **Possible Values**: `none`, `fixed`, `random`.
*   **Criteria**: Determined by inspecting test source code for calls to `ctx.translate()`. `none` if not called; `fixed` if called with constant values; `random` if called with randomized values.

---

### 16. `ContextRotation`

*   **Description**: Specifies if the rendering context is rotated using `ctx.rotate()`.
*   **Possible Values**: `none`, `fixed`, `random`.
*   **Criteria**: Determined by inspecting test source code for calls to `ctx.rotate()`. `none` if not called; `fixed` if called with a constant angle; `random` if called with a randomized angle.

---

### 17. `ContextScaling`

*   **Description**: Specifies if the rendering context is scaled using `ctx.scale()`.
*   **Possible Values**: `none`, `fixed`, `random`.
*   **Criteria**: Determined by inspecting test source code for calls to `ctx.scale()`. `none` if not called; `fixed` if called with constant factors; `random` if called with randomized factors.

---

### 18. `Uncaptured Aspects`

*   **Description**: A notes field to list any significant test characteristics or details that are not fully captured by the preceding structured facet columns. This is especially important after removing parenthesized comments, as nuances might have been lost.
*   **Values**: Free-form text.
*   **Criteria**: Populated by reviewing the original filename, test description, and the values assigned to other facets. If a facet value is "mixed" or "random", this column might specify *what* aspects are mixed/randomized (e.g., "Specific randomization ranges for radius, fill/stroke colors."). If a value is a default or an assumption, this column might note that. It also captures details too specific for a facet, like precise grid dimensions or the exact meaning of a "randparams" flag if it affects multiple attributes.

---

### 19. `Clipped on shape`

*   **Description**: Specifies the type of geometric primitive used to define the clipping region.
*   **Possible Values**: `none`, `circle`, `arc`, `rect`, `rounded rect`.
*   **Criteria**: Determined by identifying the shape used to create the clipping path before `ctx.clip()` (or an equivalent operation) is called. If no clipping is applied, this value is `none`.

---

### 20. `Clipped on shape count`

*   **Description**: Specifies whether the clipping region is formed by a single clipping shape or multiple clipping shapes.
*   **Possible Values**: `n/a`, `one`, `many`.
*   **Criteria**:
    *   `n/a`: If `Clipped on shape` is `none`.
    *   `one`: If a single shape instance defines the clipping region.
    *   `many`: If multiple shape instances are combined to define the clipping region.

---

### 21. `Clipped on shape arrangement`

*   **Description**: Describes the layout or placement strategy of the clipping shape(s) on the canvas.
*   **Possible Values**:
    *   `n/a`: If `Clipped on shape` is `none`.
    *   If `Clipped on shape count` is `one`: `centered`, `random`.
    *   If `Clipped on shape count` is `many`: `grid`, `spread`, `random`.
*   **Criteria**: Determined by how the clipping shapes are positioned. `n/a` if no clipping. If a single clipping shape is used, it's categorized by its placement (e.g., `centered`, `random`). If multiple clipping shapes are used, their collective arrangement is described (e.g., `grid`, `spread` if distributed, or `random` if placed without a specific collective pattern).

---

### 22. `Clipped on shape size`

*   **Description**: Classifies the general size of the clipping shape(s), using the T-shirt sizing categories (XS-XL) consistent with the `SizeCategory` for drawn shapes. This is determined by comparing the actual dimensions of the clipping shape(s) (from source code analysis) against standardized pixel ranges.
*   **Possible Values**: `n/a`, `XS`, `S`, `M`, `L`, `XL`, `mixed`.
*   **Criteria**:
    *   `n/a`: If `Clipped on shape` is `none`.
    *   `XS`, `S`, `M`, `L`, `XL`: Assigned if the clipping shape(s) dimensions consistently fall within the corresponding standardized pixel range for its category.
    *   `mixed`:
        *   If a single clipping shape has dimensions that are randomized such that its resulting size range spans *multiple* defined T-shirt size buckets.
        *   If multiple clipping shapes are used and they belong to distinctly different fixed size categories (e.g., one XS clipping circle and one L clipping circle are used together).
    *   The same standardized pixel ranges as defined for the main `SizeCategory` facet are used for comparison.

---

### 23. `Clipped on shape edge alignment`

*   **Description**: Specifies if the edges/bounds of the geometric primitive used for clipping are themselves pixel-aligned. The values are called "crisp" / "not-crisp" because in general pixel-aligned shapes result in crisp drawing (e.g. in case of rectangles) or boundary (e.g. in case of rounded rects, arcs, circles).
*   **Possible Values**: `n/a`, `crisp`, `not-crisp`.
*   **Criteria**:
    *   `n/a`: If `Clipped on shape` is `none`.
    *   `crisp`: If the clipping shape is drawn using coordinates and dimensions that ensure its edges/bounds fall exactly on pixel boundaries (e.g., using `+/-0.5` adjustments, ensuring even dimensions for strokes centered on grid lines, etc.).
    *   `not-crisp`: If the clipping shape's coordinates or dimensions would result in edges/bounds that are not pixel-aligned.

---

### 24. `New Test Name`

*   **Description**: The final, proposed new filename for the test script, generated programmatically based on the preceding facet values and the rules defined in `new_test_naming_convention.md`.
*   **Values**: A string representing the new filename, e.g., `rect-sgl-s-fNone-sOpaq-sw1px-lytCenter-cenPx-edgeCrisp-ornAxial-test.js`.
*   **Criteria**: Generated by applying the naming convention.

---

This detailed breakdown should clarify the structure and content of `test_case_naming_analysis_v19.tsv`. 