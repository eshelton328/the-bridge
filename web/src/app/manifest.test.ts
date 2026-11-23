import '../index.css'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import indexHtml from '../../index.html?raw'

// The home-screen install (public/manifest.webmanifest and the Apple tags
// of index.html). A manifest cannot read CSS variables, so its colours are
// copies of the library's dark bg.canvas: these tests fail when the token
// changes and the copies do not, and when the manifest names a missing icon.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const manifest = z
  .object({
    theme_color: z.string(),
    background_color: z.string(),
    icons: z.array(z.object({ src: z.string(), sizes: z.string(), type: z.literal('image/png') })),
  })
  .parse(await (await fetch('/manifest.webmanifest')).json())

// The library's bg.canvas in dark mode, read from the CSS variable Panda
// generates for the token. "reads the token" fails if the name changes.
const canvasDark = getComputedStyle(document.documentElement).getPropertyValue('--colors-bg-canvas').trim()

const head = new DOMParser().parseFromString(indexHtml, 'text/html')
const attr = (selector: string, name: string) => head.querySelector(selector)?.getAttribute(name)

describe('the web app manifest', () => {
  it('reads the token', () => {
    expect(canvasDark).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('uses the dark bg.canvas token for its colours and index.html theme-color', () => {
    expect(manifest.theme_color).toBe(canvasDark)
    expect(manifest.background_color).toBe(canvasDark)
    expect(attr('meta[name="theme-color"]', 'content')).toBe(canvasDark)
  })

  it("keeps the theme-color's Light and Dark copies equal to bg.canvas in each mode", () => {
    const theme = head.querySelector('meta[name="theme-color"]')
    expect(theme?.getAttribute('data-dark')).toBe(canvasDark)
    document.documentElement.classList.remove('dark')
    try {
      const canvasLight = getComputedStyle(document.documentElement).getPropertyValue('--colors-bg-canvas').trim()
      expect(canvasLight).toMatch(/^#[0-9a-f]{6}$/)
      expect(theme?.getAttribute('data-light')).toBe(canvasLight)
    } finally {
      document.documentElement.classList.add('dark')
    }
  })

  it('matches the background the shell paints', () => {
    const painted = getComputedStyle(document.body).backgroundColor
    const hex = `#${[...painted.matchAll(/\d+/g)].map(([n]) => Number(n).toString(16).padStart(2, '0')).join('')}`
    expect(hex).toBe(canvasDark)
  })

  it('names icons that exist at their stated sizes', async () => {
    const icons = [...manifest.icons, { src: attr('link[rel="apple-touch-icon"]', 'href') ?? '', sizes: '180x180' }]
    for (const icon of icons) {
      const response = await fetch(icon.src)
      expect(response.headers.get('content-type'), icon.src).toBe('image/png')
      const bitmap = await createImageBitmap(await response.blob())
      expect(`${String(bitmap.width)}x${String(bitmap.height)}`, icon.src).toBe(icon.sizes)
    }
  })

  it('is linked from index.html', () => {
    expect(attr('link[rel="manifest"]', 'href')).toBe('/manifest.webmanifest')
  })
})
