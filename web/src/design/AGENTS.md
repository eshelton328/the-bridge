# design

The canvas bundle (d-089): `vite.canvas.config.ts` builds
`canvasEntry.ts` into `dist-canvas/bridge.js`, which sets
`window.Bridge`.

```js
window.Bridge.mount(element, 'inbox/nextStep', 'D1')
```

- `registry.gen.ts`: every board, one per state file, written by
  `pnpm gen:registry`. Never edit it.
- `states.test.ts`: every board's state passes its Zod schema.
- Chrome only the canvas needs (phone frame, keyboard, status bar) goes
  here; the app never imports this folder.
