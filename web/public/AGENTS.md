# web/public

Files Vite copies as they are to the root of the built app: the web app
manifest and the icons "Add to Home Screen" needs to open the app
standalone.

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
