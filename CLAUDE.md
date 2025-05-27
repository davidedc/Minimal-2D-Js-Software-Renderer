# MINIMAL-2D-JS-SOFTWARE-RENDERER GUIDELINES

## Build Commands
- `sh build-scripts/build-browser.sh` - Build browser version
- `sh build-scripts/build-node.sh` - Build Node.js version
- `sh build-scripts/build-node-high-level-test-runner-simple-concat.sh` - Build test runner
- `sh run-all-scripts.sh` - Run all build scripts and examples

## Test Commands
- `node build/node-high-level-test-runner.js --list` - List available tests
- `node build/node-high-level-test-runner.js --test` - Run all tests (one iteration each)
- `node build/node-high-level-test-runner.js --id=<test-id> --iteration=<num>` - Run specific test iteration
- `node build/node-high-level-test-runner.js -i <test-id> -r <start>-<end>` - Run test range

## Code Style
- **Naming**: camelCase for methods/variables, PascalCase for classes
- **Organization**: Class-based with clear separation of concerns
- **Comments**: Brief overview comments for class/function purposes
- **Error Handling**: Use try/catch blocks with descriptive error messages
- **Code Structure**: Keep renderers in separate modules
- **Classes**: Follow object-oriented patterns with clear responsibilities
- **Files**: Group related functionality in single files, not too large
- **Modularity**: Prefer small, focused components with single responsibility