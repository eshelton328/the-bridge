#!/usr/bin/env node
// pnpm keyboard:served: the keyboard check of screen review R20 to R22 on the served app. It opens the Workspaces
// chat and the Inbox chat in Playwright's WebKit as an installed iPhone app, takes the composer's focus with a tap,
// opens and closes a fake keyboard (window.visualViewport shrinks and grows on the library's keyboard curve, as iOS
// Safari's does, like the stand-in of WorkspacesChatDock.test.tsx) and samples every animation frame. It checks
// that the header never moves, the window never scrolls, the last message stays above the composer and nothing
// fades (keyboardCheckLib.ts), and tiles a recording of each run into a contact sheet. Prints one JSON line and
// exits 1 when a check fails. The flags are listed in scripts/AGENTS.md.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { devices, webkit } from 'playwright'
import { checkFrames, cubicBezier, type Frame, sheetArgs } from './keyboardCheckLib.ts'

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'https://amonhen.tail21f8a4.ts.net:5180' },
    keyboard: { type: 'string', default: '336' },
    only: { type: 'string' },
    out: { type: 'string' },
    'no-focus-scroll': { type: 'boolean', default: false },
  },
})

// The pages Erik recorded: the Workspaces phone chat (M17, R20) and the Inbox task chat (M8, R21).
const targets = [
  { name: 'workspaces', path: '/workspaces?state=phoneChatFull' },
  { name: 'inbox', path: '/inbox?state=chat' },
].filter((t) => values.only === undefined || t.name === values.only)

const keyboard = Number(values.keyboard)
const out = resolve(values.out ?? join('reports', 'keyboard', new Date().toISOString().replace(/[:.]/g, '-')))
// The library's durations.keyboard and easings.keyboard (screen review R18).
const duration = 250
const ease = cubicBezier(0.38, 0.7, 0.125, 1)
const curve = Array.from({ length: duration + 1 }, (_, ms) => ease(ms / duration))
const iphone = devices['iPhone 15']
if (targets.length === 0 || !Number.isFinite(keyboard)) {
  console.error('No page matches --only, or --keyboard is not a number.')
  process.exit(1)
}
// The installed app fills the screen: 393 × 852 pt, with no Safari bars.
const screen = { width: 393, height: 852 }

/** In the page, before the app's code: window.visualViewport is a stand-in that a 'keyboard-check:height' event moves. */
function installKeyboard() {
  class FakeViewport extends EventTarget {
    keyboard = 0
    offsetTop = 0
    offsetLeft = 0
    scale = 1
    onresize = null
    onscroll = null
    onscrollend = null
    get width() {
      return document.documentElement.clientWidth
    }
    get height() {
      return document.documentElement.clientHeight - this.keyboard
    }
    get pageTop() {
      return window.scrollY
    }
    get pageLeft() {
      return window.scrollX
    }
  }
  const fake = new FakeViewport()
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: fake })
  window.addEventListener('keyboard-check:height', (event) => {
    if (!(event instanceof CustomEvent) || typeof event.detail !== 'number') return
    fake.keyboard = event.detail
    fake.dispatchEvent(new Event('resize'))
  })
}

