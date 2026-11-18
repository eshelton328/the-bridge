# web/public

Files Vite copies as they are to the root of the built app: what "Add to
Home Screen" needs so the app opens standalone, with no browser bars.

- `manifest.webmanifest`: the web app manifest, linked from
  `index.html`. `theme_color` and `background_color` copy the library's
  dark `bg.canvas` (a manifest cannot read CSS variables);
  `src/app/manifest.test.ts` fails when they drift from the token, or
  when an icon it names is missing or the wrong size.
- `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` and
  `icon-maskable-512.png`: the library's `Logo` on dark `bg.canvas`. The
  maskable one keeps the Logo inside the central 80% safe zone.

The PNGs are rendered with Playwright from the Logo's paths in the
library (`dist/components/parts/logo.js`). The repo keeps no generator for
them, because `scripts/` generators write only `*.gen.ts` files. After the
Logo or `bg.canvas` changes, render them again at the same sizes.
