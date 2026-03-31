# pretext-flow-demo

An interactive demo built with [`@chenglou/pretext`](https://github.com/chenglou/pretext) showcasing the `layoutNextLine` API.

Text reflows in real time around a freely draggable, resizable GIF. Each line of text receives a different `maxWidth` depending on whether it overlaps the GIF's bounding box — no DOM measurements (`getBoundingClientRect`, `offsetHeight`) involved.

## Features

- Drag the GIF anywhere in the article canvas
- Drag the right edge of the GIF to resize it
- Text reflows around the GIF on every frame using `layoutNextLine()`

## Getting started

```bash
cd demo
npm install
npm start
```

Then open http://localhost:5173.

## How it works

`prepareWithSegments()` is called once on load to segment and measure the text. On every interaction tick, a `layoutNextLine()` loop walks the paragraph line by line. For each line, it checks whether the current `y` position overlaps the GIF vertically — if so, it passes a reduced `maxWidth` and adjusted `x` offset for that line; otherwise it uses the full container width.

## Stack

- Vanilla JavaScript (no framework)
- [Vite](https://vitejs.dev) dev server
- [@chenglou/pretext](https://www.npmjs.com/package/@chenglou/pretext)
