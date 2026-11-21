# web/public

Files Vite copies as they are to the root of the built app: the web app
manifest and the icons "Add to Home Screen" needs to open the app
standalone, and the service worker.

- `sw.js` is the service worker of Web Push (d-118), plain JavaScript that
  Vite does not build. It shows a push as a notification and opens the
  chat on a tap; it has no fetch handler and no cache. Change the version
  number in its first line with each change. A push of another shape shows
  nothing, and a tap's URL comes only from the worker's origin and the
  chat ID, never from the push. `src/app/push/sw.test.ts` tests each
  event; read `src/app/push/AGENTS.md` before you change it.
- The manifest's `theme_color` and `background_color` copy the library's
  dark `bg.canvas`, as a manifest cannot read CSS variables.
  `src/app/manifest.test.ts` fails when they drift from the token, or
  when an icon the manifest names is missing or the wrong size.
- The PNG icons are the library's `Logo` on dark `bg.canvas`, rendered
  with Playwright from the Logo's paths in the library
  (`dist/components/parts/logo.js`). The maskable icon keeps the Logo
  inside the central 80% safe zone.
- The repo keeps no generator for the icons, because `scripts/`
  generators write only `*.gen.ts` files. After the Logo or `bg.canvas`
  changes, render them again at the same sizes.
