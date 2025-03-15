#\!/bin/bash
# Run all build scripts and examples

rm build/*.js

# Build scripts
echo "Running build-browser.sh..."
sh build-scripts/build-browser.sh

echo "Running build-node.sh..."
sh build-scripts/build-node.sh

echo "Running build-node-test-runner-simple-concat.sh..."
sh build-scripts/build-node-test-runner-simple-concat.sh

# Run examples
echo "Running simple-node-example.js..."
node examples/simple-node-example.js

echo "Running node-test-runner.js with --test option..."
node build/node-test-runner.js --test

echo "Running node-test-runner.js with -i centered-rounded-rect -r 1-11 option..."
node build/node-test-runner.js -i centered-rounded-rect -r 1-11
