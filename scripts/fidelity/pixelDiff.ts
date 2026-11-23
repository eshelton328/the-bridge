// The pixel comparison of a PNG reference (d-119): how many pixels of the
// render differ from the reference picture, and a picture of where. It is a
// measure for the reviewer, not a gate: a lab screenshot and a built page
// differ in fonts and the backdrop's stars, so no ratio would mean "right".
import { readFileSync, writeFileSync } from 'node:fs'
import type { Page } from 'playwright'

/** The largest channel difference (0–255) at which a pixel still counts as the same. */
export const pixelThreshold = 32

export type PixelDiff = {
  /** Pixels compared: the frame's width × height. */
  total: number
  /** Pixels whose red, green, blue or alpha differs by more than `threshold`. */
  different: number
  /** different / total, rounded to 4 decimals. */
  ratio: number
  threshold: number
}

/**
 * Counts the pixels of RGBA arrays `a` and `b` (same length) that differ by
 * more than `threshold` in any channel, and paints `out` (same length): a
 * different pixel red, any other a faint grey of `a`. It runs in the browser
 * too (`comparePngs`), so it uses nothing from its module scope.
 */
export function diffPixels(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  out: { [i: number]: number; length: number },
  threshold: number,
): number {
  if (a.length !== b.length || a.length !== out.length || a.length % 4 !== 0)
    throw new Error(`diffPixels needs RGBA arrays of one length; got ${String(a.length)}, ${String(b.length)}`)
  let different = 0
  for (let i = 0; i < a.length; i += 4) {
    let most = 0
    for (let c = 0; c < 4; c++) most = Math.max(most, Math.abs((a[i + c] ?? 0) - (b[i + c] ?? 0)))
    if (most > threshold) {
      different++
      out[i] = 255
      out[i + 1] = 0
      out[i + 2] = 0
    } else {
      const grey = 255 - Math.round((255 - ((a[i] ?? 0) + (a[i + 1] ?? 0) + (a[i + 2] ?? 0)) / 3) / 4)
      out[i] = grey
      out[i + 1] = grey
      out[i + 2] = grey
    }
    out[i + 3] = 255
  }
  return different
}

/**
 * Compares the PNG files `reference` and `render`, both `w` × `h`, in a new
 * page of the story tab's browser context, and writes the diff picture to
 * `out`. Throws when either picture has another size.
 */
export async function comparePngs(
  storyTab: Page,
  reference: string,
  render: string,
  out: string,
  w: number,
  h: number,
): Promise<PixelDiff> {
  const src = (f: string) => `data:image/png;base64,${readFileSync(f).toString('base64')}`
  const tab = await storyTab.context().newPage()
  try {
    const script = `(async ({ a, b, w, h, threshold }) => {
      const diffPixels = ${diffPixels.toString()}
      const load = async (src) => {
        const img = new Image()
        img.src = src
        await img.decode()
        if (img.naturalWidth !== w || img.naturalHeight !== h)
          throw new Error('a picture is ' + img.naturalWidth + ' x ' + img.naturalHeight + ', not ' + w + ' x ' + h)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        return ctx.getImageData(0, 0, w, h).data
      }
      const pa = await load(a)
      const pb = await load(b)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      const image = ctx.createImageData(w, h)
      const different = diffPixels(pa, pb, image.data, threshold)
      ctx.putImageData(image, 0, 0)
      return { different, png: canvas.toDataURL('image/png').split(',')[1] }
    })(${JSON.stringify({ a: src(reference), b: src(render), w, h, threshold: pixelThreshold })})`
    const result = await tab.evaluate<{ different: number; png: string }>(script)
    writeFileSync(out, Buffer.from(result.png, 'base64'))
    const total = w * h
    return {
      total,
      different: result.different,
      ratio: Math.round((result.different / total) * 10_000) / 10_000,
      threshold: pixelThreshold,
    }
  } finally {
    await tab.close()
  }
}
