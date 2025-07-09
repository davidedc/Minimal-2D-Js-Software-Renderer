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
          const parseResult = testNameParser.parseTestName(filename);
          
          // Display parsing errors if any
          if (parseResult.errors && parseResult.errors.length > 0) {
            const errorHtml = `<div style="margin-top: 10px; padding: 8px; background-color: #ffebee; border-left: 4px solid #f44336; font-size: 12px; color: #c62828;">
              <strong>Filename Parsing Errors:</strong><br>
              ${parseResult.errors.map(error => `• ${error}`).join('<br>')}
            </div>`;
            descElement.insertAdjacentHTML('afterend', errorHtml);
          }
          
          const facetHtml = testNameParser.formatFacets(parseResult);
          descElement.insertAdjacentHTML('afterend', facetHtml);
        }
      }
    });
    
    return result;
  };
})(); 