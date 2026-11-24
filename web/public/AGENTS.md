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
  `apple-touch-startup-image` links name, one per device and orientation.
  Each is a render of index.html's launch view (`#launch`), so iOS's
  launch frame and the page's first frame show the mark at the same size
  and place. In the Home Screen app the page starts under the status bar,
  so each image has dark `bg.canvas` in the link's `data-status-bar`
  band (pt) and the view under it. The images are dark only: the page
  follows the saved colour mode (Dark by default), which a media query
  cannot read. They are JPEG at quality 90: the Backdrop's glow takes
  about 0.5 to 1.7 MB as PNG and 20 to 40 kB as JPEG.
  `src/app/launchImages.test.ts` fails when a file is not the size its
  media query asks for, the band is not `bg.canvas`, or the mark is not
  in the view's 28 px box at the centre under the band. After a change to
  the launch view, its tokens or the device list, render them all again
  with Playwright's Chromium from `web/`:
  `node render.mjs index.html public/launch`, with `render.mjs` (outside
  the repo) as below. It reads the devices from the links and writes
  one image for each; delete the images no link names. Then run the test.

  ```js
  import { chromium } from 'playwright'
  import { readFileSync, mkdirSync } from 'node:fs'
  const [html, out] = process.argv.slice(2)
  const src = readFileSync(html, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')
  const devices = [...src.matchAll(/href="\/launch\/(\d+)x(\d+)@(\d)x-(portrait|landscape)\.jpg" data-status-bar="(\d+)"/g)].map((m) => m.slice(1))
  mkdirSync(out, { recursive: true })
  const canvas = /--launch-canvas:\s*(#[0-9a-f]+)/.exec(src.slice(src.indexOf('html.dark')))[1]
  const browser = await chromium.launch()
  for (const [w, h, dpr, orient, bar] of devices) {
    const [vw, vh] = orient === 'portrait' ? [+w, +h] : [+h, +w]
    const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: +dpr, reducedMotion: 'reduce', colorScheme: 'dark' })
    await page.setContent('<body style="margin:0;background:' + canvas + '"><iframe style="position:fixed;left:0;top:' + bar + 'px;width:' + vw + 'px;height:' + (vh - bar) + 'px;border:0"></iframe></body>')
    await page.$eval('iframe', (f, s) => new Promise((r) => { f.onload = r; f.srcdoc = s }), src)
    await page.screenshot({ type: 'jpeg', quality: 90, path: out + '/' + w + 'x' + h + '@' + dpr + 'x-' + orient + '.jpg' })
    await page.close()
  }
  await browser.close()
  console.log(devices.length, canvas)
  ```

## Folders

- [launch/AGENTS.md](launch/AGENTS.md): read before you change a startup image.
