// Utility function to streamline the registration of high-level tests
// for both visual regression (RenderTestBuilder) and performance testing.

/**
 * Registers a high-level test with RenderTestBuilder and/or the performance test registry.
 *
 * @param {string} filename - The filename of the test script (e.g., "rectangles--S-size--filled--test.js").
 * @param {function} drawFunction - The actual drawing function (e.g., draw_rectangles__S_size__filled).
 * @param {string} category - The category of the test (e.g., "rectangles", "lines", "circles").
 * @param {object} checkConfiguration - An object specifying which checks to apply and their parameters for RenderTestBuilder.
 * @param {object} [performanceTestConfig={}] - Optional configuration overrides for performance test registration.
 */
function registerHighLevelTest(filename, drawFunction, category, checkConfiguration, performanceTestConfig = {}) {
    // --- 1. Derive common properties from filename ---
    // Handle both formats: with .js extension and without
    const baseId = filename.replace(/--test(\.js)?$/, '');
    const parts = baseId.split('--');
    const categoryFromFile = parts[0]; // Category can also be explicitly passed, which is preferred.
    const featureParts = parts.slice(1);

    let titleCategory = category.charAt(0).toUpperCase() + category.slice(1);
    if (category === 'rounded-rects') titleCategory = 'Rounded Rects'; // Handle specific cases
    if (category === 'scene') titleCategory = 'Scene';


    const titleFeatures = featureParts.map(part =>
        part.split('_').map(subPart => subPart.charAt(0).toUpperCase() + subPart.slice(1)).join(' ')
    ).join(' ');

    const defaultTitle = `${titleCategory}: ${titleFeatures}`;
    const defaultDescription = `Test for ${category} with features: ${featureParts.join(', ')}.`;

    const shortFeatures = featureParts.map(part => {
        return part.split('_').map(subPart => {
            if (subPart.length > 4) return subPart.substring(0, 3) + (isNaN(subPart.charAt(3)) ? '.' : subPart.charAt(3));
            return subPart;
        }).join('');
    }).join(' ');
    const perfCategoryAbbrev = category.length > 4 ? category.substring(0,4) : category;
    const defaultPerfDisplayName = `Perf: ${perfCategoryAbbrev.charAt(0).toUpperCase() + perfCategoryAbbrev.slice(1)} ${shortFeatures}`;


    // --- 2. Register with RenderTestBuilder (Visual Tests) ---
    if (typeof RenderTestBuilder === 'function' && typeof define_test_from_registration === 'undefined') {
        // Check for a global flag to prevent re-definition if this util is called multiple times by mistake in a single file context (though it shouldn't)
        // The primary definition should occur directly in the test file by calling this helper.

        let builder = new RenderTestBuilder();

        builder.withId(baseId)
            .withTitle(performanceTestConfig.title || defaultTitle) // Allow override for visual title too
            .withDescription(performanceTestConfig.description || defaultDescription) // Allow override for visual description too
            .runCanvasCode(drawFunction, ...(checkConfiguration && checkConfiguration.drawFunctionArgs ? checkConfiguration.drawFunctionArgs : []));

        // Apply checks based on checkConfiguration
        if (checkConfiguration) {
            if (checkConfiguration.extremes) {
                if (typeof checkConfiguration.extremes === 'object' && checkConfiguration.extremes.tolerance !== undefined) {
                    builder.withExtremesCheck(checkConfiguration.extremes.tolerance);
                } else {
                    builder.withExtremesCheck();
                }
            }
            if (checkConfiguration.uniqueColors) {
                const ucc = checkConfiguration.uniqueColors;
                if (ucc.middleRow) {
                    builder.withColorCheckMiddleRow({
                        expectedUniqueColors: ucc.middleRow.count,
                        tolerance: ucc.middleRow.tolerance,
                        checkInCenterThird: ucc.middleRow.inCenterThird !== undefined ? ucc.middleRow.inCenterThird : false
                    });
                }
                if (ucc.middleColumn) {
                    builder.withColorCheckMiddleColumn({
                        expectedUniqueColors: ucc.middleColumn.count,
                        tolerance: ucc.middleColumn.tolerance,
                        checkInCenterThird: ucc.middleColumn.inCenterThird !== undefined ? ucc.middleColumn.inCenterThird : false
                    });
                }
            }
            if (checkConfiguration.continuousStroke) {
                if (typeof checkConfiguration.continuousStroke === 'object' && checkConfiguration.continuousStroke.tolerance !== undefined) {
                    builder.withContinuousStrokeCheck(checkConfiguration.continuousStroke.tolerance);
                } else {
                    builder.withContinuousStrokeCheck();
                }
            }
            if (checkConfiguration.speckles) {
                 const sc = checkConfiguration.speckles;
                if (typeof sc === 'object') {
                    builder.withSpecklesCheckOnSwCanvas(sc.maxSpeckleSize, sc.tolerance);
                } else { // Assume boolean true
                    builder.withSpecklesCheckOnSwCanvas(); // Uses defaults
                }
            }
            if (checkConfiguration.compare) {
                const cc = checkConfiguration.compare;
                if (typeof cc === 'object') {
                    builder.compareWithThreshold(cc.swTol, cc.refTol, cc.diffTol);
                } else { // Assume boolean true for (0,0,0)
                    builder.compareWithThreshold(0, 0, 0);
                }
            }
             if (checkConfiguration.noOffscreenPixels) {
                builder.withNoOffscreenPixelsCheck();
            }
            if (checkConfiguration.noGapsInFillEdges) {
                builder.withNoGapsInFillEdgesCheck();
            }
            if (checkConfiguration.noGapsInStrokeEdges) {
                builder.withNoGapsInStrokeEdgesCheck();
            }
            if (checkConfiguration.totalUniqueColors) {
                if (typeof checkConfiguration.totalUniqueColors === 'number') {
                    builder.withUniqueColorsCheck(checkConfiguration.totalUniqueColors);
                } else if (typeof checkConfiguration.totalUniqueColors === 'object' && checkConfiguration.totalUniqueColors.count !== undefined) {
                    builder.withUniqueColorsCheck(checkConfiguration.totalUniqueColors.count);
                }
            }
            // Add more checks here as needed, e.g.,
            // if (checkConfiguration.noGapsInStrokeEdges) { builder.withNoGapsInStrokeEdgesCheck(); }
        }
        builder.build();
    }

    // --- 3. Register with Performance Test Registry ---
    if (typeof window !== 'undefined' && typeof window.PERFORMANCE_TESTS_REGISTRY !== 'undefined' && typeof drawFunction === 'function') {
        const perfId = (performanceTestConfig && performanceTestConfig.id) ? performanceTestConfig.id : baseId;
        const perfDisplayName = (performanceTestConfig && performanceTestConfig.displayName) ? performanceTestConfig.displayName : defaultPerfDisplayName;
        const perfDescription = (performanceTestConfig && performanceTestConfig.description) ? performanceTestConfig.description : `Performance test for ${category}: ${featureParts.join(', ')}.`;

        // Avoid duplicate registration if a test file somehow calls this multiple times or is loaded twice.
        // A more robust check would be to see if an object with this perfId already exists.
        const alreadyRegistered = window.PERFORMANCE_TESTS_REGISTRY.some(test => test.id === perfId);

        if (!alreadyRegistered) {
            window.PERFORMANCE_TESTS_REGISTRY.push({
                id: perfId,
                drawFunction: drawFunction,
                displayName: perfDisplayName,
                description: perfDescription,
                category: category
            });
        }
    }
} 