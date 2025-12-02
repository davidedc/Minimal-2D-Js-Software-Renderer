#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Collects meaningful function definitions from high-level test files
 * Located in tests/browser-tests/test-cases/
 */

const TEST_CASES_DIR = 'tests/browser-tests/test-cases';

// List of keywords that are not function names
const FALSE_POSITIVES = new Set([
    'if', 'else', 'for', 'while', 'switch', 'catch', 'try', 
    'do', 'return', 'throw', 'break', 'continue', 'var', 
    'let', 'const', 'function', 'class', 'import', 'export'
]);

// Function to extract meaningful function definitions from JavaScript code
function extractFunctionDefinitions(fileContent, fileName) {
    const functions = [];
    
    // More precise regex patterns
    const patterns = [
        // Function declarations: function functionName(...) { ... }
        {
            regex: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
            type: 'function declaration'
        },
        
        // Arrow functions assigned to variables: const funcName = (...) => { ... }
        {
            regex: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/g,
            type: 'arrow function'
        },
        
        // Arrow functions with single param: const funcName = param => { ... }
        {
            regex: /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*=>/g,
            type: 'arrow function (single param)'
        }
    ];
    
    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(fileContent)) !== null) {
            const functionName = match[1];
            
            // Skip false positives
            if (FALSE_POSITIVES.has(functionName)) {
                continue;
            }
            
            // Skip very short names that are likely false positives
            if (functionName.length < 2) {
                continue;
            }
            
            // Extract context around the function
            const startIndex = match.index;
            const linesBefore = fileContent.substring(0, startIndex).split('\n');
            const lineNumber = linesBefore.length;
            
            // Get a meaningful context snippet
            const contextStart = Math.max(0, startIndex - 150);
            const contextEnd = Math.min(fileContent.length, startIndex + 300);
            const context = fileContent.substring(contextStart, contextEnd);
            
            functions.push({
                name: functionName,
                type: pattern.type,
                file: fileName,
                line: lineNumber,
                context: context.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
            });
        }
    });
    
    return functions;
}

