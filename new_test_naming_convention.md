# Proposed New Test Naming Convention

## 1. Intent and Rationale

After a thorough analysis of all test cases (summarized in `test_case_naming_analysis_v18.md`), it became clear that the legacy test filenames did not consistently or completely capture the full range of parameters being tested. The intent of this new naming convention is to create a clear, information-dense, and predictable filename structure for all high-level tests.

This convention aims to solve the following problems:
*   **Ambiguity:** Old names often omitted key details (e.g., stroke thickness, crisp rendering, layout).
*   **Inconsistency:** The order and terminology of facets were not standardized.
*   **Lack of Detail:** Critical aspects like context transformations (translate, rotate, scale) and clipping were not captured at all.

By embedding a comprehensive set of facets directly into the filename in a standardized way, we make each test file self-describing. This improves discoverability, makes it easier to understand a test's purpose at a glance, and facilitates targeted test selection.

## 2. Core Principles

The naming convention is governed by the following principles:

*   **Fixed Order:** Facets always appear in the same sequence to ensure predictability.
*   **Concise Values:** Facet values are abbreviated to be short but recognizable. Many are prefixed to provide context and avoid ambiguity.
*   **Single-Dash Separator:** Facet components are separated by a single dash (`-`).
*   **Omission Rules:** To keep filenames manageable, facets are omitted entirely if they are not applicable or represent a default/negative state (e.g., context transformations that are `none`, or clipping facets when no clipping occurs).
*   **Suffix:** All test filenames end with `-test.js`.

## 3. Facet Order and Prefixes

Facets are ordered from the most general to the most specific, following this sequence:

1.  `Shape` (no prefix)
2.  `Count` (no prefix)
3.  `Size` (no prefix)
4.  `FillStyle` (no prefix, e.g., `fOpaq`)
5.  `StrokeStyle` (no prefix, e.g., `sOpaq`)
6.  `StrokeThickness` (no prefix, e.g., `sw1px`)
7.  `Layout` (prefix `lyt`)
8.  `CenteredAt` (prefix `cen`)
9.  `EdgeAlignment` (`edge` prefix)
10. `Orientation` (prefix `orn`)
11. **Shape-Specific Detail Block** (if applicable):
    *   `ArcAngleExtent` (prefix `arcA`) OR
    *   `RoundRectRadius` (prefix `rrr`)
12. **Context Transformation Block** (omit if all are `none`):
    *   `ContextTranslation` (prefix `ctxTrans`)
    *   `ContextRotation` (prefix `ctxRot`)
    *   `ContextScaling` (prefix `ctxScale`)
13. **Clipping Block** (omit if no clipping is applied):
    *   `clpOn[Shape]`
    *   `clpCt[Count]`
    *   `clpArr[Arrangement]`
    *   `clpSz[Size]`
    *   `clpEdge[Alignment]`

## 4. Facet Value Abbreviations

| Facet | Full Value(s) | Abbreviation / Prefix |
|---|---|---|
| **Shape** | `lines`, `circles`, `rectangles`, `rounded-rects`, `arcs`, `scene`, `mixed` | `line`, `circle`, `rect`, `roundrect`, `arc`, `scene`, `mixshape` |
| **Count** | `single`, `multi`, `multi-[N]` | `sgl`, `multi`, `m[N]` (e.g., `m5`) |
| **SizeCategory** | `XS`...`XL`, `mixed` | `xs`, `s`, `m`, `l`, `xl`, `szMix` |
| **FillStyle** | `none`, `opaque`, `semitransparent`, `mixed` | `fNone`, `fOpaq`, `fSemi`, `fMix` |
| **StrokeStyle** | `none`, `opaque`, `semitransparent`, `mixed` | `sNone`, `sOpaq`, `sSemi`, `sMix` |
| **StrokeThickness**| `[N]px`, `[N]-[M]px`, `mixed` | `sw[N]px`, `sw[N]-[M]px`, `swMix` |
| **Layout** | `spread`, `grid`, `random`, `centered`, `mixed` | `lytSpread`, `lytGrid`, `lytRand`, `lytCenter`, `lytMix` |
| **CenteredAt** | `pixel`, `grid`, `mixed-pixel-grid`, `random` | `cenPx`, `cenGrid`, `cenMixPG`, `cenRand` |
| **EdgeAlignment** | `crisp`, `not-crisp`, `mixed` | `edgeCrisp`, `edgeNotCrisp`, `edgeMix` |
| **Orientation** | `horizontal`, `vertical`, `square` (axis-aligned), `45-degree`, `random` | `ornHoriz`, `ornVert`, `ornAxial`, `ornDeg45`, `ornRand` |
| **ArcAngleExtent**| `90-deg`, `randomized`, `mixed` | `arcADeg90`, `arcARand`, `arcAMix` |
| **RoundRectRadius**| `large-cat`, `randomized`, `mixed`, `fixed-[N]` | `rrrLrg`, `rrrRand`, `rrrMix`, `rrrFix[N]` |
| **ContextTrans**| `none`, `fixed`, `random` | `(omitted)`, `ctxTransFixed`, `ctxTransRand` |
| **ContextRot** | `none`, `fixed`, `random` | `(omitted)`, `ctxRotFixed`, `ctxRotRand` |
| **ContextScale**| `none`, `fixed`, `random` | `(omitted)`, `ctxScaleFixed`, `ctxScaleRand` |
| **Clip on Shape**| `circle`, `arc`, `rect`, `rounded rect` | `clpOnCirc`, `clpOnArc`, `clpOnRect`, `clpOnRoundRect` |
| **Clip Count** | `one`, `many` | `clpCt1`, `clpCtN` |
| **Clip Arrange**| `centered`, `random`, `grid`, `spread` | `clpArrCenter`, `clpArrRand`, `clpArrGrid`, `clpArrSpread` |
| **Clip Size** | `XS`...`XL`, `mixed` | `clpSzXs`...`clpSzXl`, `clpSzMix` |
| **Clip Edge Align**| `crisp`, `not-crisp` | `clpEdgeCrisp`, `clpEdgeNotCrisp` |

