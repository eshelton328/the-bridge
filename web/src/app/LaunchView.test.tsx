import '../index.css'
import { createElement, type ReactNode } from 'react'
import logoSource from '../../node_modules/@eshelton328/component-library-1701/dist/components/parts/logo.js?raw'
import { afterEach, describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { desktopMinWidth, tabletMinWidth } from '../lib/viewport.ts'
import { testRender, unmountRendered } from '../lib/testRender.ts'

// The launch view (index.html's #launch and its inline style) shows from the first paint, before any CSS file or
// script, so it copies the library's tokens as literal values. These tests load index.html with its scripts and the
// app's CSS taken out, as a cold start paints it, and compare each part with the library's own: the canvas, the
// Backdrop's stars and glow at each layout width, the Logo, the late line's style, and the breath's timing.
document.documentElement.dataset.pandaTheme = 'viewscreen'

/**
 * index.html as the browser has it before any script or CSS file: the color-mode and text-size scripts and the module
 * removed, and in light the `dark` class taken off <html> (its other classes stay).
 */
const bare = (dark: boolean) =>
  indexHtml
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<html lang="en" class="([^"]*)"/, (tag, classes: string) =>
      dark
        ? tag
        : `<html lang="en" class="${classes
            .split(' ')
            .filter((name) => name !== 'dark')
            .join(' ')}"`,
    )

const frames: HTMLIFrameElement[] = []

/** Loads the bare page in a frame `width` × 800 and returns its document. */
async function launchAt(width: number, dark = true): Promise<Document> {
  const frame = document.createElement('iframe')
  frame.width = String(width)
  frame.height = '800'
  frames.push(frame)
  const loaded = new Promise<void>((resolve) => {
    frame.addEventListener('load', () => {
      resolve()
    })
  })
  frame.srcdoc = bare(dark)
  document.body.append(frame)
  await loaded
  const doc = frame.contentDocument
  if (doc === null) throw new Error('no frame document')
  return doc
}

afterEach(async () => {
  for (const frame of frames.splice(0)) frame.remove()
  await unmountRendered()
  document.documentElement.classList.remove('dark')
})

/** The library's computed style of `node`, rendered in dark or light mode. */
async function libraryStyle(node: ReactNode, dark: boolean, pick: (el: Element) => Element = (el) => el) {
  document.documentElement.classList.toggle('dark', dark)
  const view = await testRender(<div data-testid="lib">{node}</div>)
  const el = document.querySelector('[data-testid="lib"] > *')
  if (el === null) throw new Error('nothing rendered')
  const style = getComputedStyle(pick(el))
  return { style, view }
}

/** The computed value of `property` on an element whose style sets it to `value`, such as a token's CSS variable. */
function computed(
  property:
    | 'color'
    | 'fontSize'
    | 'lineHeight'
    | 'fontFamily'
    | 'width'
    | 'marginTop'
    | 'transitionDuration'
    | 'transitionTimingFunction',
  value: string,
) {
  document.documentElement.classList.add('dark')
  const probe = document.createElement('p')
  probe.style[property] = value
  document.body.append(probe)
  const result = getComputedStyle(probe)[property]
  probe.remove()
  return result
}

const element = (doc: Document, selector: string) => {
  const el = doc.querySelector(selector)
  if (el === null) throw new Error(`no ${selector}`)
  return el
}

const sizes = [
  ['phone', tabletMinWidth - 1],
  ['tablet', tabletMinWidth],
  ['desktop', desktopMinWidth],
] as const