// Function to extract registerHighLevelTest calls
function extractTestRegistrations(fileContent, fileName) {
    const registrations = [];
    const pattern = /registerHighLevelTest\s*\(\s*['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = pattern.exec(fileContent)) !== null) {
        const testId = match[1];
        const startIndex = match.index;
        const linesBefore = fileContent.substring(0, startIndex).split('\n');
        const lineNumber = linesBefore.length;
        
        registrations.push({
            testId: testId,
            file: fileName,
            line: lineNumber
        });
    }
    
    return registrations;
}

// Function to analyze function patterns
function analyzeFunctionPatterns(allFunctions) {
    const patterns = {
        drawTest: allFunctions.filter(f => f.name === 'drawTest'),
        helpers: allFunctions.filter(f => f.name.startsWith('_')),
        utilities: allFunctions.filter(f => f.name.startsWith('get') || f.name.includes('Random')),
        calculators: allFunctions.filter(f => f.name.includes('calculate') || f.name.includes('Calculate')),
        others: allFunctions.filter(f => 
            f.name !== 'drawTest' && 
            !f.name.startsWith('_') && 
            !f.name.startsWith('get') && 
            !f.name.includes('Random') &&
            !f.name.includes('calculate') &&
            !f.name.includes('Calculate')
        )
    };
    
    return patterns;
}

function main() {
    console.log('Collecting meaningful function definitions from high-level test files...\n');
    
    if (!fs.existsSync(TEST_CASES_DIR)) {
        console.error(`Error: Directory ${TEST_CASES_DIR} does not exist`);
        process.exit(1);
    }
    
    const testFiles = fs.readdirSync(TEST_CASES_DIR)
        .filter(file => file.endsWith('-test.js'))
        .sort();
    
    console.log(`Found ${testFiles.length} test files\n`);
    
    const allFunctions = [];
    const allRegistrations = [];
    const functionsByFile = {};
    
    testFiles.forEach(fileName => {
        const filePath = path.join(TEST_CASES_DIR, fileName);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Extract function definitions
        const functions = extractFunctionDefinitions(fileContent, fileName);
        functions.forEach(func => allFunctions.push(func));
        functionsByFile[fileName] = functions;
        
        // Extract test registrations
        const registrations = extractTestRegistrations(fileContent, fileName);
        registrations.forEach(reg => allRegistrations.push(reg));
    });
    
    // Analyze patterns
    const patterns = analyzeFunctionPatterns(allFunctions);
    const uniqueFunctionNames = [...new Set(allFunctions.map(f => f.name))].sort();
    
    // Summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total test files processed: ${testFiles.length}`);
    console.log(`Total meaningful function definitions found: ${allFunctions.length}`);
    console.log(`Unique function names: ${uniqueFunctionNames.length}`);
    console.log(`Total test registrations: ${allRegistrations.length}`);
    
    // Function categories
    console.log('\n' + '-'.repeat(50));
    console.log('FUNCTION CATEGORIES:');
    console.log('-'.repeat(50));
    console.log(`Main drawing functions (drawTest): ${patterns.drawTest.length}`);
    console.log(`Helper functions (starting with _): ${patterns.helpers.length}`);
    console.log(`Utility functions (get*, *Random*): ${patterns.utilities.length}`);
    console.log(`Calculator functions (*calculate*): ${patterns.calculators.length}`);
    console.log(`Other functions: ${patterns.others.length}`);
    
    // Unique function names by category
    console.log('\n' + '-'.repeat(50));
    console.log('UNIQUE FUNCTION NAMES BY CATEGORY:');
    console.log('-'.repeat(50));
    
    console.log('\n📝 Main Drawing Functions:');
    const uniqueDrawTest = [...new Set(patterns.drawTest.map(f => f.name))];
    uniqueDrawTest.forEach(name => {
        const count = patterns.drawTest.filter(f => f.name === name).length;
        console.log(`  ${name} (${count} instances)`);
    });
    
    console.log('\n🔧 Helper Functions:');
    const uniqueHelpers = [...new Set(patterns.helpers.map(f => f.name))];
    uniqueHelpers.forEach(name => {
        const count = patterns.helpers.filter(f => f.name === name).length;
        console.log(`  ${name} (${count} instances)`);
    });
    
    console.log('\n⚙️ Utility Functions:');
    const uniqueUtilities = [...new Set(patterns.utilities.map(f => f.name))];
    uniqueUtilities.forEach(name => {
        const count = patterns.utilities.filter(f => f.name === name).length;
        console.log(`  ${name} (${count} instances)`);
    });
    
    console.log('\n🧮 Calculator Functions:');
    const uniqueCalculators = [...new Set(patterns.calculators.map(f => f.name))];
    uniqueCalculators.forEach(name => {
        const count = patterns.calculators.filter(f => f.name === name).length;
        console.log(`  ${name} (${count} instances)`);
    });
    
    console.log('\n🔹 Other Functions:');
    const uniqueOthers = [...new Set(patterns.others.map(f => f.name))];
    uniqueOthers.forEach(name => {
        const count = patterns.others.filter(f => f.name === name).length;
        console.log(`  ${name} (${count} instances)`);
    });
    
    // Files with most functions
    console.log('\n' + '-'.repeat(50));
    console.log('FILES WITH MOST FUNCTION DEFINITIONS:');
    console.log('-'.repeat(50));
    const fileStats = Object.entries(functionsByFile)
        .map(([file, funcs]) => ({ file, count: funcs.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    fileStats.forEach(stat => {
        console.log(`  ${stat.file}: ${stat.count} functions`);
    });
    
    // Function types breakdown
    console.log('\n' + '-'.repeat(50));
    console.log('FUNCTION DEFINITION TYPES:');
    console.log('-'.repeat(50));
    const typeStats = {};
    allFunctions.forEach(func => {
        typeStats[func.type] = (typeStats[func.type] || 0) + 1;
    });
    Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });
    

    
    // Write detailed results to file
    const outputData = {
        summary: {
            totalFiles: testFiles.length,
            totalFunctions: allFunctions.length,
            uniqueFunctionNames: uniqueFunctionNames.length,
            totalRegistrations: allRegistrations.length
        },
        functionPatterns: {
            drawTest: patterns.drawTest.length,
            helpers: patterns.helpers.length,
            utilities: patterns.utilities.length,
            calculators: patterns.calculators.length,
            others: patterns.others.length
        },
        functions: allFunctions,
        registrations: allRegistrations,
        uniqueFunctionNames: uniqueFunctionNames,
        functionsByFile: functionsByFile
    };
    
    const outputFile = 'test-functions-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));
    console.log(`\nDetailed results written to: ${outputFile}`);
}

if (require.main === module) {
    main();
} 