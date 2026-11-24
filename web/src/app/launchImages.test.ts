import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'

// The iOS startup images (index.html's apple-touch-startup-image links, public/launch/): each is a render of the
// launch view at its device's size, so iOS's frame and the page's first frame match. In the Home Screen app the page
// starts under the status bar (data-status-bar, in pt), so each image has bg.canvas in that band and the view under it.
// Each link names a file at the pixel size its media query asks for, and the mark sits where the view's inline CSS
// puts it: 28 px at the centre of the area under the status bar.
const head = new DOMParser().parseFromString(indexHtml, 'text/html')
const links = [...head.querySelectorAll('link[rel="apple-touch-startup-image"]')]

const query =
  /^screen and \(device-width: (\d+)px\) and \(device-height: (\d+)px\) and \(-webkit-device-pixel-ratio: (\d)\) and \(orientation: (portrait|landscape)\)$/

// fg.accent (the Logo's bridge) and bg.canvas, dark: the images are dark only, as the page's default mode is Dark
// (app/LaunchView.test.tsx holds the inline copies to the tokens).
const accent = [0x5e, 0xe1, 0xff] as const
const canvas = [0x07, 0x0b, 0x14] as const
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
  it("covers the owner's iPhone and iPad (both orientations)", () => {
    const media = links.map((link) => link.getAttribute('media') ?? '')
    for (const [device, orientations] of [
      ['(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)', ['portrait']],
      [
        '(device-width: 756px) and (device-height: 1158px) and (-webkit-device-pixel-ratio: 2)',
        ['portrait', 'landscape'],
      ],
    ] as const)
      for (const orientation of orientations)
        expect(media.some((m) => m.includes(device) && m.includes(orientation))).toBe(true)
  })

  for (const link of links) {
    const href = link.getAttribute('href') ?? ''
    it(`${href} matches its media query and has the mark at the view's place`, async () => {
      const match = query.exec(link.getAttribute('media') ?? '')
      expect(match).not.toBeNull()
      if (match === null) return
      const [, w, h, d, orientation] = match
      const ratio = Number(d)
      const bar = Number(link.getAttribute('data-status-bar'))
      expect(bar).toBeGreaterThan(0)
      const [width, height] = orientation === 'portrait' ? [Number(w), Number(h)] : [Number(h), Number(w)]
      const image = await pixels(href)
      expect([image.width, image.height]).toEqual([width * ratio, height * ratio])
      // The status bar band is bg.canvas.
      for (const x of [0, Math.floor(image.width / 2), image.width - 1]) {
        const i = (Math.floor((bar * ratio) / 2) * image.width + x) * 4
        const band = [image.data[i] ?? 0, image.data[i + 1] ?? 0, image.data[i + 2] ?? 0]
        expect(band.reduce((sum, v, k) => sum + Math.abs(v - (canvas[k] ?? 0)), 0)).toBeLessThanOrEqual(6)
      }
      // The box of the bridge's accent pixels lies in the 28 px mark box at the centre under the band, centred on it.
      const [r, g, b] = accent
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
      const cy = ((height + bar) / 2) * ratio
      expect(left).toBeGreaterThanOrEqual(cx - half)
      expect(right).toBeLessThanOrEqual(cx + half)
      expect(top).toBeGreaterThanOrEqual(cy - half)
      expect(bottom).toBeLessThanOrEqual(cy + half)
      expect(Math.abs((left + right) / 2 - cx)).toBeLessThanOrEqual(ratio * 1.5)
    })
  }
})
