# Very Simple JS 2D Software Renderer

## Description
A very simple 2D software renderer implemented in JavaScript. It uses basic rendering techniques for lines, rectangles, circles, and arcs. To keep it simple, it does not support anti-aliasing, which is OK for my needs, also it makes the generated render much more compressible in lossless mode (good for keeping around hundreds of reference test screenshots).

The [demo](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/) compares the sw. render vs. HTML5 Canvas render.

## Purpose
Providing a sw renderer for Fizzygum, which a) would allow pixel-identical renders across browsers and plarforms b) could make it possible to use Fizzygum in headless mode e.g. in Node.

## Features
- Lines, rectangles, circles, and arcs (both stroke and fill, with transparency)
- Reasonably similar to _a_ canvas render (the one on my browser/machine at least i.e. Chrome on mac in Nov 2024) - the [demo](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/) shows comparison of render with Canvas rendering (use button to flip between them).

## Demo
[here](https://davidedc.github.io/Minimal-2D-Js-Software-Renderer/).

## Usage
Just Open `index.html` in your web browser. Click "New random example shapes" to generate and draw new random shapes. Click "Flip canvas / sw-renderer" to toggle between software-rendered and Canvas-rendered images.