mkdirSync(out, { recursive: true })
const browser = await webkit.launch()
const pages = []
for (const target of targets) {
  const context = await browser.newContext({
    ...iphone,
    viewport: screen,
    ignoreHTTPSErrors: true,
    recordVideo: { dir: out, size: screen },
  })
  await context.addInitScript(installKeyboard)
  const videoStart = Date.now()
  const page = await context.newPage()
  await page.goto(values.url + target.path)
  const field = page.locator('.app-shell__detail > .scroll-frame__root > .scroll-frame__footer textarea').first()
  await field.waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  const recorder = await page.evaluateHandle(
    (o) => {
      const frames: {
        t: number
        phase: 'open' | 'close'
        keyboard: number
        headerTop: number
        scrollY: number
        lastBottom: number
        footerTop: number
        opacity: number
      }[] = []
      let phase: 'open' | 'close' = 'open'
      let height = 0
      let running = false
      let start = 0
      const chat = () => document.querySelector('.app-shell__detail > .scroll-frame__root')
      // An element's opacity as drawn: its own times each ancestor's.
      const drawn = (el: Element | null | undefined) => {
        let value = 1
        for (let at = el ?? null; at !== null; at = at.parentElement) value *= Number(getComputedStyle(at).opacity)
        return el ? value : Number.NaN
      }
      const sample = () => {
        const frame = chat()
        const header = frame?.querySelector(':scope > .scroll-frame__header')
        const body = frame?.querySelector(':scope > .scroll-frame__body')
        const footer = frame?.querySelector(':scope > .scroll-frame__footer')
        // The lowest text, image or icon in the list: a message's content, never a box that only stretches.
        let lastBottom = Number.NaN
        const lower = (r: DOMRect) => {
          if (r.width > 0 && r.height > 0)
            lastBottom = Number.isNaN(lastBottom) ? r.bottom : Math.max(lastBottom, r.bottom)
        }
        if (body) {
          const texts = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
          const range = document.createRange()
          for (let node = texts.nextNode(); node !== null; node = texts.nextNode()) {
            if ((node.textContent ?? '').trim() === '') continue
            range.selectNodeContents(node)
            lower(range.getBoundingClientRect())
          }
          for (const el of body.querySelectorAll('img, svg, canvas, video')) lower(el.getBoundingClientRect())
        }
        const shell = document.querySelector('.app-shell__root')
        return {
          t: Math.round(performance.now() - start),
          phase,
          keyboard: height,
          headerTop: header?.getBoundingClientRect().top ?? Number.NaN,
          scrollY: window.scrollY,
          lastBottom,
          footerTop: footer?.getBoundingClientRect().top ?? Number.NaN,
          opacity: Math.min(...[shell, frame, header, body, footer].map(drawn)),
        }
      }
      const loop = () => {
        if (!running) return
        frames.push(sample())
        requestAnimationFrame(loop)
      }
      // A grey box where the keyboard is, for the contact sheet. It sits outside the shell and takes no pointer.
      const drawnKeyboard = document.createElement('div')
      drawnKeyboard.dataset.keyboardCheck = ''
      Object.assign(drawnKeyboard.style, {
        position: 'fixed',
        left: '0',
        right: '0',
        bottom: '0',
        height: '0px',
        background: '#8e8e93',
        zIndex: '2147483647',
        pointerEvents: 'none',
      })
      document.documentElement.append(drawnKeyboard)
      const setKeyboard = (px: number) => {
        height = px
        drawnKeyboard.style.height = `${String(px)}px`
        window.dispatchEvent(new CustomEvent('keyboard-check:height', { detail: px }))
      }
      return {
        start() {
          start = performance.now()
          running = true
          requestAnimationFrame(loop)
        },
        // iOS scrolls the window to bring a focused field into view, by as much as the keyboard covers.
        focusScroll() {
          window.scrollTo(0, o.keyboard)
        },
        move(to: 'open' | 'close') {
          phase = to
          return new Promise<void>((done) => {
            const from = performance.now()
            const step = () => {
              const ms = Math.min(o.duration, Math.round(performance.now() - from))
              const p = o.curve[ms] ?? 1
              setKeyboard(Math.round(o.keyboard * (to === 'open' ? p : 1 - p)))
              if (ms < o.duration) requestAnimationFrame(step)
              else setTimeout(done, 400)
            }
            requestAnimationFrame(step)
          })
        },
        blur() {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        },
        stop() {
          running = false
          return frames
        },
      }
    },
    { keyboard, duration, curve },
  )
  const tapAt = Date.now()
  await recorder.evaluate((r) => {
    r.start()
  })
  await field.tap()
  if (!values['no-focus-scroll'])
    await recorder.evaluate((r) => {
      r.focusScroll()
    })
  await recorder.evaluate((r) => r.move('open'))
  await recorder.evaluate((r) => {
    r.blur()
  })
  await recorder.evaluate((r) => r.move('close'))
  const frames: Frame[] = await recorder.evaluate((r) => r.stop())
  const endAt = Date.now()
  const video = page.video()
  await context.close()
  const checks = checkFrames(frames)
  writeFileSync(join(out, `${target.name}-frames.json`), `${JSON.stringify(frames, null, 1)}\n`)
  const sheet = join(out, `${target.name}-sheet.png`)
  if (video !== null) {
    const args = sheetArgs({
      video: await video.path(),
      out: sheet,
      start: Math.max(0, (tapAt - videoStart) / 1000 - 0.2),
      seconds: (endAt - tapAt) / 1000 + 0.2,
      count: 24,
      columns: 8,
      width: 160,
    })
    execFileSync('ffmpeg', args)
  }
  pages.push({
    name: target.name,
    path: target.path,
    ok: checks.every((c) => c.ok),
    frames: frames.length,
    checks,
    sheet: video === null ? null : sheet,
  })
}
await browser.close()
const ok = pages.every((p) => p.ok)
console.log(JSON.stringify({ ok, url: values.url, keyboard, out, pages }))
process.exit(ok ? 0 : 1)
