import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'

// The iOS startup images (index.html's apple-touch-startup-image links, public/launch/): each is a render of the
// launch view at its device's size, so iOS's frame and the page's first frame match. Each link names a file at the
// pixel size its media query asks for, and the mark sits where the view's inline CSS puts it: 28 px at the centre.
const head = new DOMParser().parseFromString(indexHtml, 'text/html')
const links = [...head.querySelectorAll('link[rel="apple-touch-startup-image"]')]

const query =
  /^screen and \(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\) and \(orientation: (portrait|landscape)\) and \(prefers-color-scheme: (dark|light)\)$/

// fg.accent, the Logo's bridge, in each mode (app/LaunchView.test.tsx holds the inline copies to the token).
const accent = { dark: [0x5e, 0xe1, 0xff], light: [0x0e, 0x6a, 0x85] } as const
const mark = 28

async function pixels(src: string) {
  const image = new Image()
  image.src = src
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')
  if (context === null) throw new Error('no canvas')
  context.drawImage(image, 0, 0)
  return {
    width: canvas.width,
    height: canvas.height,
    data: context.getImageData(0, 0, canvas.width, canvas.height).data,
  }
}

describe('the iOS startup images', () => {
  it("covers the owner's iPhone and iPad in both modes", () => {
    const media = links.map((link) => link.getAttribute('media') ?? '')
    for (const device of [
      '(device-width: 390px) and (device-height: 844px)',
      '(device-width: 744px) and (device-height: 1133px)',
    ])
      for (const mode of ['dark', 'light']) expect(media.some((m) => m.includes(device) && m.includes(mode))).toBe(true)
  })

  for (const link of links) {
    const href = link.getAttribute('href') ?? ''
    it(`${href} matches its media query and has the mark at the view's place`, async () => {
      const match = query.exec(link.getAttribute('media') ?? '')
      expect(match).not.toBeNull()
      if (match === null) return
      const [, w, h, d, orientation, mode] = match
      const ratio = Number(d)
      const [width, height] = orientation === 'portrait' ? [Number(w), Number(h)] : [Number(h), Number(w)]
      const image = await pixels(href)
      expect([image.width, image.height]).toEqual([width * ratio, height * ratio])
      // The box of the bridge's accent pixels lies in the 28 px mark box at the centre, centred on it.
      const [r, g, b] = mode === 'dark' ? accent.dark : accent.light
      let left = Infinity
      let right = -Infinity
      let top = Infinity
      let bottom = -Infinity
      for (let y = 0; y < image.height; y++)
        for (let x = 0; x < image.width; x++) {
          const i = (y * image.width + x) * 4
          const near =
            Math.abs((image.data[i] ?? 0) - r) +
            Math.abs((image.data[i + 1] ?? 0) - g) +
            Math.abs((image.data[i + 2] ?? 0) - b)
          if (near < 40) {
            left = Math.min(left, x)
            right = Math.max(right, x)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y)
          }
        }
      const half = (mark * ratio) / 2
      const cx = image.width / 2
      const cy = image.height / 2
      expect(left).toBeGreaterThanOrEqual(cx - half)
      expect(right).toBeLessThanOrEqual(cx + half)
      expect(top).toBeGreaterThanOrEqual(cy - half)
      expect(bottom).toBeLessThanOrEqual(cy + half)
      expect(Math.abs((left + right) / 2 - cx)).toBeLessThanOrEqual(ratio * 1.5)
    })
  }
})