## 5. Omission Rules

To prevent excessively long filenames, the following components should be omitted:

1.  **N/A Facets:** If a facet does not apply to a shape type (e.g., `ArcAngleExtent` for a `rect`), it is omitted.
2.  **Context Transformations:** If `ContextTranslation`, `ContextRotation`, and `ContextScaling` are all `none`, the entire block is omitted. If one is present, it is included.
3.  **Clipping:** If `Clipped on shape` is `none`, the entire clipping block (all `clp...` facets) is omitted.
4.  **StrokeThickness:** It is recommended to omit `StrokeThickness` if `StrokeStyle` is `sNone`.

## 6. Examples

#### Example 1: A complex rounded rectangle test

*   **Old Name:** `rounded-rect--single--rand-semitrans-stroke-fill--crisp-center--test.js`
*   **Analysis:**
    *   Shape: `roundrect`
    *   Count: `sgl`
    *   Size: `szMix`
    *   Fill: `fSemi`
    *   Stroke: `sSemi`
    *   StrokeWidth: `swMix`
    *   Layout: `lytCenter`
    *   CenteredAt: `cenMixPG`
    *   Edge: `edgeCrisp`
    *   RoundRectRadius: `rrrRand`
*   **New Name:** `roundrect-sgl-szMix-fSemi-sSemi-swMix-lytCenter-cenMixPG-edgeCrisp-rrrRand-test.js`

#### Example 2: A test using context rotation and translation

*   **Old Name:** `rectangles--rotated--multi--varsize--randparams--randpos--randrot--test.js`
*   **Analysis:**
    *   Shape: `rect`
    *   Count: `m5`
    *   Size: `szMix`
    *   Fill: `fOpaq`
    *   Stroke: `sOpaq`
    *   StrokeWidth: `sw1-10px`
    *   Layout: `lytSpread`
    *   CenteredAt: `cenRand`
    *   Edge: `edgeNotCrisp`
    *   Orientation: `ornRand`
    *   ContextTranslation: `ctxTransRand`
    *   ContextRotation: `ctxRotRand`
*   **New Name:** `rect-m5-szMix-fOpaq-sOpaq-sw1-10px-lytSpread-cenRand-edgeNotCrisp-ornRand-ctxTransRand-ctxRotRand-test.js`

#### Example 3: A simple line test

*   **Old Name:** `lines--M-size--no-fill--1px-opaque-stroke--crisp-pixel-pos--horizontal-orient--test.js`
*   **Analysis:**
    *   Shape: `line`
    *   Count: `sgl`
    *   Size: `m`
    *   Fill: `fNone`
    *   Stroke: `sOpaq`
    *   StrokeWidth: `sw1px`
    *   Layout: `lytRand`
    *   Edge: `edgeCrisp`
    *   Orientation: `ornHoriz`
*   **New Name:** `line-sgl-m-fNone-sOpaq-sw1px-lytRand-edgeCrisp-ornHoriz-test.js` 