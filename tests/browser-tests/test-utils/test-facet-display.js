// Test facet display integration
// Extends RenderTest.createNavigation to show parsed test parameters

(function() {
  // Initialize parser
  const testNameParser = new TestNameParser();
  
  // Store original createNavigation to extend it
  const originalCreateNavigation = RenderTest.createNavigation;
  
  // Override createNavigation to add facet parsing
  RenderTest.createNavigation = function(title) {
    // Call original method
    const result = originalCreateNavigation.call(this, title);
    
    // Add facet information to each test
    Object.values(RenderTest.registry).forEach(test => {
      // Try different ID formats
      const possibleIds = [
        `test-${test.id}`,
        `test-${test.id.replace('.js', '')}`,
        test.id,
        test.id.replace('.js', '')
      ];
      
      let testElement = null;
      
      for (const id of possibleIds) {
        testElement = document.getElementById(id);
        if (testElement) {
          break;
        }
      }
      
      if (testElement && test.id) {
        // Find the description element 
        const descElement = testElement.querySelector('.test-description');
        
        if (descElement) {
          // Parse the test filename and add facet information
          const filename = test.id; // Use test.id directly since it already includes .js
          const facets = testNameParser.parseTestName(filename);
          const facetHtml = testNameParser.formatFacets(facets);
          descElement.insertAdjacentHTML('afterend', facetHtml);
        }
      }
    });
    
    return result;
  };
})(); 