describe('the launch view (index.html)', () => {
  for (const dark of [true, false])
    for (const [size, width] of sizes)
      it(`paints the Backdrop's canvas, stars and glow at the ${size} width, ${dark ? 'dark' : 'light'}`, async () => {
        const doc = await launchAt(width, dark)
        const launch = getComputedStyle(element(doc, '#launch'))
        const { style } = await libraryStyle(
          createElement('div', { className: `backdrop backdrop--size_${size}` }, 'x'),
          dark,
        )
        expect(launch.backgroundColor).toBe(style.backgroundColor)
        expect(launch.backgroundImage).toBe(style.backgroundImage)
        // The page under it is the canvas too, never white.
        expect(getComputedStyle(doc.documentElement).backgroundColor).toBe(style.backgroundColor)
      })

  for (const dark of [true, false])
    it(`draws the library's Logo at 28 in the centre, ${dark ? 'dark' : 'light'}`, async () => {
      const doc = await launchAt(390, dark)
      const mark = element(doc, '#launch-mark')
      const markStyle = getComputedStyle(mark)
      const { style } = await libraryStyle(
        createElement(
          'svg',
          { className: 'logo__root logo__root--size_28', viewBox: '0 0 28 28' },
          createElement('path', { className: 'logo__spark' }),
        ),
        dark,
      )
      expect(markStyle.color).toBe(style.color)
      expect(markStyle.width).toBe(computed('width', 'var(--sizes-kind-tile-sm)'))
      expect(markStyle.height).toBe(computed('width', 'var(--sizes-kind-tile-sm)'))
      const box = mark.getBoundingClientRect()
      expect(box.left + box.width / 2).toBeCloseTo(390 / 2, 0)
      expect(box.top + box.height / 2).toBeCloseTo(800 / 2, 0)
      const spark = getComputedStyle(element(doc, '#launch-mark .spark'))
      const lib = await libraryStyle(
        createElement(
          'svg',
          { className: 'logo__root logo__root--size_28', viewBox: '0 0 28 28' },
          createElement('path', { className: 'logo__spark' }),
        ),
        dark,
        (el) => el.querySelector('path') ?? el,
      )
      expect(spark.fill).toBe(lib.style.fill)
      // The same paths as the library's Logo.
      const libraryPaths = [...logoSource.matchAll(/\bd: "([^"]+)"/g)].map((match) => match[1])
      expect([...mark.querySelectorAll('path')].map((p) => p.getAttribute('d'))).toEqual(libraryPaths)
    })

  it('sets the late line in fg.muted and bodySm, 16 under the mark, hidden for its first 8 s', async () => {
    const doc = await launchAt(390)
    const late = element(doc, '#launch-late')
    const lateStyle = getComputedStyle(late)
    expect(lateStyle.color).toBe(computed('color', 'var(--colors-fg-muted)'))
    expect(lateStyle.fontSize).toBe(computed('fontSize', 'var(--font-sizes-text-body-sm)'))
    expect(lateStyle.fontFamily).toBe(computed('fontFamily', 'var(--fonts-text-body-sm)'))
    const line = document.createElement('p')
    line.style.fontSize = 'var(--font-sizes-text-body-sm)'
    line.style.lineHeight = 'var(--line-heights-text-body-sm)'
    document.body.append(line)
    expect(lateStyle.lineHeight).toBe(getComputedStyle(line).lineHeight)
    line.remove()
    expect(lateStyle.visibility).toBe('hidden')
    expect(lateStyle.animationDelay).toBe('8s')
    const mark = element(doc, '#launch-mark').getBoundingClientRect()
    expect(`${String(late.getBoundingClientRect().top - mark.bottom)}px`).toBe(
      computed('marginTop', 'var(--spacing-16)'),
    )
  })

  it('breathes on duration.shimmer and easing.shimmer, and is still with reduced motion', async () => {
    const doc = await launchAt(390)
    const glow = getComputedStyle(element(doc, '#launch'), '::before')
    expect(glow.animationDuration).toBe(computed('transitionDuration', 'var(--durations-shimmer)'))
    expect(glow.animationTimingFunction).toBe(computed('transitionTimingFunction', 'var(--easings-shimmer)'))
    expect(indexHtml).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*#launch::before \{\s*animation: none;/)
  })

  it('fades out on duration.fade and easing.fade and takes no tap once it leaves; with reduced motion it goes at once', async () => {
    const doc = await launchAt(390)
    const launch = element(doc, '#launch')
    expect(getComputedStyle(launch).pointerEvents).toBe('auto')
    launch.setAttribute('data-leaving', '')
    const leaving = getComputedStyle(launch)
    expect(leaving.pointerEvents).toBe('none')
    expect(leaving.transitionProperty).toBe('opacity')
    expect(leaving.transitionDuration).toBe(computed('transitionDuration', 'var(--durations-fade)'))
    expect(leaving.transitionTimingFunction).toBe(computed('transitionTimingFunction', 'var(--easings-fade)'))
    expect(indexHtml).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*#launch\[data-leaving\] \{\s*transition: none;/,
    )
  })

  it('needs no request: no link or script in the launch view', () => {
    const doc = new DOMParser().parseFromString(indexHtml, 'text/html')
    const launch = doc.getElementById('launch')
    expect(launch?.querySelectorAll('img, link, script, image, use').length).toBe(0)
  })

  it('hides only the mark from screen readers; the late line is a status they read', () => {
    const doc = new DOMParser().parseFromString(indexHtml, 'text/html')
    expect(doc.getElementById('launch-mark')?.getAttribute('aria-hidden')).toBe('true')
    const late = doc.getElementById('launch-late')
    expect(late?.getAttribute('role')).toBe('status')
    expect(late?.closest('[aria-hidden="true"]')).toBeNull()
  })
})
