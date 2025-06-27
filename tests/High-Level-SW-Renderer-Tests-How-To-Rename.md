## How to Rename a High-Level Test

This guide outlines the necessary steps to correctly rename an existing high-level test file, ensuring it remains integrated with both the visual and performance test runners. The process involves three key steps: renaming the file, updating its internal registration call, and updating the HTML files that load it.

### Step 1: Rename the JavaScript Test File

First, rename the test file in the `tests/browser-tests/test-cases/` directory. The new filename should conform to the project's naming convention as detailed in `new_test_naming_convention.md`.

**Example:**

*   **Old Filename:** `scene--all-shapes-combined--test.js`
*   **New Filename:** `scene-multi-szMix-fMix-sMix-swMix-lytMix-edgeMix-ornMix-arcAMix-rrrMix-ctxTransFixed-ctxRotFixed-test.js`

You can use a simple `mv` command for this:
```bash
mv tests/browser-tests/test-cases/scene--all-shapes-combined--test.js tests/browser-tests/test-cases/scene-multi-szMix-fMix-sMix-swMix-lytMix-edgeMix-ornMix-arcAMix-rrrMix-ctxTransFixed-ctxRotFixed-test.js
```

### Step 2: Update the Internal Registration in the Test File

Each test file contains a call to the `registerHighLevelTest` helper function, which handles its registration with the test frameworks. You must update the arguments in this call to reflect the new filename and its corresponding metadata.

1.  **Open the renamed `.js` file.**
2.  **Locate the `registerHighLevelTest(...)` call at the end of the file.**
3.  **Update the first argument** (the filename string) to match the new filename exactly.
4.  **Review and update other metadata** like `displayName` and `description` to ensure they are consistent with the new, more descriptive filename.

**Example:**

**Before:**
```javascript
// Register the test
registerHighLevelTest(
    'scene--all-shapes-combined--test.js', // <-- This needs to be changed
    draw_scene_all_shapes_combined,
    'scenes',
    {
        // ...
    },
    {
        displayName: 'Perf: Scene All Combined', // <-- This might need an update
        description: 'Performance of drawing a combined scene...' // <-- This has to be set according to the description in the header comment
    }
);
```

**After:**
```javascript
// Register the test
registerHighLevelTest(
    'scene-multi-szMix-fMix-sMix-swMix-lytMix-edgeMix-ornMix-arcAMix-rrrMix-ctxTransFixed-ctxRotFixed-test.js', // <-- Updated filename
    draw_scene_all_shapes_combined,
    'scenes',
    {
        // ...
    },
    {
        displayName: 'Scenes: All-shapes-combined', // <-- Updated for consistency
        description: 'A test scene combining various shapes...' // <-- Updated to be more descriptive
    }
);
```

### Step 3: Update the HTML Test Harnesses

You must update the `<script>` tags in the HTML files that load the test cases. There are two primary files to check:

*   `tests/browser-tests/high-level-tests.html` (for visual tests)
*   `tests/browser-tests/performance-tests.html` (for performance tests)

Find the line that includes the old test filename and change the `src` attribute to point to the new filename.

**Example:**

In `high-level-tests.html` and `performance-tests.html`:

**Before:**
```html
<script src="test-cases/scene--all-shapes-combined--test.js"></script>
```

**After:**
```html
<script src="test-cases/scene-multi-szMix-fMix-sMix-swMix-lytMix-edgeMix-ornMix-arcAMix-rrrMix-ctxTransFixed-ctxRotFixed-test.js"></script>
```

Once these three steps are completed, the test will be correctly renamed and fully integrated back into the testing suites.

### Step 4: Remove the "New Filename" part of the comment from the header comment

i.e. in the example, remove:
"
 * New Filename: scene-multi-szMix-fMix-sMix-swMix-lytMix-edgeMix-ornMix-arcAMix-rrrMix-ctxTransFixed-ctxRotFixed-test.js
 *
"