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
- `launch/` holds the iOS startup images that `index.html`'s
  `apple-touch-startup-image` links name, one per device, orientation and
  colour mode. Each is a render of index.html's launch view (`#launch`),
  so iOS's launch frame and the page's first frame show the mark at the
  same size and place. They are JPEG at quality 90: the Backdrop's glow
  takes about 0.5 to 1.7 MB as PNG and 20 to 40 kB as JPEG.
  `src/app/launchImages.test.ts` fails when a file is not the size its
  media query asks for, or the mark is not in the view's 28 px box at the
  centre. After a change to the launch view, its tokens or the device
  list, render them all again with Playwright's Chromium from `web/`:
  `node render.mjs index.html public/launch`, with `render.mjs` (outside
  the repo) as below, then run the test.

  ```js
  import { chromium } from 'playwright'
  import { readFileSync, mkdirSync } from 'node:fs'
  const [html, out] = process.argv.slice(2)
  const src = readFileSync(html, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')
  const devices = [/* each [width, height, ratio] of index.html's links */]
  mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  for (const [w, h, dpr] of devices)
    for (const orient of w >= 744 ? ['portrait', 'landscape'] : ['portrait'])
      for (const mode of ['dark', 'light']) {
        const [vw, vh] = orient === 'portrait' ? [w, h] : [h, w]
        const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, reducedMotion: 'reduce', colorScheme: mode })
        await page.setContent(mode === 'dark' ? src : src.replace('<html lang="en" class="dark"', '<html lang="en"'))
        await page.screenshot({ type: 'jpeg', quality: 90, path: `${out}/${w}x${h}@${dpr}x-${orient}-${mode}.jpg` })
        await page.close()
      }
  await browser.close()
  ```

## Folders

- [launch/AGENTS.md](launch/AGENTS.md): read before you change a startup image.
