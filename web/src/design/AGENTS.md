# design

The canvas bundle (d-089): `vite.canvas.config.ts` builds
`canvasEntry.ts` into `dist-canvas/bridge.js`, which sets
`window.Bridge`.

```js
window.Bridge.mount(element, 'inbox/nextStep', 'D1')
```

- `registry.gen.ts` holds one board per state file; run
  `pnpm gen:registry` after you add or remove a state.
- `states.test.ts` checks every board's state against its Zod schema.
- Chrome only the canvas needs (phone frame, keyboard, status bar) goes
  here; the app never imports this folder (`web/src/structure.ts`).
