# Very Simple JS 2D Software Renderer

## Description
A very simple 2D software renderer implemented in JavaScript. It uses basic rendering techniques for lines, rectangles, circles, and arcs. To keep it simple, it does not support anti-aliasing, which is OK for my needs, also it makes the generated render much more compressible in lossless mode (good for keeping around hundreds of reference test screenshots).

This software renderer uses direct pixel manipulation rather than a path-based approach, making it simpler but also more limited than standard Canvas implementations.

See [index page](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/) for link to browser tests/demos.

## Purpose
Providing a sw renderer for Fizzygum, which a) would allow pixel-identical renders across browsers and platforms b) could make it possible to use Fizzygum in headless mode e.g. in Node.

## Features
- Lines, rectangles, circles, and arcs (both stroke and fill, with transparency).
- Reasonably similar to an HTML5 Canvas render.

## Browser Tests & Examples
The project includes several browser-based tests and examples:

- [Low-level SW Renderer routines tests](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/tests/browser-tests/low-level-renderer-tests.html) - Tests low-level primitives like lines, rectangles, rounded rectangles, arcs and circles.
- [CrispSwCanvas tests](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/tests/browser-tests/crisp-sw-canvas-tests.html) - Side-by-side comparison between CrispSwCanvas and standard HTML5 Canvas.
- [CrispSwCanvas minimal example](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/examples/minimal-sw-canvas-example.html) - A minimal example of using CrispSwCanvas.
- [CrispSwCanvas code coverage tests](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/tests/browser-tests/code-coverage-tests.html) - Tests to ensure proper code coverage.
- [HTML5 Canvas Crispness examples](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/supporting-experiments/canvas-crispness-examples/canvas-crispness-tests.html) - Exploration of HTML5 Canvas rendering crispness.
- [Canvas Transform Effects on Strokes](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/supporting-experiments/canvas-transform-effects-on-strokes-demo.html) - Demonstrates transform effects on strokes.
- [Canvas Stroke as Clipping Test](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/supporting-experiments/canvas-stroke-as-clipping-demo.html) - Demonstrates clipping behavior in Canvas.

## Node.js Tests & Examples
The project also supports Node.js testing and usage:

- `examples/simple-node-example.js` - A minimal Node.js example that renders simple shapes and outputs a BMP file.
- Node.js test runner with several commands:
  - `node build/node-test-runner.js --list` - List available tests
  - `node build/node-test-runner.js --test` - Run all tests (one iteration each)
  - `node build/node-test-runner.js --id=<test-id> --iteration=<num>` - Run specific test iteration
  - `node build/node-test-runner.js -i <test-id> -r <start>-<end>` - Run test range

## Building
The project includes several build scripts:
- `sh build-scripts/build-browser.sh` - Build browser version
- `sh build-scripts/build-node.sh` - Build Node.js version
- `sh build-scripts/build-node-test-runner-simple-concat.sh` - Build Node test runner
- `sh run-all-scripts.sh` - Run all build scripts and examples

### Node - specific
1. For building, see section above.
2. Run the simple example: `node examples/simple-node-example.js`.
3. Or run tests: `node build/node-test-runner.js --test`.