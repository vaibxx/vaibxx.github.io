# vaibxx.github.io

My portfolio: an immersive 3D site where you fly through a tunnel of my projects.

**Live:** https://vaibxx.github.io

- Scroll, swipe or use the arrow keys (↑/↓) to warp between projects; drag or use ←/→ to explore each one.
- Press `I` for the project index.
- If it runs slowly, use the **Quality** switch in the top-right corner.

Built with Three.js (custom GLSL shaders, bloom and chromatic post-processing) and GSAP. No build step: plain HTML, CSS and JavaScript.

All content lives in [`content.js`](content.js).

## Run locally

```sh
python -m http.server 5173
```

Then open http://localhost:5173.
